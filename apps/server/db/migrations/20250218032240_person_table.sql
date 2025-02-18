-- migrate:up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE center_location AS ENUM ('BishalNagar', 'USA', 'Australia', 'UK');

CREATE TABLE persons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    year_of_birth INTEGER CHECK (year_of_birth > 1900),
    refugee BOOLEAN NOT NULL DEFAULT false,
    address TEXT,
    center center_location NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add an index on email_id since it's likely to be used for lookups
CREATE INDEX idx_persons_email ON persons(email_id);

-- migrate:down
DROP TABLE IF EXISTS persons;
DROP TYPE IF EXISTS center_location;