-- migrate:up
ALTER TABLE registration ADD COLUMN import_batch_id uuid;
CREATE INDEX IF NOT EXISTS idx_registration_import_batch ON registration(import_batch_id);

-- migrate:down
DROP INDEX IF EXISTS idx_registration_import_batch;
ALTER TABLE registration DROP COLUMN IF EXISTS import_batch_id;

