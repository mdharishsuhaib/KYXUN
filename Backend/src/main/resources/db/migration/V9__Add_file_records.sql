-- V9: File Records table for managing uploaded study materials

CREATE TABLE file_records
(
    id            UUID PRIMARY KEY,

    user_id       UUID NOT NULL,
    subject_id    UUID,

    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    content_type  VARCHAR(100),
    file_size     BIGINT,
    storage_path  TEXT NOT NULL,
    description   TEXT,

    is_public     BOOLEAN NOT NULL DEFAULT FALSE,

    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_file_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_file_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

CREATE INDEX idx_file_user    ON file_records(user_id);
CREATE INDEX idx_file_subject ON file_records(subject_id);
