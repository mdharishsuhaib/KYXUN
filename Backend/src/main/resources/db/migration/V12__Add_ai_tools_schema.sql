-- V12: AI Tools Schema (Study Plans, Flashcards, Viva, Chat, PYQ, Readiness)

CREATE TABLE study_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  days INTEGER NOT NULL,
  hours_per_day INTEGER NOT NULL,
  total_chapters INTEGER NOT NULL,
  completed_chapters INTEGER NOT NULL,
  goal TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  source_document_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  tag TEXT NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'Medium',
  is_mastered BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE viva_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  model_answer TEXT NOT NULL,
  accuracy_score INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  confidence_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE pyq_papers (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  paper_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE pyq_analyses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES pyq_papers(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE readiness_scores (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  readiness_score INTEGER NOT NULL,
  knowledge_coverage INTEGER NOT NULL,
  revision_readiness INTEGER NOT NULL,
  predicted_marks VARCHAR(100) NOT NULL,
  strong_topics JSONB NOT NULL,
  weak_topics JSONB NOT NULL,
  exam_risk_level VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_study_plans_user ON study_plans(user_id);
CREATE INDEX idx_flashcards_plan ON flashcards(plan_id);
CREATE INDEX idx_viva_attempts_plan ON viva_attempts(plan_id);
CREATE INDEX idx_chat_sessions_plan ON chat_sessions(plan_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
