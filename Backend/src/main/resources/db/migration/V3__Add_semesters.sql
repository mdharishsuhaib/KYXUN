-- V3: Semesters table

CREATE TABLE semesters
(
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL,
    name          VARCHAR(100) NOT NULL,
    semester_type VARCHAR(20) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    academic_year VARCHAR(50),
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_semester_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_semester_type
        CHECK (semester_type IN ('FIRST','SECOND','THIRD','FOURTH','FIFTH','SIXTH','SEVENTH','EIGHTH')),
    CONSTRAINT chk_semester_dates
        CHECK (end_date >= start_date)
);

CREATE INDEX idx_semester_user ON semesters(user_id);
