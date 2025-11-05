-- migrate:up
-- Create event_group table to organize events
CREATE TABLE IF NOT EXISTS public.event_group (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    created_by text
);

-- Ensure group names are unique (global scope; adjust if tenant scope added later)
CREATE UNIQUE INDEX IF NOT EXISTS event_group_name_unique ON public.event_group(name);

-- Auto-update updated_at on changes
CREATE TRIGGER update_event_group_updated_at
    BEFORE UPDATE ON public.event_group
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_snake();

-- Link events to optional group
ALTER TABLE public.event
    ADD COLUMN IF NOT EXISTS event_group_id uuid;

-- Index for efficient lookups by group
CREATE INDEX IF NOT EXISTS idx_event_group_id ON public.event(event_group_id);

-- Add FK with restricted delete (no cascade)
ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_event_group_id_fkey FOREIGN KEY (event_group_id)
    REFERENCES public.event_group(id) ON DELETE RESTRICT;

-- migrate:down
-- Remove FK and column from event
ALTER TABLE ONLY public.event
    DROP CONSTRAINT IF EXISTS event_event_group_id_fkey;

DROP INDEX IF EXISTS idx_event_group_id;

ALTER TABLE public.event
    DROP COLUMN IF EXISTS event_group_id;

-- Drop trigger and table
DROP TRIGGER IF EXISTS update_event_group_updated_at ON public.event_group;

DROP INDEX IF EXISTS event_group_name_unique;

DROP TABLE IF EXISTS public.event_group;

