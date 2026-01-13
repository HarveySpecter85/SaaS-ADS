---
phase: 08-server-side-tracking
plan: 01
subsystem: backend
tags: [conversions, enhanced-conversions, capi, hashing, server-side-tracking]

# Dependency graph
requires: []
provides:
  - Conversion events database table (supabase/migrations/008_conversion_events.sql)
  - TypeScript types for conversion events (src/lib/supabase/database.types.ts)
  - SHA256 hashing utilities for Enhanced Conversions (src/lib/conversions.ts)
  - CRUD API endpoints for conversions (/api/conversions)
affects: []

# Tech tracking
tech-stack:
  added: [crypto (Node.js builtin)]
  patterns: [SHA256 hashing, E.164 phone normalization, event deduplication]

key-files:
  created:
    - supabase/migrations/008_conversion_events.sql
    - src/lib/conversions.ts
    - src/app/api/conversions/route.ts
    - src/app/api/conversions/[id]/route.ts
  modified:
    - src/lib/supabase/database.types.ts

key-decisions:
  - "SHA256 hashing for Enhanced Conversions compliance - user PII is hashed before storage"
  - "E.164 phone normalization - phones converted to +country format before hashing"
  - "Event deduplication via unique event_id - prevents duplicate events in CAPI"
  - "Sync status tracking - events tracked through pending/queued/sent/failed/skipped states"
  - "Partial index for campaign_id and brand_id - efficient filtering for common queries"

patterns-established:
  - "User data hashing: Always hash PII with SHA256 lowercase before storage"
  - "Phone normalization: Convert to E.164 format (+1XXXXXXXXXX) before hashing"
  - "Event ID generation: prefix_timestamp36_random6 format for uniqueness"
  - "CAPI sync status: Track event lifecycle for batch sending to Google"

issues-created: []

# Metrics
duration: 5min
completed: 2026-01-13
---

# Phase 8 Plan 01: Conversion Events Foundation Summary

**Create the conversion events database and API foundation for server-side tracking**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-13
- **Completed:** 2026-01-13
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- Conversion events database table with full schema for CAPI integration
- TypeScript types (ConversionEvent, ConversionEventInsert, ConversionEventName, ConversionSyncStatus)
- SHA256 hashing utilities for Enhanced Conversions compliance
- E.164 phone normalization for international phone support
- Event ID generation for deduplication
- Full CRUD API at /api/conversions with filtering support

## Task Commits

Each task was committed atomically:

1. **Task 1: Create conversion events database schema** - `6b9cc06` (feat)
2. **Task 2: Create conversion helpers and hashing utilities** - `6363f85` (feat)
3. **Task 3: Create conversion events API** - `d7216af` (feat)

## Files Created

- `supabase/migrations/008_conversion_events.sql` - Database migration for conversion_events table
- `src/lib/conversions.ts` - Hashing utilities and event preparation functions
- `src/app/api/conversions/route.ts` - GET (list) and POST (create) endpoints
- `src/app/api/conversions/[id]/route.ts` - GET (single), DELETE, and PATCH (sync status) endpoints

## Files Modified

- `src/lib/supabase/database.types.ts` - Added ConversionEvent types and interfaces

## Technical Implementation

### Conversion Events Table
- Full user data storage with hashed PII fields (email, phone, first/last name)
- Event data (value, currency, transaction_id) for purchase tracking
- Custom parameters (JSONB) for flexible event data
- Sync status tracking for CAPI integration
- RLS enabled with authenticated user policy
- Optimized indexes for common query patterns

### Hashing Utilities
- `hashUserData()` - SHA256 hash of lowercase trimmed string
- `normalizePhone()` - E.164 format conversion before hashing
- `prepareConversionEvent()` - Transform raw input to hashed database format
- `generateEventId()` - Unique event ID for deduplication

### API Endpoints
- `GET /api/conversions` - List events with filters (status, event_name, campaign_id) and pagination
- `POST /api/conversions` - Create event with automatic user data hashing
- `GET /api/conversions/[id]` - Get single event
- `DELETE /api/conversions/[id]` - Delete event
- `PATCH /api/conversions/[id]` - Update sync status fields only

## Deviations from Plan

None - plan executed exactly as specified.

## Issues Encountered

None.

## Verification Checklist

- [x] `npm run build` succeeds
- [x] Conversion events table created via migration
- [x] TypeScript types compile without errors
- [x] POST /api/conversions creates event with hashed user data
- [x] GET /api/conversions lists events with filters
- [x] Hashing utilities work correctly
- [x] No TypeScript or ESLint errors

## Next Steps

This foundation enables:
- Phase 08-02: CAPI sender service for batch event transmission to Google
- Phase 08-03: Enhanced Conversions integration with Google Ads API
- Phase 08-04: Event tracking UI and analytics dashboard

---
*Phase: 08-server-side-tracking*
*Completed: 2026-01-13*
