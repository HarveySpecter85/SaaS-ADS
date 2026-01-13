---
phase: 06-external-data
plan: 03
status: completed
started: 2026-01-13
completed: 2026-01-13
---

# Plan 06-03: Trigger Rules Engine - Summary

## Objective
Create the trigger rules engine that links data source signals to campaigns.

## Tasks Completed

### Task 1: Create trigger rules database schema
**Status:** Completed

**Files created/modified:**
- `supabase/migrations/006_trigger_rules.sql`
- `src/lib/supabase/database.types.ts`

**Implementation:**
- `trigger_rules` table with condition and action columns
- Condition fields: `condition_key`, `condition_operator`, `condition_value`
- Supported operators: eq, neq, gt, gte, lt, lte, contains, not_contains
- Action fields: `action_type`, `action_value`
- Action types: recommend_goal, recommend_tag (future), show_message (future)
- Metadata: is_active, priority, timestamps
- RLS enabled with authenticated users policy
- Indexes on data_source_id and is_active
- TypeScript types: `ConditionOperator`, `TriggerActionType`, `TriggerRule`, `TriggerRuleWithSource`, `TriggerEvaluation`

**Commit:** `feat(06-03): create trigger rules database schema`

---

### Task 2: Create trigger rules API and evaluation engine
**Status:** Completed

**Files created:**
- `src/lib/trigger-engine.ts`
- `src/app/api/trigger-rules/route.ts`
- `src/app/api/trigger-rules/[id]/route.ts`

**Implementation:**

**Trigger Engine (trigger-engine.ts):**
- `evaluateCondition(operator, currentValue, targetValue)` - Evaluate single condition
  - String equality (case-insensitive for eq/neq)
  - Numeric comparisons (gt/gte/lt/lte)
  - Substring matching (contains/not_contains)
- `evaluateRule(rule, values)` - Check if rule is triggered by data source values
  - Handles weather data structure (nested in "current" key)
  - Returns triggered boolean and current value
- `evaluateAllRules(supabase)` - Evaluate all active rules
  - Groups rules by data source to minimize queries
  - Returns array of TriggerEvaluation
- `getRecommendedCampaigns(supabase, triggeredRules)` - Fetch matching campaigns
  - Filters by goal matching action_value
  - Only returns completed campaigns
- `evaluateSingleRule(supabase, rule)` - Full evaluation with recommended campaigns

**Trigger Rules API:**
- `GET /api/trigger-rules` - List rules with filters
  - ?data_source_id=uuid - Filter by data source
  - ?active=true/false - Filter by active status
  - Includes data_source relation
- `POST /api/trigger-rules` - Create new rule
  - Validates required fields and operator/action type enums
  - Verifies data source exists
- `GET /api/trigger-rules/[id]` - Get rule with real-time evaluation
  - Includes triggered status, current value, recommended campaigns
- `PATCH /api/trigger-rules/[id]` - Update rule
  - Supports all condition, action, and metadata fields
- `DELETE /api/trigger-rules/[id]` - Delete rule

**Commit:** `feat(06-03): create trigger rules API and evaluation engine`

---

### Task 3: Add trigger rules UI to data source detail
**Status:** Completed

**Files modified:**
- `src/app/(dashboard)/data-sources/[id]/client.tsx`

**Implementation:**

**Trigger Rules Section:**
- Section header with "Add Rule" button
- Green banner showing count of triggered rules
- Rule form with:
  - Rule name input
  - Condition builder: key dropdown, operator dropdown, value input
  - Action builder: goal dropdown (Awareness/Lead Gen/Conversion)
  - Save and Cancel buttons
- Rule cards displaying:
  - Name with triggered/not triggered/inactive badges
  - Condition text: "When [key] [operator] [value] (current: X)"
  - Action text: "Recommend [Goal] campaigns"
  - Recommended campaigns preview (up to 3 with "+N more")
- Rule actions: toggle active, edit, delete
- Loading and empty states

**Visual Design:**
- Triggered rules have green border and background
- Current value shown inline with condition
- Recommended campaigns shown in a bordered preview area
- Responsive form with inline condition builder

**Commit:** `feat(06-03): add trigger rules UI to data source detail`

---

## Verification Checklist
- [x] `npm run build` succeeds
- [x] Trigger rules can be created via API
- [x] Evaluation engine correctly evaluates conditions
- [x] Rules UI shows on data source detail page
- [x] Triggered rules display recommended campaigns
- [x] No TypeScript or ESLint errors
- [x] Phase 6 complete

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/006_trigger_rules.sql` | Created | Trigger rules database migration |
| `src/lib/supabase/database.types.ts` | Modified | Added trigger rule TypeScript types |
| `src/lib/trigger-engine.ts` | Created | Condition evaluation engine |
| `src/app/api/trigger-rules/route.ts` | Created | GET/POST endpoints for rules |
| `src/app/api/trigger-rules/[id]/route.ts` | Created | GET/PATCH/DELETE endpoints |
| `src/app/(dashboard)/data-sources/[id]/client.tsx` | Modified | Added trigger rules UI section |

## Example Usage

**Weather trigger rules:**
- "Hot Weather" - When temperature > 25 -> Recommend conversion campaigns
- "Rainy Day" - When conditions contains "Rain" -> Recommend awareness campaigns
- "Cold Snap" - When temperature < 5 -> Recommend lead_gen campaigns

## Notes
- Rules evaluate against current data source values from `data_source_values` table
- Weather data is nested in the "current" key, engine handles this structure
- Only completed campaigns are recommended
- Rules are evaluated in priority order (higher priority first)
- Real-time evaluation happens on rule GET and after data source sync
- Phase 6 (External Data) is now complete

## Phase 6 Complete

This plan completes Phase 6: External Data, which included:
1. **Plan 06-01:** Data sources schema and CRUD API
2. **Plan 06-02:** Weather integration with OpenWeatherMap
3. **Plan 06-03:** Trigger rules engine linking data to campaigns

Users can now:
- Create weather, calendar, and custom data sources
- Sync weather data from OpenWeatherMap API
- Define trigger rules with conditions (e.g., temperature > 25)
- Get campaign recommendations based on triggered rules
- See real-time evaluation of rules on the data source detail page
