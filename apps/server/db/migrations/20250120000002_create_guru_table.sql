-- migrate:up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function for updating the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create guru table
CREATE TABLE public.guru (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "guruName" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" text NOT NULL,
    "lastUpdatedBy" text NOT NULL
);

-- Add primary key constraint
ALTER TABLE ONLY public.guru
    ADD CONSTRAINT guru_pkey PRIMARY KEY (id);

-- Add index for guru name
CREATE INDEX idx_guru_name ON public.guru USING btree ("guruName");

-- Add trigger for updated_at
CREATE TRIGGER update_guru_updated_at BEFORE UPDATE ON public.guru FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS update_guru_updated_at ON public.guru;
DROP TABLE IF EXISTS public.guru;