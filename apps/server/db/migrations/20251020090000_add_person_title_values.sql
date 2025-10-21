-- migrate:up
-- Add new values to person_title enum
ALTER TYPE public.person_title ADD VALUE IF NOT EXISTS 'khenpo';
ALTER TYPE public.person_title ADD VALUE IF NOT EXISTS 'dharmacharya';

-- migrate:down
-- Note: PostgreSQL does not support removing enum values
-- Manual intervention required to rollback this migration
