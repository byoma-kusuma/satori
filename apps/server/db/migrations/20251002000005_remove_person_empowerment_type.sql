-- migrate:up
ALTER TABLE public.person_empowerment
  DROP COLUMN IF EXISTS type;

-- migrate:down
ALTER TABLE public.person_empowerment
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'Wang';
