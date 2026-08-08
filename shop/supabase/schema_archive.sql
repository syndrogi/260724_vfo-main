-- VELFONT Shop — editorial collection page: additive schema
-- Run this in the Supabase SQL Editor after schema.sql/seed.sql.
-- Nothing existing is altered; these are two new tables plus a backfill.

create table public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  image text not null,                -- storage path, same convention as products.thumbnail
  stage text not null default 'main'
    check (stage in ('main','detail','fabric','construction','campaign')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

create policy "Public read access to product images"
  on public.product_images for select
  using (true);

-- Non-product editorial content (research scans, film stills, construction
-- drawings, etc.) that can be interleaved into the collection feed. Starts
-- empty on purpose — the feed renders fine with zero rows here; adding a
-- row is the only step needed to make one appear.
create table public.archive_blocks (
  id bigint generated always as identity primary key,
  type text not null check (type in (
    'research_scan', 'film_still', 'construction_drawing', 'pdf_preview',
    'fabric_scan', 'prototype_image', 'note', 'technical_diagram'
  )),
  title text,
  caption text,
  image text,
  span integer not null default 1 check (span in (1, 2)), -- grid-column width in the feed
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.archive_blocks enable row level security;

create policy "Public read access to archive blocks"
  on public.archive_blocks for select
  using (true);

-- Separate bucket from product photos since archive imagery (scans, film
-- stills, drawings) is a different kind of asset than product shots.
insert into storage.buckets (id, name, public)
values ('archive', 'archive', true)
on conflict (id) do nothing;

create policy "Public read access to archive images"
  on storage.objects for select
  using (bucket_id = 'archive');

-- Backfill: each existing product's current thumbnail becomes its 'main'
-- stage image, so the hover-cycle/gallery code has at least one image to
-- show per product exactly like it does today.
insert into public.product_images (product_id, image, stage, sort_order)
select id, thumbnail, 'main', 0 from public.products where thumbnail is not null;
