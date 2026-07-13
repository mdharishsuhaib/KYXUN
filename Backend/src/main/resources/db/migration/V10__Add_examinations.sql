-- V10: Examinations table for tracking Semester and Model exams

CREATE TABLE examinations
(
    id            UUID PRIMARY KEY,

    user_id       UUID NOT NULL,
    subject_id    UUID NOT NULL,
    semester_id   UUID,

    title         VARCHAR(150) NOT NULL,
    exam_type     VARCHAR(30)  NOT NULL,

    exam_date     DATE NOT NULL,
    start_time    TIME,
    end_time      TIME,
    venue         VARCHAR(255),

    max_marks     INTEGER,
    passing_marks INTEGER,
    marks_obtained INTEGER,

    notes         TEXT,

    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_exam_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,

    CONSTRAINT fk_exam_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,

    CONSTRAINT chk_exam_type
        CHECK (exam_type IN (
            'SEMESTER_EXAM',
            'MODEL_EXAM',
            'INTERNAL_ASSESSMENT',
            'VIVA',
            'PRACTICAL',
            'ASSIGNMENT'
        )),

    CONSTRAINT chk_marks
        CHECK (marks_obtained IS NULL OR (max_marks IS NOT NULL AND marks_obtained <= max_marks))
);

CREATE INDEX idx_exam_user     ON examinations(user_id);
CREATE INDEX idx_exam_subject  ON examinations(subject_id);
CREATE INDEX idx_exam_semester ON examinations(semester_id);
CREATE INDEX idx_exam_date     ON examinations(exam_date);
