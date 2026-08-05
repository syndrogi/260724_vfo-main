-- VELFONT Shop — seed data
-- Run this after schema.sql, in the same SQL Editor.
-- Upload 3 images into the `products` storage bucket before loading the
-- shop — the thumbnail paths below are bucket-relative (no `products/`
-- prefix; `from('products')` in resolveImageUrl() already scopes to the
-- bucket) and must match the exact filenames you upload:
--   Short Sleeve Collar Shirt 1.jpg
--   souvenir tee 1.jpg
--   souvenir tee 2.jpg (reused as the placeholder for the 10 sold-out tees)

insert into public.products
  (slug, name, category, price, status, thumbnail, description, color, size, stock, featured, sort_order)
values
  (
    'short-sleeve-collar-shirt-1',
    'Short Sleeve Collar Shirt 1',
    'Tops',
    120000,
    'available',
    'Short Sleeve Collar Shirt 1.jpg',
    '코튼 포플린 원단을 사용한 반소매 카라 셔츠입니다.
칼라 안쪽에 브랜드 라벨이 배치되어 있습니다.
가슴 포켓 디테일과 여유 있는 실루엣이 특징입니다.',
    'Ivory / Black',
    'S, M, L, XL',
    20,
    false,
    1
  ),
  (
    'souvenir-tee-1',
    'Souvenir Tee 1',
    'Tops',
    120000,
    'available',
    'souvenir tee 1.jpg',
    '헤비웨이트 코튼 저지 원단을 사용한 오버사이즈 실루엣 티셔츠입니다.
전면에 그래픽 프린트가 배치되어 있습니다.
슬리브와 헴 라인은 리브 처리되어 형태를 오래 유지합니다.',
    'Ivory / Black',
    'S, M, L, XL',
    20,
    false,
    2
  ),
  (
    'souvenir-tee-2',
    'Souvenir Tee 2',
    'Tops',
    120000,
    'sold_out',
    'souvenir tee 2.jpg',
    '헤비웨이트 코튼 저지 원단을 사용한 오버사이즈 실루엣 티셔츠입니다.
전면에 그래픽 프린트가 배치되어 있습니다.
슬리브와 헴 라인은 리브 처리되어 형태를 오래 유지합니다.',
    'Ivory / Black',
    'S, M, L, XL',
    0,
    false,
    3
  ),
  ('souvenir-tee-3', 'Souvenir Tee 3', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 4),
  ('souvenir-tee-4', 'Souvenir Tee 4', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 5),
  ('souvenir-tee-5', 'Souvenir Tee 5', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 6),
  ('souvenir-tee-6', 'Souvenir Tee 6', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 7),
  ('souvenir-tee-7', 'Souvenir Tee 7', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 8),
  ('souvenir-tee-8', 'Souvenir Tee 8', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 9),
  ('souvenir-tee-9', 'Souvenir Tee 9', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 10),
  ('souvenir-tee-10', 'Souvenir Tee 10', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 11),
  ('souvenir-tee-11', 'Souvenir Tee 11', 'Tops', 120000, 'sold_out', 'souvenir tee 2.jpg', null, 'Ivory / Black', 'S, M, L, XL', 0, false, 12);
