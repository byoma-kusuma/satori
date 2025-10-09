-- migrate:up
ALTER TABLE "user"
  ADD COLUMN person_id UUID NULL;

ALTER TABLE "user"
  ADD CONSTRAINT user_person_unique UNIQUE (person_id);

ALTER TABLE "user"
  ADD CONSTRAINT user_person_fk
    FOREIGN KEY (person_id)
    REFERENCES person(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_person_id ON "user"(person_id);

-- migrate:down
DROP INDEX IF EXISTS idx_user_person_id;
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_person_fk;
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_person_unique;
ALTER TABLE "user" DROP COLUMN IF EXISTS person_id;
