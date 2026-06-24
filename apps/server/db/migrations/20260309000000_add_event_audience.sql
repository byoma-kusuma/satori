-- migrate:up

-- Add audience_type to event table
ALTER TABLE public.event
  ADD COLUMN audience_type varchar(10) NOT NULL DEFAULT 'all'
  CHECK (audience_type IN ('all', 'groups', 'centers'));

-- Junction table: event targeted at specific groups
CREATE TABLE public.event_target_group (
  event_id uuid NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.group(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, group_id)
);

CREATE INDEX idx_event_target_group_event_id ON public.event_target_group(event_id);

-- Junction table: event targeted at specific centers
CREATE TABLE public.event_target_center (
  event_id uuid NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.center(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, center_id)
);

CREATE INDEX idx_event_target_center_event_id ON public.event_target_center(event_id);

-- migrate:down
DROP TABLE IF EXISTS public.event_target_center;
DROP TABLE IF EXISTS public.event_target_group;
ALTER TABLE public.event DROP COLUMN IF EXISTS audience_type;
