-- Google Ads CAPI configuration per brand
create table capi_configs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade unique,

  -- Google Ads credentials
  customer_id text not null,           -- Google Ads Customer ID (without dashes)
  conversion_action_id text not null,  -- Conversion Action resource name

  -- OAuth tokens (encrypted in production)
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,

  -- Configuration
  is_active boolean not null default true,
  batch_size integer not null default 200,
  sync_interval_minutes integer not null default 15,

  -- Metadata
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_count integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table capi_configs enable row level security;

-- Policies for authenticated users
create policy "Authenticated users can CRUD capi_configs" on capi_configs
  for all using (auth.role() = 'authenticated');

-- Index for brand lookup
create index idx_capi_configs_brand on capi_configs(brand_id);
create index idx_capi_configs_active on capi_configs(is_active) where is_active = true;
