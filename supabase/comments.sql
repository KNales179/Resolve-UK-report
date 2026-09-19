-- Comments on the Resolve UK reports site.
-- Run this once in the SQL editor of the Supabase project that backs the site.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  target text not null default 'general',
  body text not null check (char_length(body) between 1 and 4000),
  author_id uuid not null default auth.uid(),
  author_email text not null default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);

create index if not exists comments_page_target_idx
  on public.comments (page, target, created_at);

alter table public.comments enable row level security;

-- Only people who have signed in can read. Sign-ups are switched off in
-- Authentication settings, so only invited people can ever sign in.
create policy "Signed-in people can read comments"
  on public.comments for select
  to authenticated
  using (true);

-- Signed-in people can add comments as themselves. There is no update or
-- delete policy, so nothing can be edited or removed from the site itself.
create policy "Signed-in people can add their own comments"
  on public.comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and author_email = (auth.jwt() ->> 'email')
  );
