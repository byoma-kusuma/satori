-- migrate:up
ALTER TABLE person ADD COLUMN viber_number VARCHAR(50);
ALTER TABLE registration ADD COLUMN viber_number VARCHAR(40);

-- migrate:down
ALTER TABLE registration DROP COLUMN viber_number;
ALTER TABLE person DROP COLUMN viber_number;
