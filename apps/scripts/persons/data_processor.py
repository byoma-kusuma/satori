"""
Data processing and transformation module
Handles CSV reading, data cleaning, and transformation
"""
import pandas as pd
import logging
from typing import Dict, List, Optional, Any, Tuple
from config import ImportConfig
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self, config: ImportConfig = None):
        self.config = config or ImportConfig()
    
    def read_csv(self, csv_path: str) -> pd.DataFrame:
        """Read CSV file with error handling"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(csv_path, encoding=encoding)
                    logger.info(f"Successfully read CSV with {encoding} encoding")
                    logger.info(f"CSV shape: {df.shape}")
                    logger.info(f"Columns: {list(df.columns)}")
                    return df
                except UnicodeDecodeError:
                    continue
            
            raise Exception(f"Could not read CSV with any of the tried encodings: {encodings}")
            
        except Exception as e:
            logger.error(f"Failed to read CSV file {csv_path}: {e}")
            raise
    
    def validate_csv_structure(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validate CSV has expected columns"""
        errors = []
        expected_columns = set(self.config.COLUMN_MAPPINGS.keys())
        actual_columns = set(df.columns)
        
        missing_columns = expected_columns - actual_columns
        if missing_columns:
            errors.append(f"Missing columns: {missing_columns}")
        
        extra_columns = actual_columns - expected_columns
        if extra_columns:
            logger.warning(f"Extra columns found (will be ignored): {extra_columns}")
        
        # Check if we have required data columns (note the spaces in actual CSV)
        required_data_columns = ['First Name(export)', 'Last Name', 'Address ']
        missing_required = [col for col in required_data_columns if col not in actual_columns]
        if missing_required:
            errors.append(f"Missing required columns: {missing_required}")
        
        return len(errors) == 0, errors
    
    def clean_row_data(self, row: pd.Series) -> Dict[str, Any]:
        """Clean and transform a single row of data"""
        cleaned_data = {}
        notes_parts = []
        
        # Process each column according to mappings
        for csv_column, db_field in self.config.COLUMN_MAPPINGS.items():
            if csv_column not in row.index:
                continue
                
            raw_value = row[csv_column]
            
            # Skip empty/null values for unmapped columns
            if db_field is None:
                if csv_column in self.config.NOTES_FIELDS and pd.notna(raw_value) and str(raw_value).strip():
                    notes_parts.append(f"{csv_column}: {raw_value}")
                continue
            
            # Clean the value based on field type
            if db_field in self.config.FIELD_CLEANERS:
                cleaned_value = self.config.FIELD_CLEANERS[db_field](raw_value)
            else:
                # Default cleaning for string fields
                cleaned_value = self._clean_string_value(raw_value)
            
            if cleaned_value is not None:
                cleaned_data[db_field] = cleaned_value
        
        # Add notes from unmapped fields
        if notes_parts:
            existing_notes = cleaned_data.get('notes', '')
            if existing_notes:
                cleaned_data['notes'] = f"{existing_notes}\n\nImported data:\n" + "\n".join(notes_parts)
            else:
                cleaned_data['notes'] = "Imported data:\n" + "\n".join(notes_parts)
        
        # Add default values
        for field, default_value in self.config.DEFAULT_VALUES.items():
            if field not in cleaned_data:
                cleaned_data[field] = default_value
        
        # Generate UUID for id field
        cleaned_data['id'] = str(uuid.uuid4())
        
        # Add timestamps
        now = datetime.now()
        cleaned_data['createdAt'] = now
        cleaned_data['updatedAt'] = now
        
        return cleaned_data
    
    def _clean_string_value(self, value: Any) -> Optional[str]:
        """Clean string values"""
        if pd.isna(value) or value is None:
            return None
        
        cleaned = str(value).strip()
        return cleaned if cleaned else None
    
    def validate_row_data(self, row_data: Dict[str, Any], row_index: int) -> Tuple[bool, List[str]]:
        """Validate a single row of cleaned data"""
        errors = []
        
        # Check required fields
        for field in self.config.REQUIRED_FIELDS:
            if field not in row_data or row_data[field] is None or row_data[field] == '':
                errors.append(f"Row {row_index}: Missing required field '{field}'")
        
        # Validate field types and constraints
        if 'yearOfRefuge' in row_data and row_data['yearOfRefuge'] is not None:
            year = row_data['yearOfRefuge']
            # Allow Nepali calendar years (up to 2084) and Gregorian years
            if not isinstance(year, int) or year < 1900 or year > 2084:
                errors.append(f"Row {row_index}: Invalid yearOfRefuge '{year}'")
        
        if 'emailId' in row_data and row_data['emailId']:
            email = row_data['emailId']
            if '@' not in email or '.' not in email.split('@')[1]:
                errors.append(f"Row {row_index}: Invalid email format '{email}'")
        
        # Validate enum values
        enum_fields = {
            'center': ['Nepal', 'USA', 'Australia', 'UK'],
            'type': ['interested', 'contact', 'sangha_member', 'attended_orientation'],
            'membershipType': ['Life Time', 'Board Member', 'General Member', 'Honorary Member'],
            'yearOfRefugeCalendarType': ['BS', 'AD'],
            'title': ['dharma_dhar', 'sahayak_dharmacharya', 'sahayak_samathacharya'],
            'gender': ['male', 'female', 'other', 'prefer_not_to_say']
        }
        
        for field, valid_values in enum_fields.items():
            if field in row_data and row_data[field] is not None:
                if row_data[field] not in valid_values:
                    errors.append(f"Row {row_index}: Invalid {field} value '{row_data[field]}'. Must be one of: {valid_values}")
        
        return len(errors) == 0, errors
    
    def process_csv_data(self, df: pd.DataFrame, skip_duplicates: bool = True) -> Tuple[List[Dict[str, Any]], List[str]]:
        """Process entire CSV DataFrame"""
        processed_data = []
        all_errors = []
        duplicate_count = 0
        
        logger.info(f"Processing {len(df)} rows...")
        
        for index, row in df.iterrows():
            if (index + 1) % 50 == 0:
                logger.info(f"Processing row {index + 1}/{len(df)}")
            try:
                # Clean the row data
                cleaned_data = self.clean_row_data(row)
                
                # Validate the cleaned data
                is_valid, errors = self.validate_row_data(cleaned_data, index + 1)
                
                if not is_valid:
                    all_errors.extend(errors)
                    logger.warning(f"Row {index + 1} validation failed: {errors}")
                    continue
                
                # Check for duplicates within processed data
                if skip_duplicates:
                    is_duplicate = any(
                        existing['firstName'] == cleaned_data['firstName'] and
                        existing['lastName'] == cleaned_data['lastName'] and
                        existing.get('emailId') == cleaned_data.get('emailId')
                        for existing in processed_data
                    )
                    
                    if is_duplicate:
                        duplicate_count += 1
                        logger.warning(f"Row {index + 1}: Duplicate person found, skipping")
                        continue
                
                processed_data.append(cleaned_data)
                
            except Exception as e:
                error_msg = f"Row {index + 1}: Processing error - {e}"
                all_errors.append(error_msg)
                logger.error(error_msg)
        
        logger.info(f"Successfully processed {len(processed_data)} rows")
        logger.info(f"Skipped {duplicate_count} duplicates")
        logger.info(f"Found {len(all_errors)} errors")
        
        return processed_data, all_errors
    
    def generate_preview(self, df: pd.DataFrame, num_rows: int = 5) -> str:
        """Generate a preview of the data for review"""
        preview_lines = [
            "=== CSV DATA PREVIEW ===",
            f"Total rows: {len(df)}",
            f"Total columns: {len(df.columns)}",
            "",
            "Columns:",
        ]
        
        for i, col in enumerate(df.columns):
            mapped_field = self.config.COLUMN_MAPPINGS.get(col, 'NOT MAPPED')
            preview_lines.append(f"  {i+1:2d}. {col} -> {mapped_field}")
        
        preview_lines.extend([
            "",
            f"First {num_rows} rows:",
            ""
        ])
        
        # Show first few rows
        for index, row in df.head(num_rows).iterrows():
            preview_lines.append(f"Row {index + 1}:")
            for col in df.columns:
                value = row[col]
                if pd.isna(value):
                    value = "NULL"
                elif isinstance(value, str) and len(str(value)) > 50:
                    value = str(value)[:47] + "..."
                preview_lines.append(f"  {col}: {value}")
            preview_lines.append("")
        
        return "\n".join(preview_lines)
    
    def generate_summary(self, processed_data: List[Dict[str, Any]], errors: List[str]) -> str:
        """Generate processing summary"""
        summary_lines = [
            "=== PROCESSING SUMMARY ===",
            f"Successfully processed: {len(processed_data)} records",
            f"Errors found: {len(errors)}",
            ""
        ]
        
        if processed_data:
            # Count non-null values for each field
            field_stats = {}
            for record in processed_data:
                for field, value in record.items():
                    if field not in field_stats:
                        field_stats[field] = {'total': 0, 'non_null': 0}
                    field_stats[field]['total'] += 1
                    if value is not None and value != '':
                        field_stats[field]['non_null'] += 1
            
            summary_lines.append("Field completion rates:")
            for field, stats in sorted(field_stats.items()):
                percentage = (stats['non_null'] / stats['total']) * 100 if stats['total'] > 0 else 0
                summary_lines.append(f"  {field}: {stats['non_null']}/{stats['total']} ({percentage:.1f}%)")
        
        if errors:
            summary_lines.extend([
                "",
                "Errors:",
                *[f"  - {error}" for error in errors[:10]]  # Show first 10 errors
            ])
            
            if len(errors) > 10:
                summary_lines.append(f"  ... and {len(errors) - 10} more errors")
        
        return "\n".join(summary_lines)