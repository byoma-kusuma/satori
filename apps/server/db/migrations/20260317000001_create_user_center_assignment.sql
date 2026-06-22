-- migrate:up
CREATE TABLE IF NOT EXISTS user_center_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES center(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, center_id)
);

-- migrate:down
