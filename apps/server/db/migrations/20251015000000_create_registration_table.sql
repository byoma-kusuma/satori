-- migrate:up
CREATE TYPE registration_status AS ENUM ('new', 'complete', 'invalid');

-- Base updatedAt trigger (if not already present in DB)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE registration (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Source composite key fields for duplicate detection
  src_timestamp TIMESTAMP WITH TIME ZONE,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(40),
  email VARCHAR(255),

  -- Additional captured fields
  address TEXT,
  country VARCHAR(100),
  gender gender_type,

  -- Flags and raw text inputs
  previously_attended_camp BOOLEAN,
  krama_instructor_text TEXT,
  empowerment_text TEXT,
  session_text TEXT,

  -- Status tracking
  status registration_status NOT NULL DEFAULT 'new',
  invalid_reason TEXT,
  status_updated_at TIMESTAMP WITH TIME ZONE,
  status_updated_by TEXT,

  -- Import audit
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  imported_by TEXT,

  -- Timestamps
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes
CREATE INDEX idx_registration_email ON registration (LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_registration_phone ON registration (phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_registration_status ON registration (status);

-- Composite functional index to assist duplicate checks
CREATE INDEX idx_registration_dupe_key ON registration (
  src_timestamp,
  LOWER(TRIM(first_name)),
  LOWER(TRIM(last_name)),
  COALESCE(TRIM(phone), ''),
  COALESCE(LOWER(TRIM(email)), '')
);

CREATE TRIGGER update_registration_updated_at
    BEFORE UPDATE ON registration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS update_registration_updated_at ON registration;
DROP INDEX IF EXISTS idx_registration_dupe_key;
DROP INDEX IF EXISTS idx_registration_status;
DROP INDEX IF EXISTS idx_registration_phone;
DROP INDEX IF EXISTS idx_registration_email;
DROP TABLE IF EXISTS registration;
DROP TYPE IF EXISTS registration_status;
