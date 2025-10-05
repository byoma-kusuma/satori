-- migrate:up
ALTER TABLE public.empowerment
  ALTER COLUMN class DROP NOT NULL;

-- migrate:down
UPDATE public.empowerment
SET class = 'Kriyā Tantra'
WHERE class IS NULL;

ALTER TABLE public.empowerment
  ALTER COLUMN class SET NOT NULL;
