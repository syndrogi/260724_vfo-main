-- VELFONT OFFICE — contact form storage
-- Run once in the Supabase SQL Editor. js/contact.js inserts into this
-- table using the public anon key; RLS restricts that key to INSERT
-- only, so submissions can't be read back from the browser.

create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  reason text,
  comment text,
  created_at timestamptz not null default now()
);

alter table contact_submissions enable row level security;

create policy "Allow public insert"
  on contact_submissions
  for insert
  to anon
  with check (true);
