-- V2: Complete task table with all columns and proper constraints

DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE tasks
(
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL,
    subject_id          UUID NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    due_date            TIMESTAMP WITH TIME ZONE,
    estimated_minutes   INTEGER,
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT chk_task_priority
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_task_status
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_estimated_minutes
        CHECK (estimated_minutes IS NULL OR estimated_minutes > 0)
);

CREATE INDEX idx_task_user_id ON tasks(user_id);
CREATE INDEX idx_task_subject_id ON tasks(subject_id);
CREATE INDEX idx_task_due_date ON tasks(due_date);
CREATE INDEX idx_task_status ON tasks(status);
