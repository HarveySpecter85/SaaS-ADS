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
