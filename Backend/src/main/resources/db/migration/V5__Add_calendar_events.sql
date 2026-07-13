-- V5: Calendar events table

CREATE TABLE calendar_events
(
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    event_type      VARCHAR(20) NOT NULL DEFAULT 'OTHER',
    start_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_time   TIMESTAMP WITH TIME ZONE,
    all_day         BOOLEAN NOT NULL DEFAULT FALSE,
    location        VARCHAR(255),
    course_id       UUID,
    color           VARCHAR(10),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT chk_event_type
        CHECK (event_type IN ('EXAM','ASSIGNMENT','LECTURE','TUTORIAL','HOLIDAY','DEADLINE','OTHER'))
);

CREATE INDEX idx_event_user ON calendar_events(user_id);
CREATE INDEX idx_event_start ON calendar_events(start_date_time);
CREATE INDEX idx_event_type ON calendar_events(event_type);
