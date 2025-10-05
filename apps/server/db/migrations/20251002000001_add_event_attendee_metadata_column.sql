-- migrate:up
ALTER TABLE public.event_attendee
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.event_attendee
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

ALTER TABLE public.event_attendee
  ALTER COLUMN metadata SET NOT NULL;

-- migrate:down
ALTER TABLE public.event_attendee
  DROP COLUMN IF EXISTS metadata;
