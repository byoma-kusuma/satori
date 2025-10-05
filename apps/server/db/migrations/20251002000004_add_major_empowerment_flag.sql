-- migrate:up
ALTER TABLE public.empowerment
  ADD COLUMN IF NOT EXISTS major_empowerment boolean NOT NULL DEFAULT false;

-- migrate:down
ALTER TABLE public.empowerment
  DROP COLUMN IF EXISTS major_empowerment;
