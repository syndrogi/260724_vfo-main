-- VELFONT OS — daily journal storage
-- Run once in the Supabase SQL Editor. app/components/hub.js reads and
-- writes this table using the public anon key; RLS allows that key to
-- both INSERT and SELECT. The passphrase gate in front of Founder OS is
-- the only access control in front of this data, same as
-- contact_submissions (see contact_table.sql).

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table journal_entries enable row level security;

create policy "Allow public insert"
  on journal_entries
  for insert
  to anon
  with check (true);

create policy "Allow public read"
  on journal_entries
  for select
  to anon
  using (true);
