-- migrate:up
CREATE TABLE mahakrama_step_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mahakrama_step_id UUID NOT NULL REFERENCES mahakrama_step(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    document_data BYTEA NOT NULL,
    document_filename TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    CONSTRAINT mahakrama_step_document_unique_language UNIQUE (mahakrama_step_id, language)
);

CREATE INDEX idx_mahakrama_step_document_step ON mahakrama_step_document(mahakrama_step_id);

-- migrate:down
DROP INDEX IF EXISTS idx_mahakrama_step_document_step;
DROP TABLE IF EXISTS mahakrama_step_document;
