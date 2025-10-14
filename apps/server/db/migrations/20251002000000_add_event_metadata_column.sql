-- migrate:up
ALTER TABLE public.event
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.event
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

ALTER TABLE public.event
  ALTER COLUMN metadata SET NOT NULL;

-- migrate:down
ALTER TABLE public.event
  DROP COLUMN IF EXISTS metadata;
