-- migrate:up
ALTER TABLE mahakrama_history DROP CONSTRAINT IF EXISTS mahakrama_history_status_check;
ALTER TABLE mahakrama_history ADD CONSTRAINT mahakrama_history_status_check CHECK (status IN ('current','completed','requested_completion'));

-- migrate:down
ALTER TABLE mahakrama_history DROP CONSTRAINT IF EXISTS mahakrama_history_status_check;
ALTER TABLE mahakrama_history ADD CONSTRAINT mahakrama_history_status_check CHECK (status IN ('current','completed'));
