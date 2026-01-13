export interface Brand {
  id: string;
  name: string;
  description: string | null;
  source_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandColor {
  id: string;
  brand_id: string;
  hex_code: string;
  name: string | null;
  usage: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface BrandFont {
  id: string;
  brand_id: string;
  font_family: string;
  font_weight: string | null;
  usage: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface BrandTone {
  id: string;
  brand_id: string;
  descriptor: string;
  example: string | null;
  created_at: string;
}

export interface BrandWithRelations extends Brand {
  colors: BrandColor[];
  fonts: BrandFont[];
  tone: BrandTone[];
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_hero: boolean;
  angle: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

// Campaign types
export type CampaignGoal = 'awareness' | 'lead_gen' | 'conversion';
export type CampaignStatus = 'draft' | 'generating' | 'complete';

export interface Campaign {
  id: string;
  product_id: string;
  name: string;
  goal: CampaignGoal;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  campaign_id: string;
  prompt_text: string;
  headline: string | null;
  description: string | null;
  cta: string | null;
  variation_type: string | null;
  is_preview: boolean;
  created_at: string;
}

export interface CampaignWithPrompts extends Campaign {
  prompts: Prompt[];
}

// Asset types
export type AssetFormat = 'png' | 'jpg' | 'webp';
export type AssetStatus = 'generating' | 'complete' | 'failed';
export type AdPlatform = 'google_ads' | 'meta' | 'tiktok';

export interface Asset {
  id: string;
  prompt_id: string;
  campaign_id: string;
  image_url: string;
  width: number;
  height: number;
  format: AssetFormat;
  platform: AdPlatform | null;
  status: AssetStatus;
  created_at: string;
}

export interface AssetWithPrompt extends Asset {
  prompt: Prompt;
}

export interface CampaignWithAssets extends Campaign {
  prompts: Prompt[];
  assets: Asset[];
}

// Data source types
export type DataSourceType = 'weather' | 'calendar' | 'custom';

export interface WeatherConfig {
  api_key?: string;
  location: string;
  units: 'metric' | 'imperial';
}

export interface CalendarConfig {
  events: Array<{
    name: string;
    date: string;
    type: 'holiday' | 'event' | 'sale';
  }>;
}

export interface CustomConfig {
  data: Record<string, unknown>;
}

export type DataSourceConfig = WeatherConfig | CalendarConfig | CustomConfig;

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataSourceValue {
  id: string;
  data_source_id: string;
  key: string;
  value: unknown;
  expires_at: string | null;
  created_at: string;
}

export interface DataSourceWithValues extends DataSource {
  values: DataSourceValue[];
}

// Trigger rule types
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains';
export type TriggerActionType = 'recommend_goal' | 'recommend_tag' | 'show_message';

export interface TriggerRule {
  id: string;
  name: string;
  data_source_id: string;
  condition_key: string;
  condition_operator: ConditionOperator;
  condition_value: string;
  action_type: TriggerActionType;
  action_value: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface TriggerRuleWithSource extends TriggerRule {
  data_source: DataSource;
}

export interface TriggerEvaluation {
  rule: TriggerRule;
  triggered: boolean;
  current_value: unknown;
  recommended_campaigns?: Campaign[];
}

// Conversion event types
export type ConversionEventName = 'purchase' | 'lead' | 'signup' | 'add_to_cart' | 'page_view' | 'custom';
export type ConversionSyncStatus = 'pending' | 'queued' | 'sent' | 'failed' | 'skipped';

export interface ConversionEvent {
  id: string;
  event_name: ConversionEventName;
  event_id: string | null;
  user_email_hash: string | null;
  user_phone_hash: string | null;
  user_first_name_hash: string | null;
  user_last_name_hash: string | null;
  user_ip: string | null;
  user_agent: string | null;
  event_value: number | null;
  currency: string;
  transaction_id: string | null;
  custom_params: Record<string, unknown>;
  source: string | null;
  campaign_id: string | null;
  brand_id: string | null;
  sync_status: ConversionSyncStatus;
  sync_attempts: number;
  synced_at: string | null;
  sync_error: string | null;
  event_time: string;
  created_at: string;
  updated_at: string;
}

export interface ConversionEventInsert {
  event_name: ConversionEventName;
  event_id?: string;
  user_email?: string;      // Will be hashed before storage
  user_phone?: string;      // Will be hashed before storage
  user_first_name?: string; // Will be hashed before storage
  user_last_name?: string;  // Will be hashed before storage
  user_ip?: string;
  user_agent?: string;
  event_value?: number;
  currency?: string;
  transaction_id?: string;
  custom_params?: Record<string, unknown>;
  source?: string;
  campaign_id?: string;
  brand_id?: string;
  event_time?: string;
}

// CAPI Configuration types
export interface CAPIConfig {
  id: string;
  brand_id: string;
  customer_id: string;
  conversion_action_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  batch_size: number;
  sync_interval_minutes: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_count: number;
  created_at: string;
  updated_at: string;
}

export interface CAPIConfigWithBrand extends CAPIConfig {
  brand: Brand;
}

// API Usage types
export type APIProvider = 'google_ai' | 'openweathermap';
export type APIStatus = 'success' | 'error' | 'timeout';

export interface APIUsage {
  id: string;
  api_provider: APIProvider;
  api_endpoint: string;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  brand_id: string | null;
  campaign_id: string | null;
  user_id: string | null;
  request_duration_ms: number | null;
  status: APIStatus;
  error_message: string | null;
  created_at: string;
}

export interface APIUsageInsert {
  api_provider?: APIProvider;
  api_endpoint: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  estimated_cost_usd?: number;
  brand_id?: string;
  campaign_id?: string;
  user_id?: string;
  request_duration_ms?: number;
  status?: APIStatus;
  error_message?: string;
}

export interface APIUsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost_usd: number;
  by_provider: { provider: string; requests: number; tokens: number; cost: number }[];
  by_endpoint: { endpoint: string; requests: number; tokens: number }[];
  by_day: { date: string; requests: number; tokens: number }[];
}
