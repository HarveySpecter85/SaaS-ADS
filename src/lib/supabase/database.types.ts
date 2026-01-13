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
