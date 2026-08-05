-- VELFONT Shop — products schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).

create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  price integer not null,
  status text not null default 'available'
    check (status in ('available', 'sold_out', 'coming_soon')),
  thumbnail text,
  hover_image text,
  description text,
  color text,
  size text,
  stock integer not null default 0,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Public storefront: anyone can read products. Writes are intentionally
-- left with no policy (only the SQL editor / a service_role key can
-- write), since only an authenticated admin surface (Founder OS, later)
-- should ever create/edit/delete a product.
alter table public.products enable row level security;

create policy "Public read access to products"
  on public.products for select
  using (true);

-- Storage bucket for product images. Public bucket so getPublicUrl()
-- works without signed URLs — matches how these images are already
-- served today (plain files under images/).
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "Public read access to product images"
  on storage.objects for select
  using (bucket_id = 'products');
