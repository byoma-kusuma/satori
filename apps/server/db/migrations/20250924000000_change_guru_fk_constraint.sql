-- migrate:up
-- Change the foreign key constraint from CASCADE to RESTRICT for guru references in person_empowerment
ALTER TABLE person_empowerment
DROP CONSTRAINT person_empowerment_guru_id_fkey;

ALTER TABLE person_empowerment
ADD CONSTRAINT person_empowerment_guru_id_fkey
FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE RESTRICT;

-- migrate:down
-- Revert back to CASCADE constraint
ALTER TABLE person_empowerment
DROP CONSTRAINT person_empowerment_guru_id_fkey;

ALTER TABLE person_empowerment
ADD CONSTRAINT person_empowerment_guru_id_fkey
FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE;