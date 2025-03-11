-- migrate:up
-- Create a new ENUM type for person type
CREATE TYPE person_type AS ENUM ('interested', 'contact', 'sangha_member');

-- Add the new type column to the person table with a default value of 'interested'
ALTER TABLE person 
  ADD COLUMN "type" person_type NOT NULL DEFAULT 'interested';

-- Create an index on the new type column
CREATE INDEX idx_person_type ON person("type");

-- migrate:down
-- Drop the index first
DROP INDEX IF EXISTS idx_person_type;

-- Remove the column
ALTER TABLE person DROP COLUMN IF EXISTS "type";

-- Drop the enum type
DROP TYPE IF EXISTS person_type;