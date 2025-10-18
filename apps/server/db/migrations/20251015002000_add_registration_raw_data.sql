-- migrate:up
ALTER TABLE registration ADD COLUMN raw_data JSONB;

CREATE INDEX idx_registration_raw_data ON registration USING gin (raw_data);

-- migrate:down
DROP INDEX IF EXISTS idx_registration_raw_data;
ALTER TABLE registration DROP COLUMN IF EXISTS raw_data;
