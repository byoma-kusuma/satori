-- migrate:up
-- Create event_type enum
CREATE TYPE public.event_type AS ENUM (
    'REFUGE',
    'BODHIPUSPANJALI'
);

-- Create events table
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

-- Create a trigger for automatic updatedAt timestamp
CREATE TRIGGER update_event_updatedAt
    BEFORE UPDATE ON public.event
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_event_name ON public.event("name");
CREATE INDEX idx_event_type ON public.event("type");
CREATE INDEX idx_event_dates ON public.event("startDate", "endDate");
CREATE INDEX idx_event_createdBy ON public.event(split_part("createdBy", '#', 2));
CREATE INDEX idx_event_updatedBy ON public.event(split_part("lastUpdatedBy", '#', 2));

-- migrate:down
DROP TRIGGER IF EXISTS update_event_updatedAt ON public.event;
DROP TABLE IF EXISTS public.event;
DROP TYPE IF EXISTS public.event_type;