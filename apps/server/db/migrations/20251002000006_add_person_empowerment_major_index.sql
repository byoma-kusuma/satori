-- migrate:up
CREATE INDEX IF NOT EXISTS idx_person_empowerment_person_empowerment_id
  ON public.person_empowerment (person_id, empowerment_id);

-- migrate:down
DROP INDEX IF EXISTS idx_person_empowerment_person_empowerment_id;
