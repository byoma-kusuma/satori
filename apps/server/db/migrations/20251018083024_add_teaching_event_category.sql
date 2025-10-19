-- migrate:up
-- Add Teaching event category
INSERT INTO public.event_category (code, name, requires_full_attendance)
VALUES ('TEACHING', 'Teaching', false)
ON CONFLICT (code) DO NOTHING;

-- migrate:down
DELETE FROM public.event_category WHERE code = 'TEACHING';
