grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.subjects to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;

grant select, insert, update, delete on table storage.objects to authenticated;

drop policy if exists "Users can access their own subjects" on public.subjects;
drop policy if exists "Users can read their own subjects" on public.subjects;
drop policy if exists "Users can create their own subjects" on public.subjects;
drop policy if exists "Users can update their own subjects" on public.subjects;
drop policy if exists "Users can delete their own subjects" on public.subjects;

create policy "Users can read their own subjects"
on public.subjects
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own subjects"
on public.subjects
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own subjects"
on public.subjects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own subjects"
on public.subjects
for delete
to authenticated
using (auth.uid() = user_id);
