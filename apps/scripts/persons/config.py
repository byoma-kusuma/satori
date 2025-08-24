"""
Configuration module for CSV import
Contains all mappings and transformations that can be easily modified
"""
from typing import Dict, List, Optional, Any, Callable
import re
from datetime import datetime

class ImportConfig:
    # Database connection settings
    DB_CONFIG = {
        'host': 'localhost',
        'port': 5433,  # Docker host port from .env DB_HOST_PORT
        'database': 'satori',
        'user': 'postgres',
        'password': 'pailaharu'  # From deployment .env DB_PASS
    }
    
    # CSV column mappings to database fields
    COLUMN_MAPPINGS = {
        'Phone tree yes/no': None,  # Skip this column
        'First Name(export)': 'firstName',
        'Last Name': 'lastName', 
        'Membership Fee 2018/2019': None,  # Skip - could add to notes
        'Membership Type': 'membershipType',
        'Photo?': 'hasMembershipCard',  # Assuming Photo? means has membership card
        'Membership Card Number ': 'membershipCardNumber',  # Note the space
        'Recieved Y/N': None,  # Skip - redundant with Photo?
        'Year of Refuge Calendar Type': 'yearOfRefugeCalendarType',
        'Year of Refuge': 'yearOfRefuge',
        'Date of Application': None,  # Skip - could add to notes
        'Refuge Name ': 'refugeName',  # Note the space
        'Address ': 'address',  # Note the space
        'Unnamed: 13': None,  # Empty column - skip
        'Unnamed: 23': None,  # Empty column - skip
        'Email Address': 'emailId',
        'Primary Phone number': 'primaryPhone',
        'Secondary Phone Number': 'secondaryPhone',
        'Education ': None,  # Skip - could add to notes (note the space)
        'Occupation': 'occupation',
        'Empowerments': None,  # Skip - could add to notes
        'Year received': None,  # Skip - could add to notes
        'MahaKrama Level': None,  # Skip - could add to notes
        'Dharma Instructor': 'title',
        'Remarks': 'notes',
        # Add all the unnamed columns to skip them
        'Unnamed: 25': None,
        'Unnamed: 26': None,
        'Unnamed: 27': None,
        'Unnamed: 28': None,
        'Unnamed: 29': None,
        'Unnamed: 30': None,
        'Unnamed: 31': None,
        'Unnamed: 32': None,
        'Unnamed: 33': None,
        'Unnamed: 34': None
    }
    
    # Default values for required fields
    DEFAULT_VALUES = {
        'center': 'Nepal',
        'type': 'sangha_member',
        'createdBy': 'csv_import_script',
        'lastUpdatedBy': 'csv_import_script'
    }
    
    # Data cleaning functions
    @staticmethod
    def clean_phone_number(phone: str) -> Optional[str]:
        """Clean and format phone numbers"""
        if not phone or pd.isna(phone):
            return None
        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d+]', '', str(phone))
        return cleaned if cleaned else None
    
    @staticmethod
    def clean_email(email: str) -> Optional[str]:
        """Validate and clean email addresses"""
        if not email or pd.isna(email):
            return None
        email = str(email).strip().lower()
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return email if re.match(email_pattern, email) else None
    
    @staticmethod
    def clean_year(year: str) -> Optional[int]:
        """Clean and validate year values"""
        nepal_max_year = 2084  # Example max year in Nepali calendar
        if not year or pd.isna(year):
            return None
        try:
            year_int = int(float(str(year)))
            return year_int if 1900 <= year_int <= nepal_max_year else None
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def clean_boolean(value: str) -> Optional[bool]:
        """Convert Yes/No, Y/N to boolean"""
        if not value or pd.isna(value):
            return None
        value_str = str(value).strip().lower()
        if value_str in ['yes', 'y', 'true', '1']:
            return True
        elif value_str in ['no', 'n', 'false', '0']:
            return False
        return None
    
    @staticmethod
    def map_membership_type(membership_type: str) -> Optional[str]:
        """Map membership type to enum values"""
        if not membership_type or pd.isna(membership_type):
            return None
        
        mapping = {
            'life time': 'Life Time',
            'lifetime': 'Life Time',
            'board member': 'Board Member',
            'general member': 'General Member',
            'honorary member': 'Honorary Member'
        }
        
        cleaned = str(membership_type).strip().lower()
        return mapping.get(cleaned)
    
    @staticmethod
    def map_calendar_type(calendar_type: str) -> Optional[str]:
        """Map calendar type to enum values"""
        if not calendar_type or pd.isna(calendar_type):
            return None
        
        cleaned = str(calendar_type).strip().upper()
        return cleaned if cleaned in ['BS', 'AD'] else None
    
    @staticmethod
    def map_title(title: str) -> Optional[str]:
        """Map dharma instructor title to enum values"""
        if not title or pd.isna(title):
            return None
        
        mapping = {
            'dharma dhar': 'dharma_dhar',
            'sahayak dharmacharya': 'sahayak_dharmacharya',
            'sahayak samathacharya': 'sahayak_samathacharya'
        }
        
        cleaned = str(title).strip().lower()
        return mapping.get(cleaned)
    
    @staticmethod
    def determine_refugee_status(row_data: dict) -> bool:
        """Determine if person has taken refuge based on available data"""
        # Check if any refuge-related fields have meaningful values
        refuge_indicators = [
            row_data.get('Year of Refuge'),
            row_data.get('Refuge Name '),  # Note the space
            row_data.get('Empowerments')
        ]
        
        for indicator in refuge_indicators:
            if indicator and pd.notna(indicator) and str(indicator).strip():
                return True
        
        return False
    
    # Field-specific cleaning functions
    FIELD_CLEANERS: Dict[str, Callable[[Any], Any]] = {
        'primaryPhone': clean_phone_number.__func__,
        'secondaryPhone': clean_phone_number.__func__,
        'emailId': clean_email.__func__,
        'yearOfRefuge': clean_year.__func__,
        'hasMembershipCard': clean_boolean.__func__,
        'membershipType': map_membership_type.__func__,
        'yearOfRefugeCalendarType': map_calendar_type.__func__,
        'title': map_title.__func__
    }
    
    # Required fields that must not be null
    REQUIRED_FIELDS = ['firstName', 'lastName', 'address', 'center', 'type', 'createdBy', 'lastUpdatedBy']
    
    # Fields that should be included in notes if not mapped
    NOTES_FIELDS = [
        'Membership Fee 2018/2019',
        'Date of Application', 
        'Education ',  # Note the space
        'Empowerments',
        'Year received',
        'MahaKrama Level'
    ]

# Import pandas here to avoid circular imports
import pandas as pd