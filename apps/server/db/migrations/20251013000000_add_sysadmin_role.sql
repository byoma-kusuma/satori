-- migrate:up
-- Add 'sysadmin' to the user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sysadmin';

-- Comment on the enum
COMMENT ON TYPE public.user_role IS 'User roles: sysadmin (system administrator), admin (administrator), krama_instructor (krama instructor), viewer (read-only)';

-- migrate:down
-- Note: PostgreSQL does not support removing enum values directly
-- To remove the enum value, you would need to:
-- 1. Create a new enum without 'sysadmin'
-- 2. Alter the column to use the new enum
-- 3. Drop the old enum
-- This is not included here as it's a destructive operation


