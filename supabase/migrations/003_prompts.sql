-- Campaign templates (goal-based bundles)
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null,
  goal text not null check (goal in ('awareness', 'lead_gen', 'conversion')),
  status text not null default 'draft' check (status in ('draft', 'generating', 'complete')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generated prompts (the actual variations)
create table prompts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  prompt_text text not null,
  headline text,
  description text,
  cta text,
  variation_type text, -- e.g., 'hero_focus', 'lifestyle', 'benefit_driven'
  is_preview boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table campaigns enable row level security;
alter table prompts enable row level security;

-- Policies for authenticated users
create policy "Authenticated users can CRUD campaigns" on campaigns
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users can CRUD prompts" on prompts
  for all using (auth.role() = 'authenticated');

-- Indexes
create index idx_campaigns_product_id on campaigns(product_id);
create index idx_prompts_campaign_id on prompts(campaign_id);
