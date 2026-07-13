-- V6: Study sessions table

CREATE TABLE study_sessions
(
    id                      UUID PRIMARY KEY,
    user_id                 UUID NOT NULL,
    subject_id              UUID,
    task_id                 UUID,
    title                   VARCHAR(200) NOT NULL,
    planned_date            DATE NOT NULL,
    duration_minutes        INTEGER NOT NULL,
    actual_duration_minutes INTEGER,
    notes                   TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_session_task
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT chk_session_status
        CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')),
    CONSTRAINT chk_duration_minutes
        CHECK (duration_minutes > 0),
    CONSTRAINT chk_actual_duration
        CHECK (actual_duration_minutes IS NULL OR actual_duration_minutes > 0)
);

CREATE INDEX idx_session_user ON study_sessions(user_id);
CREATE INDEX idx_session_date ON study_sessions(planned_date);
