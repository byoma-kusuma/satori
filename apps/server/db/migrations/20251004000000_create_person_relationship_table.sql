-- migrate:up
CREATE TABLE person_relationship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    related_person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    last_updated_by VARCHAR(255) NOT NULL,
    CONSTRAINT person_relationship_unique_pair UNIQUE (person_id, related_person_id),
    CONSTRAINT person_relationship_not_self CHECK (person_id <> related_person_id)
);

CREATE INDEX idx_person_relationship_person_id ON person_relationship(person_id);
CREATE INDEX idx_person_relationship_related_person_id ON person_relationship(related_person_id);

-- migrate:down
DROP TABLE person_relationship;
