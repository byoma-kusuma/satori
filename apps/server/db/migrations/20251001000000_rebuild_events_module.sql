-- migrate:up
-- Drop legacy event artifacts
DROP TRIGGER IF EXISTS update_event_updatedAt ON public.event;
DROP TABLE IF EXISTS public.event CASCADE;
DROP TYPE IF EXISTS public.event_type;

-- Helper trigger for snake_case updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column_snake()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- New enums for registration and status
CREATE TYPE public.event_registration_mode AS ENUM (
    'PRE_REGISTRATION',
    'WALK_IN'
);

CREATE TYPE public.event_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'CLOSED'
);

-- Event categories table
CREATE TABLE public.event_category (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    requires_full_attendance boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_event_category_updated_at
    BEFORE UPDATE ON public.event_category
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_snake();

-- Core events table
CREATE TABLE public.event (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name varchar(255) NOT NULL,
    description text,
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    registration_mode public.event_registration_mode NOT NULL,
    status public.event_status NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    created_by text NOT NULL,
    last_updated_by text NOT NULL,
    category_id uuid NOT NULL REFERENCES public.event_category(id),
    closed_at timestamptz,
    closed_by text,
    empowerment_id uuid REFERENCES public.empowerment(id),
    guru_id uuid REFERENCES public.guru(id),
    CONSTRAINT event_date_range CHECK (end_date >= start_date)
);

CREATE TRIGGER update_event_updated_at
    BEFORE UPDATE ON public.event
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_snake();

CREATE INDEX idx_event_category_id ON public.event(category_id);
CREATE INDEX idx_event_registration_mode ON public.event(registration_mode);
CREATE INDEX idx_event_status ON public.event(status);
CREATE INDEX idx_event_start_end ON public.event(start_date, end_date);

-- Event days table
CREATE TABLE public.event_day (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    event_id uuid NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
    day_number integer NOT NULL,
    event_date date NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT event_day_number_check CHECK (day_number > 0),
    CONSTRAINT event_day_unique_number UNIQUE (event_id, day_number),
    CONSTRAINT event_day_unique_date UNIQUE (event_id, event_date)
);

CREATE INDEX idx_event_day_event_id ON public.event_day(event_id);
CREATE INDEX idx_event_day_date ON public.event_day(event_date);

-- Event attendees table
CREATE TABLE public.event_attendee (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    event_id uuid NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
    person_id uuid NOT NULL REFERENCES public.person(id),
    registration_mode public.event_registration_mode NOT NULL,
    registered_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    registered_by text NOT NULL,
    is_cancelled boolean NOT NULL DEFAULT false,
    notes text,
    received_empowerment boolean NOT NULL DEFAULT false,
    empowerment_record_id uuid REFERENCES public.person_empowerment(id),
    CONSTRAINT event_attendee_unique_person UNIQUE (event_id, person_id),
    CONSTRAINT event_attendee_empowerment_record CHECK (
        (received_empowerment = false AND empowerment_record_id IS NULL)
        OR (received_empowerment = true AND empowerment_record_id IS NOT NULL)
    )
);

CREATE INDEX idx_event_attendee_event_id ON public.event_attendee(event_id);
CREATE INDEX idx_event_attendee_person_id ON public.event_attendee(person_id);
CREATE INDEX idx_event_attendee_registration_mode ON public.event_attendee(registration_mode);

-- Event attendance records per day
CREATE TABLE public.event_attendance (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    event_attendee_id uuid NOT NULL REFERENCES public.event_attendee(id) ON DELETE CASCADE,
    event_day_id uuid NOT NULL REFERENCES public.event_day(id) ON DELETE CASCADE,
    checked_in_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checked_in_by text NOT NULL,
    CONSTRAINT event_attendance_unique_attendee_day UNIQUE (event_attendee_id, event_day_id)
);

CREATE INDEX idx_event_attendance_attendee_id ON public.event_attendance(event_attendee_id);
CREATE INDEX idx_event_attendance_day_id ON public.event_attendance(event_day_id);

-- Seed base categories
INSERT INTO public.event_category (code, name, requires_full_attendance)
VALUES 
    ('BODHIPUSPANJALI', 'Bodhipushpanjali', false),
    ('REFUGE', 'Refuge', false),
    ('EMPOWERMENT', 'Empowerment', true)
ON CONFLICT (code) DO NOTHING;

-- migrate:down
DELETE FROM public.event_category WHERE code IN ('BODHIPUSPANJALI', 'REFUGE', 'EMPOWERMENT');

DROP TABLE IF EXISTS public.event_attendance;
DROP TABLE IF EXISTS public.event_attendee;
DROP TABLE IF EXISTS public.event_day;
DROP TRIGGER IF EXISTS update_event_updated_at ON public.event;
DROP TABLE IF EXISTS public.event;
DROP TABLE IF EXISTS public.event_category;
DROP TYPE IF EXISTS public.event_status;
DROP TYPE IF EXISTS public.event_registration_mode;
DROP FUNCTION IF EXISTS public.update_updated_at_column_snake();

-- Restore legacy schema
CREATE TYPE public.event_type AS ENUM (
    'REFUGE',
    'BODHIPUSPANJALI'
);

CREATE TABLE public.event (
    "id" uuid PRIMARY KEY DEFAULT public.uuid_generate_v4() NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "lastUpdatedBy" TEXT NOT NULL,
    "type" event_type NOT NULL,
    "metadata" JSONB DEFAULT '{}'::jsonb
);

CREATE TRIGGER update_event_updatedAt
    BEFORE UPDATE ON public.event
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_event_name ON public.event("name");
CREATE INDEX idx_event_type ON public.event("type");
CREATE INDEX idx_event_dates ON public.event("startDate", "endDate");
CREATE INDEX idx_event_createdBy ON public.event(split_part("createdBy", '#', 2));
CREATE INDEX idx_event_updatedBy ON public.event(split_part("lastUpdatedBy", '#', 2));
