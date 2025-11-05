-- migrate:up
ALTER TABLE public.event
ADD COLUMN requires_full_attendance boolean DEFAULT NULL;

COMMENT ON COLUMN public.event.requires_full_attendance IS
'Overrides the category default when set. NULL means use category default.';

-- migrate:down
ALTER TABLE public.event
DROP COLUMN requires_full_attendance;
