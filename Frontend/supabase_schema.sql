create extension if not exists pgcrypto;

-- 1. Users Profile Table (linked to Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for users
alter table public.users enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'users' and policyname = 'Allow users to read/write their own profile'
  ) then
    create policy "Allow users to read/write their own profile" on public.users
      for all using (auth.uid() = id);
  end if;
end $$;

-- Trigger to sync auth.users with public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, photo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name),
      photo = coalesce(excluded.photo, public.users.photo);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Documents & Chunks (AI Knowledge Pipeline)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid,
  filename text,
  file_name text,
  storage_path text unique,
  mime_type text,
  file_type text,
  size bigint,
  file_size text,
  sha256 text,
  sha256_hash text,
  status text default 'uploaded' not null,
  processing_progress integer default 0 not null,
  summary_available boolean default false not null,
  flashcards_available boolean default false not null,
  extraction_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.documents enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Users can access their own documents') then
    create policy "Users can access their own documents" on public.documents for all using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'Users can upload their own documents') then
    create policy "Users can upload their own documents" on storage.objects
      for insert with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'Users can read their own documents') then
    create policy "Users can read their own documents" on storage.objects
      for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'Users can delete their own documents') then
    create policy "Users can delete their own documents" on storage.objects
      for delete using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  chunk_index integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.document_chunks enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'document_chunks' and policyname = 'Users can access their own document chunks') then
    create policy "Users can access their own document chunks" on public.document_chunks for all using (auth.uid() = user_id);
  end if;
end $$;

-- 3. Study Plans
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject text not null,
  days integer not null,
  hours_per_day integer not null,
  total_chapters integer not null,
  completed_chapters integer not null,
  goal text not null,
  plan_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.study_plans enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'study_plans' and policyname = 'Users can access their own study plans') then
    create policy "Users can access their own study plans" on public.study_plans for all using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Previous-Year Question Papers (PYQs) & Analysis
create table if not exists public.pyq_papers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject text not null,
  paper_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pyq_papers enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'pyq_papers' and policyname = 'Users can access their own pyq papers') then
    create policy "Users can access their own pyq papers" on public.pyq_papers for all using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.pyq_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  paper_id uuid references public.pyq_papers on delete cascade,
  subject text not null,
  analysis_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pyq_analyses enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'pyq_analyses' and policyname = 'Users can access their own pyq analyses') then
    create policy "Users can access their own pyq analyses" on public.pyq_analyses for all using (auth.uid() = user_id);
  end if;
end $$;

-- 5. Readiness Scores (Assessment History for Trend Analysis)
create table if not exists public.readiness_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  plan_id uuid references public.study_plans on delete cascade not null,
  readiness_score integer not null,
  knowledge_coverage integer not null,
  revision_readiness integer not null,
  predicted_marks text not null,
  strong_topics jsonb not null,
  weak_topics jsonb not null,
  exam_risk_level text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.readiness_scores enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'readiness_scores' and policyname = 'Users can access their own readiness scores') then
    create policy "Users can access their own readiness scores" on public.readiness_scores for all using (auth.uid() = user_id);
  end if;
end $$;

-- 6. Flashcards
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  plan_id uuid references public.study_plans on delete cascade not null,
  front text not null,
  back text not null,
  tag text not null,
  difficulty text default 'Medium',
  is_mastered boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.flashcards enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'flashcards' and policyname = 'Users can access their own flashcards') then
    create policy "Users can access their own flashcards" on public.flashcards for all using (auth.uid() = user_id);
  end if;
end $$;

-- 7. Viva Attempts
create table if not exists public.viva_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  plan_id uuid references public.study_plans on delete cascade not null,
  question text not null,
  user_answer text not null,
  model_answer text not null,
  accuracy_score integer not null,
  confidence_score integer not null,
  feedback text not null,
  confidence_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.viva_attempts enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'viva_attempts' and policyname = 'Users can access their own viva attempts') then
    create policy "Users can access their own viva attempts" on public.viva_attempts for all using (auth.uid() = user_id);
  end if;
end $$;

-- 8. Normalized Chat Sessions & Messages
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  plan_id uuid references public.study_plans on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_sessions enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'chat_sessions' and policyname = 'Users can access their own chat sessions') then
    create policy "Users can access their own chat sessions" on public.chat_sessions for all using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null,
  content text not null,
  attachments jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_messages enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'chat_messages' and policyname = 'Users can access their own chat messages') then
    create policy "Users can access their own chat messages" on public.chat_messages for all using (auth.uid() = user_id);
  end if;
end $$;

-- 9. Subjects Table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  semester text,
  color text default '#6366f1' not null,
  icon text default '??' not null,
  progress integer default 0 not null,
  last_opened_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subjects enable row level security;
do $ $
begin
  if not exists (select 1 from pg_policies where tablename = 'subjects' and policyname = 'Users can access their own subjects') then
    create policy "Users can access their own subjects" on public.subjects for all using (auth.uid() = user_id);
  end if;
end $ $;

-- 10. Library Files Table
create table if not exists public.library_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete set null,
  file_name text not null,
  original_name text not null,
  file_size text,
  file_type text,
  sha256_hash text not null,
  extraction_text text,
  page_count integer,
  analyzed boolean default false not null,
  version integer default 1 not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.library_files enable row level security;
do $ $
begin
  if not exists (select 1 from pg_policies where tablename = 'library_files' and policyname = 'Users can access their own library files') then
    create policy "Users can access their own library files" on public.library_files for all using (auth.uid() = user_id);
  end if;
end $ $;

-- Add subject_id to study_plans if it doesn't exist
do $ $
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='study_plans' and column_name='subject_id') then
    alter table public.study_plans add column subject_id uuid references public.subjects on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='study_plans' and column_name='source_document_ids') then
    alter table public.study_plans add column source_document_ids jsonb default '[]'::jsonb not null;
  end if;
end $ $;

-- Add subject_id to chat_sessions if it doesn't exist
do $ $
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='chat_sessions' and column_name='subject_id') then
    alter table public.chat_sessions add column subject_id uuid references public.subjects on delete cascade;
  end if;
end $ $;

-- 11. Generated resources for workspace knowledge base
create table if not exists public.generated_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade,
  plan_id uuid references public.study_plans on delete cascade,
  resource_type text not null,
  content text not null,
  pipeline_stats text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.generated_resources enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'generated_resources' and policyname = 'Users can access their own generated resources') then
    create policy "Users can access their own generated resources" on public.generated_resources for all using (auth.uid() = user_id);
  end if;
end $$;

-- Indexes
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_storage_path on public.documents(storage_path);
create index if not exists idx_documents_sha256 on public.documents(sha256);
create index if not exists idx_document_chunks_document_id on public.document_chunks(document_id);
create index if not exists idx_document_chunks_user_id on public.document_chunks(user_id);
create index if not exists idx_study_plans_user_id on public.study_plans(user_id);
create index if not exists idx_flashcards_user_id on public.flashcards(user_id);
create index if not exists idx_flashcards_plan_id on public.flashcards(plan_id);
create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_subjects_user_id on public.subjects(user_id);
create index if not exists idx_library_files_user_id on public.library_files(user_id);
create index if not exists idx_library_files_subject_id on public.library_files(subject_id);
create index if not exists idx_library_files_sha256 on public.library_files(sha256_hash);
create index if not exists idx_generated_resources_user_id on public.generated_resources(user_id);
create index if not exists idx_generated_resources_subject_id on public.generated_resources(subject_id);
create index if not exists idx_generated_resources_plan_id on public.generated_resources(plan_id);
