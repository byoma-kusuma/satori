-- migrate:up
-- Add Krama Instructor fields to Person table

-- Add boolean column to indicate if person is a Krama Instructor
ALTER TABLE person ADD COLUMN is_krama_instructor BOOLEAN DEFAULT FALSE;

-- Add foreign key column to reference the person's assigned Krama Instructor
ALTER TABLE person ADD COLUMN krama_instructor_person_id UUID;

-- Add foreign key constraint
ALTER TABLE person ADD CONSTRAINT fk_person_krama_instructor 
    FOREIGN KEY (krama_instructor_person_id) REFERENCES person(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_person_is_krama_instructor ON person(is_krama_instructor);
CREATE INDEX idx_person_krama_instructor_id ON person(krama_instructor_person_id);

-- migrate:down
-- Remove Krama Instructor fields from Person table

-- Drop indexes
DROP INDEX IF EXISTS idx_person_krama_instructor_id;
DROP INDEX IF EXISTS idx_person_is_krama_instructor;

-- Drop foreign key constraint
ALTER TABLE person DROP CONSTRAINT IF EXISTS fk_person_krama_instructor;

-- Drop columns
ALTER TABLE person DROP COLUMN IF EXISTS krama_instructor_person_id;
ALTER TABLE person DROP COLUMN IF EXISTS is_krama_instructor;