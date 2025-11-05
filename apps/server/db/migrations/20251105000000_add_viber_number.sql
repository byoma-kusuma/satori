-- migrate:up
ALTER TABLE person ADD COLUMN viber_number VARCHAR(50);

-- migrate:down
ALTER TABLE person DROP COLUMN viber_number;
