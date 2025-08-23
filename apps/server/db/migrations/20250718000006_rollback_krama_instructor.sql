-- migrate:up
-- Remove the foreign key constraint and column from person table
ALTER TABLE public.person 
DROP CONSTRAINT IF EXISTS fk_person_krama_instructor;

DROP INDEX IF EXISTS idx_person_krama_instructor_id;

ALTER TABLE public.person
DROP COLUMN IF EXISTS "kramaInstructorId";

-- Drop indexes from krama_instructor table
DROP INDEX IF EXISTS idx_krama_instructor_name;
DROP INDEX IF EXISTS idx_krama_instructor_is_active;
DROP INDEX IF EXISTS idx_krama_instructor_created_by;

-- Drop krama_instructor table
DROP TABLE IF EXISTS public.krama_instructor;

-- migrate:down
-- Recreate KramaInstructor table
CREATE TABLE public.krama_instructor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "lastUpdatedBy" UUID NOT NULL
);

-- Add indexes
CREATE INDEX idx_krama_instructor_name ON public.krama_instructor(name);
CREATE INDEX idx_krama_instructor_is_active ON public.krama_instructor("isActive");
CREATE INDEX idx_krama_instructor_created_by ON public.krama_instructor("createdBy");

-- Add comments for documentation
COMMENT ON TABLE public.krama_instructor IS 'Krama instructors for attended orientation persons';
COMMENT ON COLUMN public.krama_instructor.name IS 'Full name of the krama instructor';
COMMENT ON COLUMN public.krama_instructor.email IS 'Email address of the krama instructor';
COMMENT ON COLUMN public.krama_instructor.phone IS 'Phone number of the krama instructor';
COMMENT ON COLUMN public.krama_instructor."isActive" IS 'Whether the instructor is currently active';

-- Add krama_instructor_id field to person table
ALTER TABLE public.person
ADD COLUMN IF NOT EXISTS "kramaInstructorId" UUID,
ADD CONSTRAINT fk_person_krama_instructor 
    FOREIGN KEY ("kramaInstructorId") 
    REFERENCES public.krama_instructor(id) 
    ON DELETE SET NULL;

-- Add index for the foreign key
CREATE INDEX IF NOT EXISTS idx_person_krama_instructor_id ON public.person("kramaInstructorId");

-- Comment on the new person column
COMMENT ON COLUMN public.person."kramaInstructorId" IS 'Reference to krama instructor for attended orientation persons';