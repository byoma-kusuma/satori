-- migrate:up
CREATE TABLE mahakrama_step (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_number double precision NOT NULL,
    group_id VARCHAR(100) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    step_id VARCHAR(100) NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    last_updated_by VARCHAR(255) NOT NULL,
    CONSTRAINT mahakrama_step_sequence_unique UNIQUE (sequence_number),
    CONSTRAINT mahakrama_step_group_step_unique UNIQUE (group_id, step_id)
);

CREATE TABLE mahakrama_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    mahakrama_step_id UUID NOT NULL REFERENCES mahakrama_step(id),
    status VARCHAR(20) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    mahakrama_instructor_id UUID REFERENCES person(id),
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    last_updated_by VARCHAR(255) NOT NULL,
    CONSTRAINT mahakrama_history_status_check CHECK (status IN ('current','completed'))
);

CREATE INDEX idx_mahakrama_step_sequence ON mahakrama_step(sequence_number);
CREATE INDEX idx_mahakrama_step_group_step ON mahakrama_step(group_id, step_id);
CREATE INDEX idx_mahakrama_history_person ON mahakrama_history(person_id);
CREATE INDEX idx_mahakrama_history_step ON mahakrama_history(mahakrama_step_id);
CREATE UNIQUE INDEX idx_mahakrama_history_current ON mahakrama_history(person_id) WHERE status = 'current';

-- migrate:down
DROP INDEX IF EXISTS idx_mahakrama_history_current;
DROP INDEX IF EXISTS idx_mahakrama_history_step;
DROP INDEX IF EXISTS idx_mahakrama_history_person;
DROP TABLE IF EXISTS mahakrama_history;
DROP INDEX IF EXISTS idx_mahakrama_step_group_step;
DROP INDEX IF EXISTS idx_mahakrama_step_sequence;
DROP TABLE IF EXISTS mahakrama_step;
