-- Trigger rules linking data sources to campaigns
create table trigger_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data_source_id uuid references data_sources(id) on delete cascade,

  -- Condition: what to check
  condition_key text not null,  -- e.g., 'temperature', 'conditions'
  condition_operator text not null check (condition_operator in (
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains'
  )),
  condition_value text not null,  -- e.g., '25', 'Rain'

  -- Action: what to recommend
  action_type text not null default 'recommend_goal' check (action_type in (
    'recommend_goal',   -- Recommend campaigns with matching goal
    'recommend_tag',    -- Recommend campaigns with tag (future)
    'show_message'      -- Display a message (future)
  )),
  action_value text not null,  -- e.g., 'conversion', 'summer-sale'

  -- Metadata
  is_active boolean not null default true,
  priority integer not null default 0,  -- Higher = evaluated first
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table trigger_rules enable row level security;

-- Policies for authenticated users
create policy "Authenticated users can CRUD trigger_rules" on trigger_rules
  for all using (auth.role() = 'authenticated');

-- Indexes
create index idx_trigger_rules_data_source on trigger_rules(data_source_id);
create index idx_trigger_rules_active on trigger_rules(is_active) where is_active = true;
