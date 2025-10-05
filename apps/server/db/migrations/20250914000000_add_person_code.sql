-- migrate:up
ALTER TABLE person ADD COLUMN "personCode" VARCHAR(6) UNIQUE;
CREATE INDEX idx_person_code ON person("personCode");

-- migrate:down
DROP INDEX IF EXISTS idx_person_code;
ALTER TABLE person DROP COLUMN IF EXISTS "personCode";