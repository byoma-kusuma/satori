-- migrate:up
CREATE TABLE empowerment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL CHECK (class IN ('Kriyā Tantra', 'Charyā Tantra', 'Yoga Tantra', 'Anuttarayoga Tantra')),
    description TEXT,
    prerequisites TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    last_updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_empowerment_class ON empowerment(class);
CREATE INDEX idx_empowerment_name ON empowerment(name);

-- migrate:down
DROP TABLE empowerment;