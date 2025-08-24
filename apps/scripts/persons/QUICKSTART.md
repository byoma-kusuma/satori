# Quick Start Guide - Persons CSV Import

## Prerequisites
- Python 3.7+ installed
- CSV file named `Membership Byoma Kusuma.csv` in the same directory as the scripts

## Step-by-Step Instructions

### 1. Install Dependencies
```bash
cd apps/scripts/persons
pip install pandas python-dotenv
```

### 2. Preview Your Data (Recommended First Step)
```bash
python import_persons.py --preview-only
```
This will show you:
- How many rows and columns are in your CSV
- Column mappings to database fields
- Sample data from the first 5 rows

### 3. Validate Data Processing (Dry Run)
```bash
python import_persons.py --dry-run
```
This will:
- Process all data and show cleaning results
- Report any validation errors
- Show how many records would be imported
- **Does NOT insert anything into the database**

### 4. Import to Database
**Option A: Using Docker (Recommended)**
```bash
python import_persons.py --use-docker
```

**Option B: Direct Database Connection** 
```bash
# First install database driver:
pip install psycopg2-binary

# Then run import:
python import_persons.py
```

### 5. Monitor Progress
For detailed logging during import:
```bash
python import_persons.py --use-docker --log-level DEBUG --log-file import.log
```

## Expected Output

### Successful Preview
```
=== CSV DATA PREVIEW ===
Total rows: 442
Total columns: 35

Columns:
   1. Phone tree yes/no -> None
   2. First Name(export) -> firstName
   3. Last Name -> lastName
   ...

First 5 rows:
Row 1:
  First Name(export): Aabha
  Last Name: Budathoki
  Address : Budanilkantha 
  ...
```

### Successful Import
```
IMPORT RESULTS:
  Successfully imported: 400 records
  Failed imports: 5 records  
  Total persons in database: 450
  Imported by script: 400
```

## Troubleshooting Common Issues

### 1. "CSV file not found"
- Make sure `Membership Byoma Kusuma.csv` is in the same folder as the scripts
- Check the exact filename and spelling

### 2. "Module not found" errors
```bash
pip install pandas python-dotenv psycopg2-binary
```

### 3. "Docker not accessible" 
- Make sure Docker is running
- Ensure you can run `sudo docker ps`
- Use direct connection instead: `python import_persons.py` (without --use-docker)

### 4. Database connection failed
- Check if the PostgreSQL container is running
- Verify database credentials in `config.py`
- Try the Docker option: `--use-docker`

## Files Explained
- `import_persons.py` - Main script to run
- `config.py` - Column mappings and data cleaning rules
- `requirements.txt` - Python dependencies
- `README.md` - Complete documentation

## Next Steps After Import
1. Check the database to verify your data was imported correctly
2. Review any import errors in the logs
3. Update person records as needed through the admin interface