-- migrate:up
-- Drop the existing foreign key constraint with CASCADE
ALTER TABLE person_empowerment
DROP CONSTRAINT person_empowerment_empowerment_id_fkey;

-- Add the new foreign key constraint with RESTRICT (prevents deletion if referenced)
ALTER TABLE person_empowerment
ADD CONSTRAINT person_empowerment_empowerment_id_fkey
FOREIGN KEY (empowerment_id) REFERENCES empowerment(id) ON DELETE RESTRICT;

-- migrate:down
-- Revert back to CASCADE for rollback
ALTER TABLE person_empowerment
DROP CONSTRAINT person_empowerment_empowerment_id_fkey;

ALTER TABLE person_empowerment
ADD CONSTRAINT person_empowerment_empowerment_id_fkey
FOREIGN KEY (empowerment_id) REFERENCES empowerment(id) ON DELETE CASCADE;