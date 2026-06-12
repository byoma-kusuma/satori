CREATE TABLE IF NOT EXISTS person_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(128) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with existing types
INSERT INTO person_type_config (code, label, is_active, sort_order) VALUES
  ('interested', 'Interested', true, 0),
  ('contact', 'Contact', true, 1),
  ('attended_orientation', 'Attended Orientation', true, 2),
  ('sangha_member', 'Sangha Member', true, 3)
ON CONFLICT (code) DO NOTHING;
