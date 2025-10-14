-- migrate:up
CREATE TABLE public.center (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  address text,
  country text,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_center_updated_at
  BEFORE UPDATE ON public.center
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_snake();

CREATE TABLE public.center_person (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  center_id uuid NOT NULL REFERENCES public.center(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.person(id) ON DELETE CASCADE,
  position text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT center_person_unique UNIQUE (center_id, person_id)
);

CREATE TRIGGER update_center_person_updated_at
  BEFORE UPDATE ON public.center_person
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_snake();

CREATE INDEX IF NOT EXISTS idx_center_person_center_id ON public.center_person(center_id);
CREATE INDEX IF NOT EXISTS idx_center_person_person_id ON public.center_person(person_id);

ALTER TABLE public.person
  ADD COLUMN center_id uuid;

CREATE INDEX IF NOT EXISTS idx_person_center_id ON public.person(center_id);

ALTER TABLE public.person
  ADD CONSTRAINT person_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.center(id) ON DELETE SET NULL;

ALTER TABLE public.person
  DROP COLUMN center;

-- migrate:down
ALTER TABLE public.person
  ADD COLUMN center text;

ALTER TABLE public.person
  DROP CONSTRAINT person_center_id_fkey;

DROP INDEX IF EXISTS idx_person_center_id;

ALTER TABLE public.person
  DROP COLUMN center_id;

DROP TABLE IF EXISTS public.center_person;
DROP TABLE IF EXISTS public.center;
