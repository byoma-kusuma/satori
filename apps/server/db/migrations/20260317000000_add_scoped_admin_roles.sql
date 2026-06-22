-- migrate:up
-- Add center_admin and group_admin to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'center_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'group_admin';

-- migrate:down
