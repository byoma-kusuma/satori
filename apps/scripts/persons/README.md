# Persons CSV Import Script

A Python script to import person data from CSV files into the PostgreSQL database. Supports both direct database connections and Docker-based connections.

> **🚀 Quick Start**: See [QUICKSTART.md](QUICKSTART.md) for step-by-step instructions!

## Features

- **Flexible Database Connection**: Supports both direct PostgreSQL connections and Docker exec commands
- **Data Validation**: Validates CSV structure and data integrity before import
- **Data Cleaning**: Automatically cleans and transforms data according to database schema
- **Duplicate Detection**: Skips duplicate records based on name and email
- **Error Handling**: Comprehensive error reporting and logging
- **Dry Run Mode**: Preview and validate data without importing
- **Batch Processing**: Efficient batch inserts for large datasets

## Setup

### Prerequisites
- Python 3.7+
- Docker (if using Docker connection method)
- sudo access for Docker commands

### Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Make script executable
chmod +x import_persons.py
```

## Configuration

Edit `config.py` to modify:

### Database Connection
```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'satori',
    'user': 'postgres',
    'password': 'password'
}
```

### Column Mappings
```python
COLUMN_MAPPINGS = {
    'First Name(export)': 'firstName',
    'Last Name': 'lastName',
    # ... add or modify mappings
}
```

### Data Cleaning Functions
Add custom cleaning functions in `FIELD_CLEANERS`:
```python
FIELD_CLEANERS = {
    'emailId': clean_email,
    'phoneNumber': clean_phone_number,
    # ... add custom cleaners
}
```

## Usage

### Basic Import
```bash
python import_persons.py "path/to/your/file.csv"
```

### Preview Data Only
```bash
python import_persons.py --preview-only "your_file.csv"
```

### Dry Run (Validate Without Importing)
```bash
python import_persons.py --dry-run "your_file.csv"
```

### Using Docker Connection
```bash
python import_persons.py --use-docker "your_file.csv"
```

### With Custom Options
```bash
python import_persons.py \\
    --use-docker \\
    --batch-size 50 \\
    --log-level DEBUG \\
    --log-file import.log \\
    "your_file.csv"
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `csv_file` | Path to CSV file | `../Membership Byoma Kusuma.csv` |
| `--dry-run` | Process data but don't insert | False |
| `--use-docker` | Use Docker for database connection | False |
| `--skip-duplicates` | Skip duplicate records | True |
| `--batch-size` | Records per batch | 100 |
| `--preview-only` | Only show data preview | False |
| `--log-level` | Logging level (DEBUG/INFO/WARNING/ERROR) | INFO |
| `--log-file` | Log file path | None (console only) |

## Data Mapping

The script maps CSV columns to database fields according to `config.py`. See `csv-to-database-mapping.md` for detailed mapping information.

### Mapped Fields
- Personal info: firstName, lastName, address, emailId
- Contact: primaryPhone, secondaryPhone
- Membership: membershipType, membershipCardNumber, hasMembershipCard
- Refuge info: refugeName, yearOfRefuge, yearOfRefugeCalendarType
- Other: occupation, title, notes

### Unmapped Fields
Fields not mapped to database columns are automatically added to the `notes` field for reference.

## Error Handling

### Common Issues
1. **CSV encoding problems**: Script tries multiple encodings automatically
2. **Missing required fields**: Validates firstName, lastName, address are present
3. **Invalid data**: Cleans phone numbers, emails, years automatically
4. **Database connection**: Supports both direct and Docker connections

### Error Reporting
- Validation errors are logged with row numbers
- Import errors include person names for easy identification
- Failed records don't stop the entire import process

## Examples

### Successful Import Output
```
=== PROCESSING SUMMARY ===
Successfully processed: 150 records
Errors found: 5

IMPORT RESULTS:
  Successfully imported: 145 records
  Failed imports: 5 records
  Total persons in database: 200
  Imported by script: 145
```

### Preview Output
```
=== CSV DATA PREVIEW ===
Total rows: 150
Total columns: 25

Columns:
   1. First Name(export) -> firstName
   2. Last Name -> lastName
   3. Membership Type -> membershipType
   ...

First 5 rows:
Row 1:
  First Name(export): John
  Last Name: Smith
  Address: 123 Main St
  ...
```

## Troubleshooting

### Database Connection Issues
1. **Direct connection fails**: Try `--use-docker` flag
2. **Docker connection fails**: Check Docker is running and accessible with `sudo`
3. **Permission denied**: Ensure user has database access

### Data Issues
1. **Encoding errors**: Script handles common encodings automatically
2. **Missing data**: Check required fields are present in CSV
3. **Validation errors**: Review error messages for specific issues

### Performance Issues
1. **Large datasets**: Reduce `--batch-size`
2. **Docker slow**: Consider direct connection if possible
3. **Memory issues**: Process data in smaller files

## File Structure
```
import-persons-data/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── config.py                    # Configuration and mappings
├── database.py                  # Database connection and operations
├── data_processor.py           # Data cleaning and transformation
├── import_persons.py           # Main script
└── csv-to-database-mapping.md # Detailed mapping documentation
```

## Customization

### Adding New Field Mappings
1. Update `COLUMN_MAPPINGS` in `config.py`
2. Add cleaning function to `FIELD_CLEANERS` if needed
3. Update validation rules in `data_processor.py`

### Custom Data Cleaning
Create cleaning functions in `config.py`:
```python
@staticmethod
def clean_custom_field(value):
    # Your cleaning logic here
    return cleaned_value

# Add to FIELD_CLEANERS
FIELD_CLEANERS['customField'] = clean_custom_field
```

### Adding Validation Rules
Extend `validate_row_data()` in `data_processor.py` for custom validation logic.

## Security Notes
- Script uses parameterized queries to prevent SQL injection
- Docker commands use sudo - ensure secure environment
- Logs may contain sensitive data - handle appropriately