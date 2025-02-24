-- migrate:up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE center_location AS ENUM ('Nepal', 'USA', 'Australia', 'UK');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- Create a function for updating the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE person (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "emailId" VARCHAR(255),
    "phoneNumber" VARCHAR(20),
    "yearOfBirth" INTEGER CHECK ("yearOfBirth" > 1900),
    "photo" TEXT,
    "gender" gender_type,
    "refugee" BOOLEAN NOT NULL,
    "center" center_location NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "lastUpdatedBy" TEXT NOT NULL
);

-- Create indexes for commonly queried fields
CREATE INDEX idx_person_email ON person("emailId") WHERE "emailId" IS NOT NULL;
CREATE INDEX idx_person_phone ON person("phoneNumber") WHERE "phoneNumber" IS NOT NULL;
CREATE INDEX idx_person_names ON person("firstName", "lastName");
CREATE INDEX idx_person_refugee ON person("refugee");
CREATE INDEX idx_person_center ON person("center");
CREATE INDEX idx_person_created_by ON person(split_part("createdBy", '#', 2));
CREATE INDEX idx_person_updated_by ON person(split_part("lastUpdatedBy", '#', 2));

-- Create trigger for automatic updatedAt timestamp
CREATE TRIGGER update_person_updated_at
    BEFORE UPDATE ON person
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS update_person_updated_at ON person;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS person;
DROP TYPE IF EXISTS center_location;
DROP TYPE IF EXISTS gender_type;