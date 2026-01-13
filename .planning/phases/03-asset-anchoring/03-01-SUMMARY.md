---
phase: 03-asset-anchoring
plan: 01
subsystem: product-data
tags: [supabase, api, crud, products, images, storage, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: Supabase patterns, API route conventions, TypeScript types pattern
provides:
  - Product database schema and TypeScript types
  - CRUD API endpoints for product management
  - Image upload endpoint with Supabase Storage integration
  - Data foundation for Product UI (Plan 02)
affects: [product-ui, asset-generation, persona-prompts]

# Tech tracking
tech-stack:
  added: []
  patterns: [Supabase Storage uploads, multipart/form-data handling, hero image auto-promotion]

key-files:
  created:
    - supabase/migrations/002_products.sql
    - src/app/api/products/route.ts
    - src/app/api/products/[id]/route.ts
    - src/app/api/products/[id]/images/route.ts
  modified:
    - src/lib/supabase/database.types.ts
  deleted: []

key-decisions:
  - "Auto-hero promotion: first uploaded image becomes hero, or promoted when hero deleted"
  - "Storage path convention: products/{product_id}/{uuid}.{ext}"
  - "Filter products by brand_id query param for scoped views"

patterns-established:
  - "ProductWithImages composite type for joined queries"
  - "Image upload with Supabase Storage integration"
  - "Hero image management with auto-promotion on delete"

issues-created: []

# Metrics
duration: 10min
completed: 2026-01-13
---

# Phase 3 Plan 01: Asset Data Foundation Summary

**Database schema and API endpoints for product asset management**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-13
- **Completed:** 2026-01-13
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

### Database Schema
- Created SQL migration for 2 tables: products, product_images
- UUID primary keys with auto-generation
- Foreign key relationships with cascade delete (brand -> product -> images)
- Row Level Security enabled for all tables
- Policies allow all authenticated users (internal tool)
- Indexes on brand_id and product_id for faster lookups

### TypeScript Types
- Product interface with all fields
- ProductImage interface for image records
- ProductWithImages composite type for API responses

### API Endpoints

**Product CRUD:**
- `GET /api/products` - List all products with images (optional `?brand_id=` filter)
- `POST /api/products` - Create new product (requires name, brand_id)
- `GET /api/products/[id]` - Get single product with all images
- `PATCH /api/products/[id]` - Update product metadata (name, description, sku)
- `DELETE /api/products/[id]` - Delete product (cascades to images)

**Image Management:**
- `POST /api/products/[id]/images` - Upload image (multipart/form-data, auto-hero)
- `DELETE /api/products/[id]/images?image_id=` - Delete specific image (hero promotion)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database schema for products and images** - `f218d61`
   - SQL migration file with 2 tables, RLS policies, and indexes
   - TypeScript interfaces for Product, ProductImage, ProductWithImages

2. **Task 2: Create product CRUD API endpoints** - `3690e5c`
   - List and create endpoints in /api/products/route.ts
   - Get, update, delete endpoints in /api/products/[id]/route.ts

3. **Task 3: Create product image upload endpoint** - `6c25967`
   - Image upload with Supabase Storage in /api/products/[id]/images/route.ts
   - Image delete with hero auto-promotion

**Plan metadata:** [committed with summary]

## Files Created/Modified

- `supabase/migrations/002_products.sql` - SQL migration for product tables with RLS
- `src/lib/supabase/database.types.ts` - Added Product and ProductImage types
- `src/app/api/products/route.ts` - GET (list) and POST (create) endpoints
- `src/app/api/products/[id]/route.ts` - GET, PATCH, DELETE endpoints
- `src/app/api/products/[id]/images/route.ts` - POST (upload), DELETE (remove) endpoints

## Verification Results

- [x] `npm run build` succeeds
- [x] TypeScript types compile without errors
- [x] API route files have correct exports (GET, POST, PATCH, DELETE)
- [x] No ESLint errors

## Deviations from Plan

None. Plan was executed exactly as specified.

## API Usage Examples

### Create a product
```bash
curl -X POST /api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "UrbanTrek Explorer", "brand_id": "{brand-uuid}", "description": "Premium hiking backpack"}'
```

### Get products for a brand
```bash
curl /api/products?brand_id={brand-uuid}
```

### Upload product image
```bash
curl -X POST /api/products/{id}/images \
  -F "file=@product-photo.jpg" \
  -F "angle=front"
```

### Delete product image
```bash
curl -X DELETE /api/products/{id}/images?image_id={image-uuid}
```

## Storage Notes

- Images stored in `product-images` Supabase Storage bucket
- Path convention: `products/{product_id}/{uuid}.{ext}`
- First image auto-becomes hero
- When hero deleted, next image by sort_order promoted

## Next Steps

Ready for Plan 02: Product UI
- Product list page under /brands/[id]/products
- Product detail page with image grid
- Upload interface for product images
- Hero image designation UI

---
*Phase: 03-asset-anchoring*
*Completed: 2026-01-13*
