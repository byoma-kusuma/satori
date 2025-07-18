-- migrate:up
-- Note: PostgreSQL doesn't allow removing enum values directly
-- We need to recreate the enum type without the 'new_inquiry' value

-- First, update any existing 'new_inquiry' values to 'interested'
UPDATE public.person SET type = 'interested' WHERE type = 'new_inquiry';

-- Drop the default constraint first
ALTER TABLE public.person ALTER COLUMN type DROP DEFAULT;

-- Create a new enum type without 'new_inquiry'
CREATE TYPE public.person_type_new AS ENUM ('interested', 'contact', 'sangha_member', 'attended_orientation');

-- Update the column to use the new type
ALTER TABLE public.person ALTER COLUMN type TYPE public.person_type_new USING type::text::public.person_type_new;

-- Drop the old enum type
DROP TYPE IF EXISTS public.person_type;

-- Rename the new type to the original name
ALTER TYPE public.person_type_new RENAME TO person_type;

-- Set the default value back with the new type
ALTER TABLE public.person ALTER COLUMN type SET DEFAULT 'interested'::public.person_type;

-- migrate:down
-- Recreate the old enum type with 'new_inquiry'
CREATE TYPE public.person_type_new AS ENUM ('interested', 'contact', 'sangha_member', 'new_inquiry', 'attended_orientation');

-- Update the column to use the new type
ALTER TABLE public.person ALTER COLUMN type TYPE public.person_type_new USING type::text::public.person_type_new;

-- Drop the old enum type
DROP TYPE IF EXISTS public.person_type;

-- Rename the new type to the original name
ALTER TYPE public.person_type_new RENAME TO person_type;