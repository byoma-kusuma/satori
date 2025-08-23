-- migrate:up
-- Create membership type enum
CREATE TYPE public.membership_type AS ENUM ('Life Time', 'Board Member', 'General Member', 'Honorary Member');

-- Add new columns to person table
ALTER TABLE public.person
ADD COLUMN IF NOT EXISTS "middleName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "primaryPhone" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "secondaryPhone" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "occupation" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "membershipType" public.membership_type;

-- Drop the old membershipStatus column if it exists
ALTER TABLE public.person DROP COLUMN IF EXISTS "membershipStatus";

-- Remove the refugee column
ALTER TABLE public.person DROP COLUMN IF EXISTS "refugee";

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_person_middle_name ON public.person("middleName") WHERE "middleName" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_primary_phone ON public.person("primaryPhone") WHERE "primaryPhone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_secondary_phone ON public.person("secondaryPhone") WHERE "secondaryPhone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_occupation ON public.person("occupation") WHERE "occupation" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_membership_type ON public.person("membershipType") WHERE "membershipType" IS NOT NULL;

-- Comment on new columns for documentation
COMMENT ON COLUMN public.person."middleName" IS 'Middle name of the person';
COMMENT ON COLUMN public.person."primaryPhone" IS 'Primary phone number of the person';
COMMENT ON COLUMN public.person."secondaryPhone" IS 'Secondary phone number of the person';
COMMENT ON COLUMN public.person."occupation" IS 'Occupation of the person';
COMMENT ON COLUMN public.person."notes" IS 'Additional notes or comments about the person';
COMMENT ON COLUMN public.person."membershipType" IS 'Type of membership for Sangha members';

-- migrate:down
-- Drop indexes
DROP INDEX IF EXISTS idx_person_middle_name;
DROP INDEX IF EXISTS idx_person_primary_phone;
DROP INDEX IF EXISTS idx_person_secondary_phone;
DROP INDEX IF EXISTS idx_person_occupation;
DROP INDEX IF EXISTS idx_person_membership_type;

-- Drop columns
ALTER TABLE public.person
DROP COLUMN IF EXISTS "middleName",
DROP COLUMN IF EXISTS "primaryPhone",
DROP COLUMN IF EXISTS "secondaryPhone",
DROP COLUMN IF EXISTS "occupation",
DROP COLUMN IF EXISTS "notes",
DROP COLUMN IF EXISTS "membershipType";

-- Re-add the old membershipStatus column if needed
ALTER TABLE public.person ADD COLUMN IF NOT EXISTS "membershipStatus" VARCHAR(50);

-- Re-add the refugee column
ALTER TABLE public.person ADD COLUMN IF NOT EXISTS "refugee" BOOLEAN NOT NULL DEFAULT false;

-- Drop membership type enum
DROP TYPE IF EXISTS public.membership_type;