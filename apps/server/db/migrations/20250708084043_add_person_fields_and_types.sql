-- migrate:up
-- Add new values to person_type enum
ALTER TYPE public.person_type ADD VALUE IF NOT EXISTS 'new_inquiry';
ALTER TYPE public.person_type ADD VALUE IF NOT EXISTS 'attended_orientation';

-- Create title enum type
CREATE TYPE public.person_title AS ENUM ('dharma_dhar', 'sahayak_dharmacharya', 'sahayak_samathacharya');

-- Add new columns to person table
ALTER TABLE public.person
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
ADD COLUMN IF NOT EXISTS "languagePreference" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "refugeName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "yearOfRefuge" INTEGER,
ADD COLUMN IF NOT EXISTS title public.person_title,
ADD COLUMN IF NOT EXISTS "membershipStatus" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "hasMembershipCard" BOOLEAN;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_person_country ON public.person(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_nationality ON public.person(nationality) WHERE nationality IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_language_pref ON public.person("languagePreference") WHERE "languagePreference" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_title ON public.person(title) WHERE title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_membership_card ON public.person("hasMembershipCard") WHERE "hasMembershipCard" IS NOT NULL;

-- Add check constraint for yearOfRefuge
ALTER TABLE public.person 
ADD CONSTRAINT person_yearOfRefuge_check CHECK ("yearOfRefuge" IS NULL OR "yearOfRefuge" > 1900);

-- Comment on new columns for documentation
COMMENT ON COLUMN public.person.country IS 'Country of residence';
COMMENT ON COLUMN public.person.nationality IS 'Nationality of the person';
COMMENT ON COLUMN public.person."languagePreference" IS 'Preferred language for communication';
COMMENT ON COLUMN public.person."refugeName" IS 'Dharma name given during refuge ceremony (for Sangha members)';
COMMENT ON COLUMN public.person."yearOfRefuge" IS 'Year when refuge was taken (for Sangha members)';
COMMENT ON COLUMN public.person.title IS 'Dharma title for Sangha members';
COMMENT ON COLUMN public.person."membershipStatus" IS 'Current membership status (for Sangha members)';
COMMENT ON COLUMN public.person."hasMembershipCard" IS 'Whether the person has a membership card (for Sangha members)';

-- migrate:down
-- Drop indexes
DROP INDEX IF EXISTS idx_person_country;
DROP INDEX IF EXISTS idx_person_nationality;
DROP INDEX IF EXISTS idx_person_language_pref;
DROP INDEX IF EXISTS idx_person_title;
DROP INDEX IF EXISTS idx_person_membership_card;

-- Drop constraint
ALTER TABLE public.person DROP CONSTRAINT IF EXISTS person_yearOfRefuge_check;

-- Drop columns
ALTER TABLE public.person
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS nationality,
DROP COLUMN IF EXISTS "languagePreference",
DROP COLUMN IF EXISTS "refugeName",
DROP COLUMN IF EXISTS "yearOfRefuge",
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS "membershipStatus",
DROP COLUMN IF EXISTS "hasMembershipCard";

-- Drop title enum type
DROP TYPE IF EXISTS public.person_title;

-- Note: Cannot remove enum values from person_type in PostgreSQL