-- migrate:up
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- migrate:down
ALTER TABLE "user" DROP COLUMN IF EXISTS "deletedAt";
