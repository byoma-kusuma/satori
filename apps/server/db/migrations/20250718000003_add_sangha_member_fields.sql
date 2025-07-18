-- migrate:up
-- Add membership card number and year of refuge calendar type fields
ALTER TABLE public.person
ADD COLUMN IF NOT EXISTS "membershipCardNumber" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "yearOfRefugeCalendarType" VARCHAR(2);

-- Create check constraint for calendar type
ALTER TABLE public.person
ADD CONSTRAINT check_year_of_refuge_calendar_type
CHECK ("yearOfRefugeCalendarType" IN ('BS', 'AD'));

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_person_membership_card_number ON public.person("membershipCardNumber") WHERE "membershipCardNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_year_of_refuge_calendar_type ON public.person("yearOfRefugeCalendarType") WHERE "yearOfRefugeCalendarType" IS NOT NULL;

-- Comment on new columns for documentation
COMMENT ON COLUMN public.person."membershipCardNumber" IS 'Membership card number for Sangha members';
COMMENT ON COLUMN public.person."yearOfRefugeCalendarType" IS 'Calendar type for year of refuge (BS or AD)';

-- migrate:down
-- Drop indexes
DROP INDEX IF EXISTS idx_person_membership_card_number;
DROP INDEX IF EXISTS idx_person_year_of_refuge_calendar_type;

-- Drop constraint
ALTER TABLE public.person DROP CONSTRAINT IF EXISTS check_year_of_refuge_calendar_type;

-- Drop columns
ALTER TABLE public.person
DROP COLUMN IF EXISTS "membershipCardNumber",
DROP COLUMN IF EXISTS "yearOfRefugeCalendarType";