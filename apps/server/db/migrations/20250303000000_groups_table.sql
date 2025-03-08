-- migrate:up
-- Create group table
CREATE TABLE public."group" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdBy" text NOT NULL,
    "lastUpdatedBy" text NOT NULL,
    PRIMARY KEY (id)
);

-- Create a trigger to update the updatedAt column
CREATE TRIGGER update_group_updated_at
BEFORE UPDATE ON public."group"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create person_group junction table (many-to-many relationship)
CREATE TABLE public.person_group (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "personId" uuid NOT NULL,
    "groupId" uuid NOT NULL,
    "joinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "addedBy" text NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_person FOREIGN KEY ("personId") REFERENCES public.person(id) ON DELETE CASCADE,
    CONSTRAINT fk_group FOREIGN KEY ("groupId") REFERENCES public."group"(id) ON DELETE CASCADE,
    UNIQUE("personId", "groupId")
);

-- Create indexes
CREATE INDEX idx_group_name ON public."group" USING btree (name);
CREATE INDEX idx_person_group_person_id ON public.person_group USING btree ("personId");
CREATE INDEX idx_person_group_group_id ON public.person_group USING btree ("groupId");
CREATE INDEX idx_person_group_added_by ON public.person_group USING btree (split_part("addedBy", '#'::text, 2));

-- migrate:down
DROP TABLE IF EXISTS public.person_group;
DROP TABLE IF EXISTS public."group";