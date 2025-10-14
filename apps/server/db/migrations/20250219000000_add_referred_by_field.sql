-- migrate:up
-- Add referred by field to person table
ALTER TABLE public.person
ADD COLUMN IF NOT EXISTS "referredBy" VARCHAR(255);

-- Add index for referred by field for better query performance
CREATE INDEX IF NOT EXISTS idx_person_referred_by ON public.person("referredBy") WHERE "referredBy" IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.person."referredBy" IS 'Free form text field indicating who referred this person';

-- migrate:down
-- Drop index
DROP INDEX IF EXISTS idx_person_referred_by;

-- Drop column
ALTER TABLE public.person
DROP COLUMN IF EXISTS "referredBy";