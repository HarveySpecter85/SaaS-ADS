-- Conversion events for server-side tracking
create table conversion_events (
  id uuid primary key default gen_random_uuid(),

  -- Event identification
  event_name text not null,  -- 'purchase', 'lead', 'signup', 'add_to_cart', 'page_view'
  event_id text unique,      -- External event ID for deduplication

  -- User data (hashed for Enhanced Conversions)
  user_email_hash text,      -- SHA256 hash of lowercase email
  user_phone_hash text,      -- SHA256 hash of E.164 phone
  user_first_name_hash text, -- SHA256 hash of lowercase first name
  user_last_name_hash text,  -- SHA256 hash of lowercase last name
  user_ip text,              -- IP address (for geo)
  user_agent text,           -- Browser user agent

  -- Event data
  event_value decimal(10,2), -- Monetary value (for purchases)
  currency text default 'USD',
  transaction_id text,       -- Order ID for purchases

  -- Custom parameters (JSON for flexibility)
  custom_params jsonb default '{}',

  -- Tracking metadata
  source text,               -- 'website', 'chat', 'api'
  campaign_id uuid references campaigns(id) on delete set null,
  brand_id uuid references brands(id) on delete set null,

  -- CAPI sync status
  sync_status text not null default 'pending' check (sync_status in (
    'pending',    -- Not yet sent
    'queued',     -- In queue for sending
    'sent',       -- Successfully sent to Google
    'failed',     -- Failed to send (will retry)
    'skipped'     -- Skipped (e.g., test event)
  )),
  sync_attempts integer default 0,
  synced_at timestamptz,
  sync_error text,

  -- Timestamps
  event_time timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table conversion_events enable row level security;

-- Policies for authenticated users
create policy "Authenticated users can CRUD conversion_events" on conversion_events
  for all using (auth.role() = 'authenticated');

-- Indexes for common queries
create index idx_conversion_events_status on conversion_events(sync_status);
create index idx_conversion_events_event_name on conversion_events(event_name);
create index idx_conversion_events_event_time on conversion_events(event_time desc);
create index idx_conversion_events_campaign on conversion_events(campaign_id) where campaign_id is not null;
create index idx_conversion_events_brand on conversion_events(brand_id) where brand_id is not null;
