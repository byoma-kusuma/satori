"""
Database connection and operations module
Handles PostgreSQL connections with Docker support
"""
import psycopg2
import psycopg2.extras
import subprocess
import logging
from typing import Dict, List, Optional, Any
from contextlib import contextmanager
from config import ImportConfig

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or ImportConfig.DB_CONFIG
        self.connection = None
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    return result[0] == 1
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
    
    def test_docker_connection(self) -> bool:
        """Test connection via Docker"""
        try:
            # Try without sudo first
            cmd = [
                "docker", "exec", "-i", "server-db-1", 
                "psql", "-U", self.config['user'], "-d", self.config['database'],
                "-c", "SELECT 1;"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                return True
            
            # Fallback to sudo if needed
            cmd = [
                "sudo", "docker", "exec", "-i", "server-db-1", 
                "psql", "-U", self.config['user'], "-d", self.config['database'],
                "-c", "SELECT 1;"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Docker connection test failed: {e}")
            return False
    
    @contextmanager
    def get_connection(self):
        """Get database connection with automatic cleanup"""
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            conn.autocommit = False
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_via_docker(self, query: str, params: tuple = None) -> bool:
        """Execute query via Docker exec"""
        try:
            # Format query with parameters if provided
            if params:
                formatted_query = query % params
            else:
                formatted_query = query
            
            cmd = [
                "docker", "exec", "-i", "server-db-1",
                "psql", "-U", self.config['user'], "-d", self.config['database'],
                "-c", formatted_query
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                logger.error(f"Docker query failed: {result.stderr}")
                return False
            
            logger.info(f"Docker query successful: {result.stdout}")
            return True
            
        except Exception as e:
            logger.error(f"Docker query execution error: {e}")
            return False
    
    def insert_person(self, person_data: Dict[str, Any], use_docker: bool = False) -> bool:
        """Insert a single person record"""
        try:
            # Build insert query dynamically based on provided fields
            fields = list(person_data.keys())
            placeholders = ', '.join(['%s'] * len(fields))
            field_names = ', '.join([f'"{field}"' for field in fields])
            
            query = f"""
                INSERT INTO person ({field_names})
                VALUES ({placeholders})
            """
            
            values = tuple(person_data[field] for field in fields)
            
            if use_docker:
                # For docker, we need to format the query differently
                formatted_values = []
                for value in values:
                    if value is None:
                        formatted_values.append('NULL')
                    elif isinstance(value, bool):
                        formatted_values.append('TRUE' if value else 'FALSE')
                    elif isinstance(value, (int, float)):
                        formatted_values.append(str(value))
                    else:
                        # Escape single quotes for strings
                        escaped_value = str(value).replace("'", "''")
                        formatted_values.append(f"'{escaped_value}'")
                
                docker_query = f"""
                    INSERT INTO person ({field_names})
                    VALUES ({', '.join(formatted_values)})
                """
                
                return self.execute_via_docker(docker_query)
            else:
                with self.get_connection() as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(query, values)
                        conn.commit()
                        return True
                        
        except Exception as e:
            logger.error(f"Failed to insert person: {e}")
            logger.error(f"Person data: {person_data}")
            return False
    
    def batch_insert_persons(self, persons_data: List[Dict[str, Any]], use_docker: bool = False, batch_size: int = 100) -> Dict[str, int]:
        """Insert multiple person records in batches"""
        results = {'success': 0, 'failed': 0, 'errors': []}
        
        if use_docker:
            # For Docker, insert one by one (could be optimized with a temp file approach)
            for person_data in persons_data:
                if self.insert_person(person_data, use_docker=True):
                    results['success'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to insert: {person_data.get('firstName', 'Unknown')} {person_data.get('lastName', '')}")
        else:
            # Use efficient batch insert for direct connection
            try:
                with self.get_connection() as conn:
                    with conn.cursor() as cursor:
                        for i in range(0, len(persons_data), batch_size):
                            batch = persons_data[i:i + batch_size]
                            
                            for person_data in batch:
                                try:
                                    fields = list(person_data.keys())
                                    placeholders = ', '.join(['%s'] * len(fields))
                                    field_names = ', '.join([f'"{field}"' for field in fields])
                                    
                                    query = f"""
                                        INSERT INTO person ({field_names})
                                        VALUES ({placeholders})
                                    """
                                    
                                    values = tuple(person_data[field] for field in fields)
                                    cursor.execute(query, values)
                                    results['success'] += 1
                                    
                                except Exception as e:
                                    results['failed'] += 1
                                    error_msg = f"Failed to insert {person_data.get('firstName', 'Unknown')} {person_data.get('lastName', '')}: {e}"
                                    results['errors'].append(error_msg)
                                    logger.error(error_msg)
                            
                            conn.commit()
                            logger.info(f"Committed batch {i//batch_size + 1}")
                            
            except Exception as e:
                logger.error(f"Batch insert failed: {e}")
                results['errors'].append(f"Batch insert error: {e}")
        
        return results
    
    def check_existing_person(self, first_name: str, last_name: str, email: str = None) -> bool:
        """Check if person already exists in database"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    if email:
                        cursor.execute("""
                            SELECT id FROM person 
                            WHERE "firstName" = %s AND "lastName" = %s AND "emailId" = %s
                        """, (first_name, last_name, email))
                    else:
                        cursor.execute("""
                            SELECT id FROM person 
                            WHERE "firstName" = %s AND "lastName" = %s
                        """, (first_name, last_name))
                    
                    return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"Failed to check existing person: {e}")
            return False
    
    def get_stats(self) -> Dict[str, int]:
        """Get database statistics"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM person")
                    total_persons = cursor.fetchone()[0]
                    
                    cursor.execute("""
                        SELECT COUNT(*) FROM person 
                        WHERE "createdBy" = 'csv_import_script'
                    """)
                    imported_persons = cursor.fetchone()[0]
                    
                    return {
                        'total_persons': total_persons,
                        'imported_persons': imported_persons
                    }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {'total_persons': 0, 'imported_persons': 0}