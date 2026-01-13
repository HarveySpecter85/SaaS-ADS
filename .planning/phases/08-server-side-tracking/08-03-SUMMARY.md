---
phase: 08-server-side-tracking
plan: 03
subsystem: frontend
tags: [capi-ui, conversions-ui, server-side-tracking, brand-config, sync-controls]

# Dependency graph
requires:
  - 08-02: CAPI config table and sync endpoint
provides:
  - CAPI config API endpoints (/api/capi-configs)
  - Conversions list page (/conversions)
  - Brand conversion detail page (/conversions/[brandId])
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [Server Component data fetch, Client Component interactivity, card-based layouts]

key-files:
  created:
    - src/app/api/capi-configs/route.ts
    - src/app/api/capi-configs/[id]/route.ts
    - src/app/(dashboard)/conversions/page.tsx
    - src/app/(dashboard)/conversions/[brandId]/page.tsx
    - src/app/(dashboard)/conversions/[brandId]/client.tsx
  modified: []

key-decisions:
  - "CAPI config CRUD via REST API - standard pattern matching other API routes"
  - "Config form inline editing - simpler than modal for credential management"
  - "Brand cards show event counts - aggregate pending/sent/failed per brand"
  - "Sync button triggers POST /api/conversions/sync - manual sync capability"
  - "Status badges use color coding - yellow pending, green sent, red failed"

patterns-established:
  - "Config per brand: One CAPI config per brand with edit/create form"
  - "Server/Client split: Server Component fetches data, Client Component handles form state"
  - "Event list with status: Show recent events with sync status badges"
  - "Manual sync trigger: Button calls sync endpoint with brand filter"

issues-created: []

# Metrics
duration: 8min
completed: 2026-01-13
---

# Phase 8 Plan 03: Enhanced Conversions UI Summary

**Create the UI for managing conversion events and CAPI configuration**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-13
- **Completed:** 2026-01-13
- **Tasks:** 3
- **Files created:** 5
- **Files modified:** 0

## Accomplishments

- CAPI config API endpoints with full CRUD operations
- Conversions list page showing brands with event counts
- Brand conversion detail page with config form
- Sync button to manually trigger conversion uploads
- Status badges for event sync state visualization

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CAPI config API endpoints** - `88608f4` (feat)
2. **Task 2: Create conversions list page** - `ef74a9c` (feat)
3. **Task 3: Create brand conversion detail page with config** - `2a13410` (feat)

## Files Created

- `src/app/api/capi-configs/route.ts` - GET (list) and POST (create) endpoints
- `src/app/api/capi-configs/[id]/route.ts` - GET, PATCH, DELETE endpoints
- `src/app/(dashboard)/conversions/page.tsx` - Brand cards with event counts
- `src/app/(dashboard)/conversions/[brandId]/page.tsx` - Server component for brand detail
- `src/app/(dashboard)/conversions/[brandId]/client.tsx` - Client component with form and events list

## Technical Implementation

### CAPI Config API

**GET /api/capi-configs**
- Lists all CAPI configs with brand names
- Ordered by created_at descending

**POST /api/capi-configs**
- Creates new config for brand
- Validates required fields (brand_id, customer_id, conversion_action_id)
- Returns 409 if config already exists for brand
- Removes dashes from customer_id automatically

**GET /api/capi-configs/[id]**
- Get single config by ID with brand relation

**PATCH /api/capi-configs/[id]**
- Update config fields (customer_id, conversion_action_id, is_active, etc.)
- Sets updated_at timestamp

**DELETE /api/capi-configs/[id]**
- Remove config, returns 204

### Conversions List Page (/conversions)

- Grid of brand cards (responsive 1/2/3 columns)
- Each card shows:
  - Brand name
  - Config status badge (Active/Inactive/Not configured)
  - Event counts (total, pending, sent, failed)
  - Last sync timestamp
- Links to brand detail page
- Empty state with link to create brand

### Brand Conversion Detail Page (/conversions/[brandId])

**Server Component (page.tsx)**
- Fetches brand, config, and recent events
- Returns 404 if brand not found

**Client Component (client.tsx)**
- Config form with edit toggle
- Fields: Customer ID, Conversion Action ID, Enable sync checkbox
- Save button (POST for new, PATCH for existing)
- Sync Now button triggers `/api/conversions/sync?brand_id=...`
- Events list with status badges
- Event value display with currency

## UI Features

### Config Form
- Inline editing pattern (same as brand-editor)
- Edit button reveals form fields
- Save/Cancel buttons for form submission
- Disabled sync button when config inactive

### Events List
- Shows 50 most recent events
- Status badges with color coding:
  - pending: yellow
  - queued: blue
  - sent: green
  - failed: red
  - skipped: gray
- Event value and currency display
- Transaction ID when available

### Sync Controls
- "Sync Now" button in config card
- Loading state during sync
- Result message after completion
- Disabled when config is inactive

## Deviations from Plan

None - plan executed exactly as specified.

## Issues Encountered

- TypeScript error with `configs[0]` type - fixed by importing CAPIConfig type explicitly

## Verification Checklist

- [x] `npm run build` succeeds
- [x] CAPI config API endpoints work
- [x] /conversions page shows brands with event counts
- [x] /conversions/[brandId] shows config form
- [x] Config can be created and updated
- [x] Sync button triggers /api/conversions/sync
- [x] Events list displays with status badges
- [x] No TypeScript or ESLint errors
- [x] Phase 8 complete

## Phase 8 Complete

This completes Phase 8 (Server-Side Tracking):

- **08-01**: Conversion events table and tracking endpoint
- **08-02**: Google CAPI integration and sync endpoint
- **08-03**: UI for managing configs and viewing events

Users can now:
1. Track conversion events via POST /api/conversions
2. Configure Google Ads CAPI credentials per brand
3. View conversion events and their sync status
4. Manually trigger sync to Google Ads
5. Monitor sync history and event counts

---
*Phase: 08-server-side-tracking*
*Completed: 2026-01-13*
