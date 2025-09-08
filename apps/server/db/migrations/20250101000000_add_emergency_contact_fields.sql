-- migrate:up
-- Add emergency contact fields to person table
ALTER TABLE public.person
ADD COLUMN IF NOT EXISTS "emergencyContactName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "emergencyContactRelationship" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "emergencyContactPhone" VARCHAR(20);

-- Add indexes for emergency contact fields
CREATE INDEX IF NOT EXISTS idx_person_emergency_contact_name ON public.person("emergencyContactName") WHERE "emergencyContactName" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_emergency_contact_phone ON public.person("emergencyContactPhone") WHERE "emergencyContactPhone" IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.person."emergencyContactName" IS 'Name of emergency contact person';
COMMENT ON COLUMN public.person."emergencyContactRelationship" IS 'Relationship to the emergency contact (e.g., spouse, parent, sibling)';
COMMENT ON COLUMN public.person."emergencyContactPhone" IS 'Phone number of emergency contact person';

-- migrate:down
-- Drop indexes
DROP INDEX IF EXISTS idx_person_emergency_contact_name;
DROP INDEX IF EXISTS idx_person_emergency_contact_phone;

-- Drop columns
ALTER TABLE public.person
DROP COLUMN IF EXISTS "emergencyContactName",
DROP COLUMN IF EXISTS "emergencyContactRelationship",
DROP COLUMN IF EXISTS "emergencyContactPhone";