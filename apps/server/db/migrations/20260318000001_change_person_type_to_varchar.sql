-- migrate:up
-- Change person.type from enum to varchar, preserving existing data
ALTER TABLE person ALTER COLUMN type TYPE VARCHAR(64) USING type::VARCHAR;
ALTER TABLE person ALTER COLUMN type SET DEFAULT 'interested';

-- migrate:down
