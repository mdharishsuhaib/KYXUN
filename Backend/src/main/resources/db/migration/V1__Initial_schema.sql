-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users
(
    id UUID PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    email VARCHAR(255) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    profile_picture_url TEXT,

    role VARCHAR(30) NOT NULL DEFAULT 'STUDENT',

    phone_number VARCHAR(20),

    refresh_token VARCHAR(500),

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    account_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects
(
    id UUID PRIMARY KEY,

    user_id             UUID NOT NULL,

    name                VARCHAR(150) NOT NULL,

    description         TEXT,

    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_subject_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_subject_user_name
        UNIQUE (user_id, name)
);

CREATE TABLE tasks
(
    id                  UUID PRIMARY KEY,

    user_id             UUID NOT NULL,

    subject_id          UUID NOT NULL,

    title               VARCHAR(255) NOT NULL,

    description         TEXT,

    due_date            TIMESTAMP WITH TIME ZONE,

    estimated_minutes   INTEGER,

    priority            SMALLINT NOT NULL DEFAULT 2,

    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    completed_at        TIMESTAMP WITH TIME ZONE,

    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_task_priority
            CHECK (priority BETWEEN 1 AND 4),

    CONSTRAINT chk_task_status
            CHECK (
                status IN (
                    'PENDING',
                    'IN_PROGRESS',
                    'COMPLETED',
                    'CANCELLED'
                )
            ),

    CONSTRAINT chk_estimated_minutes
        CHECK (
            estimated_minutes IS NULL
            OR estimated_minutes > 0
        )
);

CREATE INDEX idx_subject_user
ON subjects(user_id);

CREATE INDEX idx_task_user
ON tasks(user_id);

CREATE INDEX idx_task_subject
ON tasks(subject_id);

CREATE INDEX idx_task_due_date
ON tasks(due_date);

CREATE INDEX idx_task_status
ON tasks(status);
