-- API usage tracking for cost monitoring
create table api_usage (
  id uuid primary key default gen_random_uuid(),

  -- Request identification
  api_provider text not null default 'google_ai',  -- 'google_ai', 'openweathermap'
  api_endpoint text not null,                       -- 'chat', 'extract', 'generate'
  model text,                                        -- 'gemini-2.0-flash', etc.

  -- Usage metrics
  input_tokens integer default 0,
  output_tokens integer default 0,
  total_tokens integer generated always as (input_tokens + output_tokens) stored,

  -- Cost tracking (estimated)
  estimated_cost_usd decimal(10,6) default 0,

  -- Context
  brand_id uuid references brands(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  user_id uuid,

  -- Request metadata
  request_duration_ms integer,
  status text not null default 'success' check (status in ('success', 'error', 'timeout')),
  error_message text,

  -- Timestamps
  created_at timestamptz default now()
);

-- Enable RLS
alter table api_usage enable row level security;

-- Policy for authenticated users
create policy "Authenticated users can view api_usage" on api_usage
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert api_usage" on api_usage
  for insert with check (auth.role() = 'authenticated');

-- Indexes for analytics queries
create index idx_api_usage_provider on api_usage(api_provider);
create index idx_api_usage_created on api_usage(created_at desc);
create index idx_api_usage_brand on api_usage(brand_id) where brand_id is not null;
create index idx_api_usage_date on api_usage(date_trunc('day', created_at));
