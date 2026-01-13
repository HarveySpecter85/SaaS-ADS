-- Brands table (one per client)
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  source_pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Brand colors (multiple per brand)
create table brand_colors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  hex_code text not null,
  name text,
  usage text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Brand fonts (multiple per brand)
create table brand_fonts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  font_family text not null,
  font_weight text,
  usage text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Brand tone of voice (one per brand, but flexible structure)
create table brand_tone (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  descriptor text not null,
  example text,
  created_at timestamptz default now()
);

-- Enable RLS (but allow all authenticated users - internal tool)
alter table brands enable row level security;
alter table brand_colors enable row level security;
alter table brand_fonts enable row level security;
alter table brand_tone enable row level security;

-- Policies: allow all operations for authenticated users
create policy "Authenticated users can CRUD brands" on brands
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users can CRUD brand_colors" on brand_colors
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users can CRUD brand_fonts" on brand_fonts
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users can CRUD brand_tone" on brand_tone
  for all using (auth.role() = 'authenticated');
