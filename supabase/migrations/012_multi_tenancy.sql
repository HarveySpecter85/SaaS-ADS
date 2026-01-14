-- Migration: Multi-tenant data isolation
-- Adds user_id to root tables and updates RLS policies for user-scoped access

-- ============================================================================
-- STEP 1: Add user_id columns to root tables
-- ============================================================================

-- Add user_id to brands table (main root entity)
alter table brands add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Add user_id to data_sources table (standalone root entity)
alter table data_sources add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Add user_id to api_usage table (standalone root entity)
alter table api_usage add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Create indexes for efficient RLS queries
create index if not exists idx_brands_user_id on brands(user_id);
create index if not exists idx_data_sources_user_id on data_sources(user_id);
create index if not exists idx_api_usage_user_id on api_usage(user_id);

-- ============================================================================
-- STEP 2: Drop all existing RLS policies
-- ============================================================================

-- Brands and related
drop policy if exists "Authenticated users can manage brands" on brands;
drop policy if exists "Authenticated users can manage brand_colors" on brand_colors;
drop policy if exists "Authenticated users can manage brand_fonts" on brand_fonts;
drop policy if exists "Authenticated users can manage brand_tone" on brand_tone;

-- Products and related
drop policy if exists "Authenticated users can manage products" on products;
drop policy if exists "Authenticated users can manage product_images" on product_images;

-- Campaigns and related
drop policy if exists "Authenticated users can manage campaigns" on campaigns;
drop policy if exists "Authenticated users can manage prompts" on prompts;
drop policy if exists "Authenticated users can manage assets" on assets;

-- Data sources and related
drop policy if exists "Authenticated users can manage data_sources" on data_sources;
drop policy if exists "Authenticated users can manage data_source_values" on data_source_values;
drop policy if exists "Authenticated users can manage trigger_rules" on trigger_rules;

-- Conversions and CAPI
drop policy if exists "Authenticated users can manage conversion_events" on conversion_events;
drop policy if exists "Authenticated users can manage capi_configs" on capi_configs;

-- API Usage
drop policy if exists "Authenticated users can view api_usage" on api_usage;
drop policy if exists "Authenticated users can insert api_usage" on api_usage;

-- ============================================================================
-- STEP 3: Create user-scoped RLS policies for ROOT tables
-- ============================================================================

-- Brands: Users can only access their own brands
create policy "Users can manage their own brands" on brands
  for all using (user_id = auth.uid());

-- Data Sources: Users can only access their own data sources
create policy "Users can manage their own data_sources" on data_sources
  for all using (user_id = auth.uid());

-- API Usage: Users can only view their own usage
create policy "Users can view their own api_usage" on api_usage
  for select using (user_id = auth.uid());

create policy "Users can insert their own api_usage" on api_usage
  for insert with check (user_id = auth.uid());

-- ============================================================================
-- STEP 4: Create user-scoped RLS policies for CHILD tables (via parent lookup)
-- ============================================================================

-- Brand Colors: Access through brand ownership
create policy "Users can manage colors for their brands" on brand_colors
  for all using (
    exists (
      select 1 from brands
      where brands.id = brand_colors.brand_id
      and brands.user_id = auth.uid()
    )
  );

-- Brand Fonts: Access through brand ownership
create policy "Users can manage fonts for their brands" on brand_fonts
  for all using (
    exists (
      select 1 from brands
      where brands.id = brand_fonts.brand_id
      and brands.user_id = auth.uid()
    )
  );

-- Brand Tone: Access through brand ownership
create policy "Users can manage tone for their brands" on brand_tone
  for all using (
    exists (
      select 1 from brands
      where brands.id = brand_tone.brand_id
      and brands.user_id = auth.uid()
    )
  );

-- Products: Access through brand ownership
create policy "Users can manage products for their brands" on products
  for all using (
    exists (
      select 1 from brands
      where brands.id = products.brand_id
      and brands.user_id = auth.uid()
    )
  );

-- Product Images: Access through product -> brand chain
create policy "Users can manage images for their products" on product_images
  for all using (
    exists (
      select 1 from products
      join brands on brands.id = products.brand_id
      where products.id = product_images.product_id
      and brands.user_id = auth.uid()
    )
  );

-- Campaigns: Access through product -> brand chain
create policy "Users can manage campaigns for their products" on campaigns
  for all using (
    exists (
      select 1 from products
      join brands on brands.id = products.brand_id
      where products.id = campaigns.product_id
      and brands.user_id = auth.uid()
    )
  );

-- Prompts: Access through campaign -> product -> brand chain
create policy "Users can manage prompts for their campaigns" on prompts
  for all using (
    exists (
      select 1 from campaigns
      join products on products.id = campaigns.product_id
      join brands on brands.id = products.brand_id
      where campaigns.id = prompts.campaign_id
      and brands.user_id = auth.uid()
    )
  );

-- Assets: Access through campaign -> product -> brand chain
create policy "Users can manage assets for their campaigns" on assets
  for all using (
    exists (
      select 1 from campaigns
      join products on products.id = campaigns.product_id
      join brands on brands.id = products.brand_id
      where campaigns.id = assets.campaign_id
      and brands.user_id = auth.uid()
    )
  );

-- Data Source Values: Access through data_source ownership
create policy "Users can manage values for their data_sources" on data_source_values
  for all using (
    exists (
      select 1 from data_sources
      where data_sources.id = data_source_values.data_source_id
      and data_sources.user_id = auth.uid()
    )
  );

-- Trigger Rules: Access through data_source ownership
create policy "Users can manage rules for their data_sources" on trigger_rules
  for all using (
    exists (
      select 1 from data_sources
      where data_sources.id = trigger_rules.data_source_id
      and data_sources.user_id = auth.uid()
    )
  );

-- Conversion Events: Access through brand ownership
create policy "Users can manage conversions for their brands" on conversion_events
  for all using (
    exists (
      select 1 from brands
      where brands.id = conversion_events.brand_id
      and brands.user_id = auth.uid()
    )
  );

-- CAPI Configs: Access through brand ownership
create policy "Users can manage capi_configs for their brands" on capi_configs
  for all using (
    exists (
      select 1 from brands
      where brands.id = capi_configs.brand_id
      and brands.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 5: Create helper function to get current user's ID (for INSERT operations)
-- ============================================================================

-- Function to automatically set user_id on insert
create or replace function set_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for brands table
drop trigger if exists set_brands_user_id on brands;
create trigger set_brands_user_id
  before insert on brands
  for each row execute function set_user_id();

-- Trigger for data_sources table
drop trigger if exists set_data_sources_user_id on data_sources;
create trigger set_data_sources_user_id
  before insert on data_sources
  for each row execute function set_user_id();

-- Trigger for api_usage table
drop trigger if exists set_api_usage_user_id on api_usage;
create trigger set_api_usage_user_id
  before insert on api_usage
  for each row execute function set_user_id();

-- ============================================================================
-- NOTE: Existing data without user_id
-- ============================================================================
-- After running this migration, existing records will have NULL user_id.
-- You have two options:
--
-- 1. ASSIGN TO FIRST USER (for single-user scenarios):
--    UPDATE brands SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
--    UPDATE data_sources SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
--    UPDATE api_usage SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
--
-- 2. DELETE ORPHANED DATA (for fresh starts):
--    DELETE FROM brands WHERE user_id IS NULL;
--    DELETE FROM data_sources WHERE user_id IS NULL;
--    DELETE FROM api_usage WHERE user_id IS NULL;
--
-- After handling existing data, you can make user_id NOT NULL:
--    ALTER TABLE brands ALTER COLUMN user_id SET NOT NULL;
--    ALTER TABLE data_sources ALTER COLUMN user_id SET NOT NULL;
--    ALTER TABLE api_usage ALTER COLUMN user_id SET NOT NULL;
