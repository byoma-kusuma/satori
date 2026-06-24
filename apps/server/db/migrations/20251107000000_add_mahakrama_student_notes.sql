-- migrate:up
ALTER TABLE mahakrama_history ADD COLUMN student_notes TEXT;

-- migrate:down
ALTER TABLE mahakrama_history DROP COLUMN IF EXISTS student_notes;
