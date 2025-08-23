-- migrate:up
-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'krama_instructor', 'viewer');

-- Add role field to user table
ALTER TABLE public.user
ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'viewer';

-- Add index for role field
CREATE INDEX IF NOT EXISTS idx_user_role ON public.user(role);

-- Comment on the new column
COMMENT ON COLUMN public.user.role IS 'Role of the user for access control (admin, krama_instructor, viewer)';

-- Update any existing users to have admin role (first user becomes admin)
UPDATE public.user 
SET role = 'admin' 
WHERE id = (
    SELECT id 
    FROM public.user 
    ORDER BY "createdAt" ASC 
    LIMIT 1
);

-- migrate:down
-- Drop the index
DROP INDEX IF EXISTS idx_user_role;

-- Drop the role column
ALTER TABLE public.user DROP COLUMN IF EXISTS role;

-- Drop the user role enum
DROP TYPE IF EXISTS public.user_role;