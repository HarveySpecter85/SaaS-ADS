-- External data sources for contextual triggers
create table data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('weather', 'calendar', 'custom')),
  config jsonb not null default '{}',
  -- Weather: { api_key, location, units }
  -- Calendar: { events: [...] }
  -- Custom: { data: {...} }
  is_active boolean not null default true,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cached data from external sources
create table data_source_values (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid references data_sources(id) on delete cascade,
  key text not null,
  value jsonb not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table data_sources enable row level security;
alter table data_source_values enable row level security;

-- Policies for authenticated users
create policy "Authenticated users can CRUD data_sources" on data_sources
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can CRUD data_source_values" on data_source_values
  for all using (auth.role() = 'authenticated');

-- Indexes
create index idx_data_sources_type on data_sources(type);
create index idx_data_source_values_source_id on data_source_values(data_source_id);
create index idx_data_source_values_key on data_source_values(key);
create unique index idx_data_source_values_unique on data_source_values(data_source_id, key);
