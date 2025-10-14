-- migrate:up
ALTER TABLE public.empowerment
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS form text;

-- migrate:down
ALTER TABLE public.empowerment
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS form;
