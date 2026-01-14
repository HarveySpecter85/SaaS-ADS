-- ============================================================================
-- FULL DATABASE SETUP - Run this ONCE in Supabase SQL Editor
-- This creates all tables, indexes, and security policies
-- ============================================================================

-- ============================================================================
-- 1. BRANDS & BRANDING
-- ============================================================================

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  source_pdf_url text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table brand_colors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  hex_code text not null,
  name text,
  usage text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table brand_fonts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  font_family text not null,
  font_weight text,
  usage text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table brand_tone (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  descriptor text not null,
  example text,
  created_at timestamptz default now()
);

-- ============================================================================
-- 2. PRODUCTS
-- ============================================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  description text,
  sku text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  image_url text not null,
  is_hero boolean default false,
  angle text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================================
-- 3. CAMPAIGNS & PROMPTS
-- ============================================================================

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null,
  goal text not null check (goal in ('awareness', 'lead_gen', 'conversion')),
  status text not null default 'draft' check (status in ('draft', 'generating', 'complete')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  prompt_text text not null,
  headline text,
  description text,
  cta text,
  variation_type text,
  is_preview boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- 4. ASSETS
-- ============================================================================

create table assets (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  image_url text not null,
  width integer not null,
  height integer not null,
  format text not null check (format in ('png', 'jpg', 'webp')),
  platform text,
  status text not null default 'generating' check (status in ('generating', 'complete', 'failed')),
  created_at timestamptz default now()
);

-- ============================================================================
-- 5. DATA SOURCES & TRIGGERS
-- ============================================================================

create table data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('weather', 'calendar', 'custom')),
  config jsonb not null default '{}',
  is_active boolean not null default true,
  user_id uuid references auth.users(id) on delete cascade,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table data_source_values (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid references data_sources(id) on delete cascade,
  key text not null,
  value jsonb not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table trigger_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data_source_id uuid references data_sources(id) on delete cascade,
  condition_key text not null,
  condition_operator text not null check (condition_operator in (
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains'
  )),
  condition_value text not null,
  action_type text not null default 'recommend_goal' check (action_type in (
    'recommend_goal', 'recommend_tag', 'show_message'
  )),
  action_value text not null,
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 6. CONVERSION TRACKING
-- ============================================================================

create table conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_id text unique,
  user_email_hash text,
  user_phone_hash text,
  user_first_name_hash text,
  user_last_name_hash text,
  user_ip text,
  user_agent text,
  event_value decimal(10,2),
  currency text default 'USD',
  transaction_id text,
  custom_params jsonb default '{}',
  source text,
  campaign_id uuid references campaigns(id) on delete set null,
  brand_id uuid references brands(id) on delete set null,
  sync_status text not null default 'pending' check (sync_status in (
    'pending', 'queued', 'sent', 'failed', 'skipped'
  )),
  sync_attempts integer default 0,
  synced_at timestamptz,
  sync_error text,
  event_time timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table capi_configs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade unique,
  customer_id text not null,
  conversion_action_id text not null,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean not null default true,
  batch_size integer not null default 200,
  sync_interval_minutes integer not null default 15,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 7. API USAGE TRACKING
-- ============================================================================

create table api_usage (
  id uuid primary key default gen_random_uuid(),
  api_provider text not null default 'google_ai',
  api_endpoint text not null,
  model text,
  input_tokens integer default 0,
  output_tokens integer default 0,
  total_tokens integer generated always as (input_tokens + output_tokens) stored,
  estimated_cost_usd decimal(10,6) default 0,
  brand_id uuid references brands(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  request_duration_ms integer,
  status text not null default 'success' check (status in ('success', 'error', 'timeout')),
  error_message text,
  created_at timestamptz default now()
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

create index idx_brands_user_id on brands(user_id);
create index idx_products_brand_id on products(brand_id);
create index idx_product_images_product_id on product_images(product_id);
create index idx_campaigns_product_id on campaigns(product_id);
create index idx_prompts_campaign_id on prompts(campaign_id);
create index idx_assets_prompt_id on assets(prompt_id);
create index idx_assets_campaign_id on assets(campaign_id);
create index idx_assets_platform on assets(platform);
create index idx_data_sources_type on data_sources(type);
create index idx_data_sources_user_id on data_sources(user_id);
create index idx_data_source_values_source_id on data_source_values(data_source_id);
create index idx_data_source_values_key on data_source_values(key);
create unique index idx_data_source_values_unique on data_source_values(data_source_id, key);
create index idx_trigger_rules_data_source on trigger_rules(data_source_id);
create index idx_trigger_rules_active on trigger_rules(is_active) where is_active = true;
create index idx_conversion_events_status on conversion_events(sync_status);
create index idx_conversion_events_event_name on conversion_events(event_name);
create index idx_conversion_events_event_time on conversion_events(event_time desc);
create index idx_conversion_events_campaign on conversion_events(campaign_id) where campaign_id is not null;
create index idx_conversion_events_brand on conversion_events(brand_id) where brand_id is not null;
create index idx_capi_configs_brand on capi_configs(brand_id);
create index idx_capi_configs_active on capi_configs(is_active) where is_active = true;
create index idx_api_usage_provider on api_usage(api_provider);
create index idx_api_usage_created on api_usage(created_at desc);
create index idx_api_usage_brand on api_usage(brand_id) where brand_id is not null;
create index idx_api_usage_user_id on api_usage(user_id);

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ============================================================================

alter table brands enable row level security;
alter table brand_colors enable row level security;
alter table brand_fonts enable row level security;
alter table brand_tone enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table campaigns enable row level security;
alter table prompts enable row level security;
alter table assets enable row level security;
alter table data_sources enable row level security;
alter table data_source_values enable row level security;
alter table trigger_rules enable row level security;
alter table conversion_events enable row level security;
alter table capi_configs enable row level security;
alter table api_usage enable row level security;

-- ============================================================================
-- 10. CREATE USER-SCOPED RLS POLICIES
-- ============================================================================

-- ROOT TABLES: Direct user_id check
create policy "Users can manage their own brands" on brands
  for all using (user_id = auth.uid());

create policy "Users can manage their own data_sources" on data_sources
  for all using (user_id = auth.uid());

create policy "Users can view their own api_usage" on api_usage
  for select using (user_id = auth.uid());

create policy "Users can insert their own api_usage" on api_usage
  for insert with check (user_id = auth.uid());

-- CHILD TABLES: Check parent ownership

create policy "Users can manage colors for their brands" on brand_colors
  for all using (
    exists (select 1 from brands where brands.id = brand_colors.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can manage fonts for their brands" on brand_fonts
  for all using (
    exists (select 1 from brands where brands.id = brand_fonts.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can manage tone for their brands" on brand_tone
  for all using (
    exists (select 1 from brands where brands.id = brand_tone.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can manage products for their brands" on products
  for all using (
    exists (select 1 from brands where brands.id = products.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can manage images for their products" on product_images
  for all using (
    exists (
      select 1 from products
      join brands on brands.id = products.brand_id
      where products.id = product_images.product_id and brands.user_id = auth.uid()
    )
  );

create policy "Users can manage campaigns for their products" on campaigns
  for all using (
    exists (
      select 1 from products
      join brands on brands.id = products.brand_id
      where products.id = campaigns.product_id and brands.user_id = auth.uid()
    )
  );

create policy "Users can manage prompts for their campaigns" on prompts
  for all using (
    exists (
      select 1 from campaigns
      join products on products.id = campaigns.product_id
      join brands on brands.id = products.brand_id
      where campaigns.id = prompts.campaign_id and brands.user_id = auth.uid()
    )
  );

create policy "Users can manage assets for their campaigns" on assets
  for all using (
    exists (
      select 1 from campaigns
      join products on products.id = campaigns.product_id
      join brands on brands.id = products.brand_id
      where campaigns.id = assets.campaign_id and brands.user_id = auth.uid()
    )
  );

create policy "Users can manage values for their data_sources" on data_source_values
  for all using (
    exists (select 1 from data_sources where data_sources.id = data_source_values.data_source_id and data_sources.user_id = auth.uid())
  );

create policy "Users can manage rules for their data_sources" on trigger_rules
  for all using (
    exists (select 1 from data_sources where data_sources.id = trigger_rules.data_source_id and data_sources.user_id = auth.uid())
  );

create policy "Users can manage conversions for their brands" on conversion_events
  for all using (
    exists (select 1 from brands where brands.id = conversion_events.brand_id and brands.user_id = auth.uid())
  );

create policy "Users can manage capi_configs for their brands" on capi_configs
  for all using (
    exists (select 1 from brands where brands.id = capi_configs.brand_id and brands.user_id = auth.uid())
  );

-- ============================================================================
-- 11. AUTO-SET user_id ON INSERT (Triggers)
-- ============================================================================

create or replace function set_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger set_brands_user_id
  before insert on brands
  for each row execute function set_user_id();

create trigger set_data_sources_user_id
  before insert on data_sources
  for each row execute function set_user_id();

create trigger set_api_usage_user_id
  before insert on api_usage
  for each row execute function set_user_id();

-- ============================================================================
-- DONE! Your database is ready.
-- ============================================================================
