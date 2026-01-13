---
phase: 08-server-side-tracking
plan: 02
subsystem: backend
tags: [capi, google-ads-api, batch-sync, enhanced-conversions, server-side-tracking]

# Dependency graph
requires:
  - 08-01: Conversion events table and types
provides:
  - CAPI configuration database table (supabase/migrations/009_capi_config.sql)
  - Google CAPI client library (src/lib/google-capi.ts)
  - Batch sync endpoint for conversion uploads (/api/conversions/sync)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [batch uploads, partial failure handling, Google Ads API v17]

key-files:
  created:
    - supabase/migrations/009_capi_config.sql
    - src/lib/google-capi.ts
    - src/app/api/conversions/sync/route.ts
  modified:
    - src/lib/supabase/database.types.ts

key-decisions:
  - "Per-brand CAPI configuration - each brand has own Google Ads credentials"
  - "Batch uploads with configurable batch_size - default 200 events per batch"
  - "Partial failure mode - continue processing if some events fail"
  - "Sync status tracking - events move through pending/queued/sent/failed states"
  - "OAuth token storage in database - placeholder for future refresh flow"

patterns-established:
  - "CAPI config per brand: Store Google Ads credentials per brand with unique constraint"
  - "Google datetime format: Convert ISO to 'yyyy-mm-dd hh:mm:ss+00:00' format"
  - "Enhanced Conversions: Include hashed user identifiers in upload"
  - "Sync status workflow: pending -> queued -> sent/failed"

issues-created: []

# Metrics
duration: 6min
completed: 2026-01-13
---

# Phase 8 Plan 02: Google CAPI Integration Summary

**Integrate with Google Ads Conversion API (CAPI) for server-side event tracking**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-13
- **Completed:** 2026-01-13
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 1

## Accomplishments

- CAPI configuration table for per-brand Google Ads credentials
- TypeScript types (CAPIConfig, CAPIConfigWithBrand)
- Google CAPI client library with batch upload support
- Enhanced Conversions user identifier formatting
- Sync endpoint for batch processing pending events
- Status endpoint showing sync overview per brand

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CAPI configuration schema** - `45c4244` (feat)
2. **Task 2: Create Google CAPI client library** - `8a13911` (feat)
3. **Task 3: Create sync endpoint for batch uploads** - `3f42891` (feat)

## Files Created

- `supabase/migrations/009_capi_config.sql` - Database migration for capi_configs table
- `src/lib/google-capi.ts` - Google Ads CAPI client with upload functions
- `src/app/api/conversions/sync/route.ts` - POST (sync) and GET (status) endpoints

## Files Modified

- `src/lib/supabase/database.types.ts` - Added CAPIConfig types and interfaces

## Technical Implementation

### CAPI Configuration Table
- Per-brand credentials (customer_id, conversion_action_id)
- OAuth tokens (access_token, refresh_token, token_expires_at)
- Configuration options (batch_size, sync_interval_minutes, is_active)
- Sync tracking (last_sync_at, last_sync_status, last_sync_count)
- RLS enabled with authenticated user policy
- Unique constraint on brand_id

### Google CAPI Client Library
- `uploadConversions()` - Batch upload to Google Ads API v17
- `buildConversionActionName()` - Resource name formatting
- `formatGoogleDateTime()` - ISO to Google datetime format
- `convertToGoogleFormat()` - Transform events with user identifiers
- `refreshAccessToken()` - Placeholder for OAuth refresh flow

### Sync Endpoint
- `POST /api/conversions/sync` - Process pending events per brand
- `GET /api/conversions/sync` - Get sync status overview
- Optional brand_id filter for single-brand sync
- Batch processing based on config batch_size
- Event status updates: pending -> queued -> sent/failed
- Summary with total processed/success/failure counts

## API Endpoints Added

### POST /api/conversions/sync
Syncs pending conversion events to Google Ads CAPI.

**Query params:**
- `brand_id` (optional) - Sync only specific brand

**Response:**
```json
{
  "message": "Sync complete: 150/200 events sent",
  "summary": {
    "total_processed": 200,
    "total_success": 150,
    "total_failure": 50
  },
  "results": [
    {
      "brand_id": "uuid",
      "brand_name": "Example Brand",
      "events_processed": 200,
      "success_count": 150,
      "failure_count": 50,
      "errors": ["..."]
    }
  ]
}
```

### GET /api/conversions/sync
Returns sync status for all brands.

**Response:**
```json
{
  "status": [
    {
      "brand_id": "uuid",
      "brand_name": "Example Brand",
      "is_active": true,
      "last_sync_at": "2026-01-13T10:00:00Z",
      "last_sync_status": "success",
      "last_sync_count": 150,
      "pending_events": 25
    }
  ]
}
```

## Deviations from Plan

None - plan executed exactly as specified.

## Issues Encountered

None.

## Verification Checklist

- [x] `npm run build` succeeds
- [x] CAPI configs table created via migration
- [x] Google CAPI client library exports correctly
- [x] POST /api/conversions/sync processes pending events
- [x] GET /api/conversions/sync shows status
- [x] Event status updates correctly (pending -> queued -> sent/failed)
- [x] No TypeScript or ESLint errors

## Next Steps

This integration enables:
- Scheduled sync via cron/webhook (every 15 minutes based on config)
- OAuth token refresh flow implementation
- UI for managing CAPI configurations per brand
- Sync analytics and error monitoring dashboard

---
*Phase: 08-server-side-tracking*
*Completed: 2026-01-13*
