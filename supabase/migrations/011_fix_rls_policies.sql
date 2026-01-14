-- Fix RLS policies: auth.role() doesn't work, use auth.uid() IS NOT NULL

-- Drop and recreate all policies with correct auth check

-- 001_brands.sql
drop policy if exists "Authenticated users can manage brands" on brands;
drop policy if exists "Authenticated users can manage brand_colors" on brand_colors;
drop policy if exists "Authenticated users can manage brand_fonts" on brand_fonts;
drop policy if exists "Authenticated users can manage brand_tone" on brand_tone;

create policy "Authenticated users can manage brands" on brands
  for all using (auth.uid() is not null);
create policy "Authenticated users can manage brand_colors" on brand_colors
  for all using (auth.uid() is not null);
create policy "Authenticated users can manage brand_fonts" on brand_fonts
  for all using (auth.uid() is not null);
create policy "Authenticated users can manage brand_tone" on brand_tone
  for all using (auth.uid() is not null);

-- 002_products.sql
drop policy if exists "Authenticated users can manage products" on products;
drop policy if exists "Authenticated users can manage product_images" on product_images;

create policy "Authenticated users can manage products" on products
  for all using (auth.uid() is not null);
create policy "Authenticated users can manage product_images" on product_images
  for all using (auth.uid() is not null);

-- 003_prompts.sql
drop policy if exists "Authenticated users can manage campaigns" on campaigns;
drop policy if exists "Authenticated users can manage prompts" on prompts;

create policy "Authenticated users can manage campaigns" on campaigns
  for all using (auth.uid() is not null);
create policy "Authenticated users can manage prompts" on prompts
  for all using (auth.uid() is not null);

-- 004_assets.sql
drop policy if exists "Authenticated users can manage assets" on assets;

create policy "Authenticated users can manage assets" on assets
  for all using (auth.uid() is not null);

-- 005_data_sources.sql
drop policy if exists "Authenticated users can CRUD data_sources" on data_sources;
drop policy if exists "Authenticated users can CRUD data_source_values" on data_source_values;

create policy "Authenticated users can CRUD data_sources" on data_sources
  for all using (auth.uid() is not null);
create policy "Authenticated users can CRUD data_source_values" on data_source_values
  for all using (auth.uid() is not null);

-- 006_trigger_rules.sql
drop policy if exists "Authenticated users can manage trigger_rules" on trigger_rules;

create policy "Authenticated users can manage trigger_rules" on trigger_rules
  for all using (auth.uid() is not null);

-- 008_conversion_events.sql
drop policy if exists "Authenticated users can manage conversion_events" on conversion_events;

create policy "Authenticated users can manage conversion_events" on conversion_events
  for all using (auth.uid() is not null);

-- 009_capi_config.sql
drop policy if exists "Authenticated users can manage capi_config" on capi_config;

create policy "Authenticated users can manage capi_config" on capi_config
  for all using (auth.uid() is not null);

-- 010_api_usage.sql
drop policy if exists "Authenticated users can view api_usage" on api_usage;
drop policy if exists "Authenticated users can insert api_usage" on api_usage;

create policy "Authenticated users can view api_usage" on api_usage
  for select using (auth.uid() is not null);
create policy "Authenticated users can insert api_usage" on api_usage
  for insert with check (auth.uid() is not null);
