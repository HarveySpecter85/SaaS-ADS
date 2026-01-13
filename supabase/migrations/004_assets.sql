-- Generated assets (images from prompts)
create table assets (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  image_url text not null,
  width integer not null,
  height integer not null,
  format text not null check (format in ('png', 'jpg', 'webp')),
  platform text, -- 'google_ads', 'meta', 'tiktok', null for original
  status text not null default 'generating' check (status in ('generating', 'complete', 'failed')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table assets enable row level security;

-- Policies for authenticated users
create policy "Authenticated users can CRUD assets" on assets
  for all using (auth.role() = 'authenticated');

-- Indexes
create index idx_assets_prompt_id on assets(prompt_id);
create index idx_assets_campaign_id on assets(campaign_id);
create index idx_assets_platform on assets(platform);
