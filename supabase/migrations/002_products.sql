-- Products table (linked to brand)
create table products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  description text,
  sku text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product images table (multiple per product, one hero)
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  image_url text not null,
  is_hero boolean default false,
  angle text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table products enable row level security;
alter table product_images enable row level security;

-- Policies: allow all operations for authenticated users (internal tool)
create policy "Authenticated users can CRUD products" on products
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users can CRUD product_images" on product_images
  for all using (auth.role() = 'authenticated');

-- Index for faster lookups
create index idx_products_brand_id on products(brand_id);
create index idx_product_images_product_id on product_images(product_id);
