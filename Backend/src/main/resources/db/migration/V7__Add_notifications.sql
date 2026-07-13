-- V7: Notifications table

CREATE TABLE notifications
(
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL,
    title          VARCHAR(255) NOT NULL,
    message        TEXT NOT NULL,
    type           VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    is_read        BOOLEAN NOT NULL DEFAULT FALSE,
    read_at        TIMESTAMP WITH TIME ZONE,
    reference_id   VARCHAR(255),
    reference_type VARCHAR(50),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notification_type
        CHECK (type IN ('TASK_REMINDER','STUDY_REMINDER','DEADLINE','SYSTEM','ANNOUNCEMENT'))
);

CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read ON notifications(is_read);
