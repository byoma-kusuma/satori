-- migrate:up
-- Make guru_id and start_date nullable in person_empowerment table
ALTER TABLE public.person_empowerment
  ALTER COLUMN guru_id DROP NOT NULL,
  ALTER COLUMN start_date DROP NOT NULL;

-- Add comments explaining the change
COMMENT ON COLUMN public.person_empowerment.guru_id IS 'Guru who gave the empowerment (optional)';
COMMENT ON COLUMN public.person_empowerment.start_date IS 'Start date of the empowerment (optional)';

-- migrate:down
-- Restore NOT NULL constraints
ALTER TABLE public.person_empowerment
  ALTER COLUMN guru_id SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL;
