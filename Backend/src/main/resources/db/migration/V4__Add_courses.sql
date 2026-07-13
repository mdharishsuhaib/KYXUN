-- V4: Courses table

CREATE TABLE courses
(
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL,
    semester_id   UUID,
    subject_id    UUID,
    name          VARCHAR(150) NOT NULL,
    instructor    VARCHAR(100),
    course_code   VARCHAR(30),
    credits       INTEGER,
    schedule_info TEXT,
    color         VARCHAR(10),
    description   TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    CONSTRAINT fk_course_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT chk_course_credits
        CHECK (credits IS NULL OR credits > 0)
);

CREATE INDEX idx_course_user ON courses(user_id);
CREATE INDEX idx_course_semester ON courses(semester_id);
