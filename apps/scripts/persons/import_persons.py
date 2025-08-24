#!/usr/bin/env python3
"""
Main script for importing persons from CSV to database
Supports both direct database connection and Docker-based connection
"""
import argparse
import logging
import sys
import os
from datetime import datetime
from typing import Dict, Any

from config import ImportConfig
from data_processor import DataProcessor

# Import database manager only when needed
DatabaseManager = None

# Setup logging
def setup_logging(log_level: str = 'INFO', log_file: str = None):
    """Setup logging configuration"""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Add file handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter(log_format))
        logging.getLogger().addHandler(file_handler)

def validate_environment(preview_only=False, use_docker=False):
    """Validate the environment and dependencies"""
    errors = []
    
    # Check if CSV file exists
    csv_path = "Membership Byoma Kusuma.csv"
    if not os.path.exists(csv_path):
        errors.append(f"CSV file not found: {csv_path}")
    
    # Only check Docker if using Docker mode and not preview-only
    if use_docker and not preview_only:
        # Check Docker availability if needed
        try:
            import subprocess
            result = subprocess.run(['docker', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                errors.append("Docker not accessible")
        except Exception as e:
            errors.append(f"Docker check failed: {e}")
    
    return errors

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Import persons from CSV to database')
    parser.add_argument('csv_file', nargs='?', 
                       default='Membership Byoma Kusuma.csv',
                       help='Path to CSV file (default: Membership Byoma Kusuma.csv)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Process data but do not insert into database')
    parser.add_argument('--use-docker', action='store_true',
                       help='Use Docker to connect to database')
    parser.add_argument('--skip-duplicates', action='store_true', default=True,
                       help='Skip duplicate records (default: True)')
    parser.add_argument('--batch-size', type=int, default=100,
                       help='Batch size for database inserts (default: 100)')
    parser.add_argument('--preview-only', action='store_true',
                       help='Only show data preview, do not process')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       default='INFO', help='Logging level')
    parser.add_argument('--log-file', help='Log file path (optional)')
    parser.add_argument('--force', action='store_true',
                       help='Skip confirmation prompts and proceed with import')
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.log_level, args.log_file)
    logger = logging.getLogger(__name__)
    
    logger.info("=== PERSONS CSV IMPORT STARTED ===" + "="*50)
    logger.info(f"CSV file: {args.csv_file}")
    logger.info(f"Dry run: {args.dry_run}")
    logger.info(f"Use Docker: {args.use_docker}")
    logger.info(f"Skip duplicates: {args.skip_duplicates}")
    
    try:
        # Validate environment
        logger.info("Validating environment...")
        env_errors = validate_environment(preview_only=args.preview_only or args.dry_run, use_docker=args.use_docker)
        if env_errors:
            logger.error("Environment validation failed:")
            for error in env_errors:
                logger.error(f"  - {error}")
            return 1
        
        # Initialize components
        config = ImportConfig()
        data_processor = DataProcessor(config)
        
        # Initialize database manager only if needed
        db_manager = None
        if not args.dry_run and not args.preview_only:
            try:
                from database import DatabaseManager
                db_manager = DatabaseManager(config.DB_CONFIG)
            except ImportError as e:
                logger.error(f"Database module import failed: {e}")
                logger.error("Install psycopg2-binary for database functionality: pip install psycopg2-binary")
                return 1
        
        # Test database connection
        if not args.dry_run and not args.preview_only:
            logger.info("Testing database connection...")
            if args.use_docker:
                if not db_manager.test_docker_connection():
                    logger.error("Docker database connection failed")
                    return 1
                logger.info("Docker database connection successful")
            else:
                if not db_manager.test_connection():
                    logger.error("Direct database connection failed")
                    logger.info("Try using --use-docker flag")
                    return 1
                logger.info("Direct database connection successful")
        
        # Read and validate CSV
        logger.info("Reading CSV file...")
        df = data_processor.read_csv(args.csv_file)
        
        logger.info("Validating CSV structure...")
        is_valid, validation_errors = data_processor.validate_csv_structure(df)
        if not is_valid:
            logger.error("CSV validation failed:")
            for error in validation_errors:
                logger.error(f"  - {error}")
            return 1
        
        # Generate preview
        preview = data_processor.generate_preview(df)
        logger.info("\\n" + preview)
        
        if args.preview_only:
            logger.info("Preview-only mode. Exiting.")
            return 0
        
        # Process data
        logger.info("Processing CSV data...")
        processed_data, processing_errors = data_processor.process_csv_data(
            df, skip_duplicates=args.skip_duplicates
        )
        
        # Generate summary
        summary = data_processor.generate_summary(processed_data, processing_errors)
        logger.info("\\n" + summary)
        
        if not processed_data:
            logger.error("No valid data to import")
            return 1
        
        if processing_errors:
            logger.warning(f"Found {len(processing_errors)} processing errors")
            if not args.force:
                response = input("Continue with import? (y/N): ")
                if response.lower() != 'y':
                    logger.info("Import cancelled by user")
                    return 0
            else:
                logger.info("Force flag set - proceeding with import despite errors")
        
        if args.dry_run:
            logger.info("Dry run mode - not inserting data into database")
            logger.info(f"Would have inserted {len(processed_data)} records")
            return 0
        
        # Import data to database
        logger.info(f"Importing {len(processed_data)} records to database...")
        
        # Get current stats
        initial_stats = db_manager.get_stats()
        logger.info(f"Database stats before import: {initial_stats}")
        
        # Perform import
        import_results = db_manager.batch_insert_persons(
            processed_data, 
            use_docker=args.use_docker,
            batch_size=args.batch_size
        )
        
        # Get final stats
        final_stats = db_manager.get_stats()
        logger.info(f"Database stats after import: {final_stats}")
        
        # Report results
        logger.info("\\n" + "="*70)
        logger.info("IMPORT RESULTS:")
        logger.info(f"  Successfully imported: {import_results['success']} records")
        logger.info(f"  Failed imports: {import_results['failed']} records")
        logger.info(f"  Total persons in database: {final_stats['total_persons']}")
        logger.info(f"  Imported by script: {final_stats['imported_persons']}")
        
        if import_results['errors']:
            logger.warning("\\nImport errors:")
            for error in import_results['errors'][:10]:  # Show first 10 errors
                logger.warning(f"  - {error}")
            if len(import_results['errors']) > 10:
                logger.warning(f"  ... and {len(import_results['errors']) - 10} more errors")
        
        logger.info("=== IMPORT COMPLETED ===" + "="*50)
        
        return 0 if import_results['failed'] == 0 else 1
        
    except KeyboardInterrupt:
        logger.info("\\nImport cancelled by user")
        return 1
    except Exception as e:
        logger.error(f"Import failed with error: {e}")
        logger.exception("Full error details:")
        return 1

if __name__ == '__main__':
    sys.exit(main())