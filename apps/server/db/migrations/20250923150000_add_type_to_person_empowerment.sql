-- migrate:up
ALTER TABLE person_empowerment ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'Wang';

-- migrate:down
ALTER TABLE person_empowerment DROP COLUMN type;