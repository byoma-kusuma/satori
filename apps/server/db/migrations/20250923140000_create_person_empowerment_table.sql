-- migrate:up
CREATE TABLE person_empowerment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empowerment_id UUID NOT NULL REFERENCES empowerment(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    last_updated_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_person_empowerment_person_id ON person_empowerment(person_id);
CREATE INDEX idx_person_empowerment_empowerment_id ON person_empowerment(empowerment_id);
CREATE INDEX idx_person_empowerment_guru_id ON person_empowerment(guru_id);

-- migrate:down
DROP TABLE person_empowerment;