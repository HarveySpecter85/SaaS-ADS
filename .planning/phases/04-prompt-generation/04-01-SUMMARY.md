# Plan 04-01 Summary: Prompt Data Foundation

**Completed:** 2026-01-13
**Duration:** ~15 minutes
**Status:** Complete

## What Was Built

### Database Schema (Migration 003_prompts.sql)

Created two new tables for the prompt generation system:

1. **campaigns** - Goal-based campaign templates
   - Links to products via `product_id`
   - Goals: `awareness`, `lead_gen`, `conversion`
   - Status tracking: `draft`, `generating`, `complete`
   - RLS enabled for authenticated users

2. **prompts** - Generated prompt variations
   - Links to campaigns via `campaign_id`
   - Stores: `prompt_text`, `headline`, `description`, `cta`, `variation_type`
   - `is_preview` flag distinguishes sample prompts from full batch
   - Cascade delete when campaign is removed

### TypeScript Types

Added to `src/lib/supabase/database.types.ts`:
- `CampaignGoal` and `CampaignStatus` type aliases
- `Campaign`, `Prompt`, and `CampaignWithPrompts` interfaces

### API Endpoints

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/campaigns` | GET, POST | List campaigns (with prompt counts), create new campaign |
| `/api/campaigns/[id]` | GET, PATCH, DELETE | Get campaign with prompts, update, delete |
| `/api/campaigns/[id]/prompts` | POST, DELETE | Generate prompts via Gemini, clear for regeneration |

### Prompt Generation Features

- **Preview mode** (default): Generates 3 sample prompts for quick validation
- **Full mode**: Generates 50+ variations for production use
- **Goal-based instructions**: Different prompt strategies for awareness, lead gen, and conversion
- **Brand context integration**: Uses colors, fonts, and tone from brand guidelines
- **Product anchoring**: References hero image URL in generation prompts
- **Status lifecycle**: Campaign status updates through `draft` -> `generating` -> `complete`

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/003_prompts.sql` | New - campaign and prompt tables |
| `src/lib/supabase/database.types.ts` | Extended with campaign/prompt types |
| `src/app/api/campaigns/route.ts` | New - list and create campaigns |
| `src/app/api/campaigns/[id]/route.ts` | New - CRUD operations |
| `src/app/api/campaigns/[id]/prompts/route.ts` | New - generation endpoint |

## Verification

- `npm run build` - Passes
- `npm run lint` - No new errors (pre-existing warnings only)
- TypeScript compilation - No errors
- All API routes properly exported with correct HTTP methods

## Commits

1. `feat(04-01): add campaign database types and migration`
2. `feat(04-01): create campaign CRUD API endpoints`
3. `feat(04-01): create prompt generation endpoint`

## Ready For

- **Plan 04-02**: Campaign creation UI with goal selection
- **Plan 04-03**: Prompt preview and generation UI
- **Future**: Image generation using these prompts with Imagen 3

## Notes

- Migration SQL is documented but must be manually applied to Supabase
- Gemini Flash integration reuses existing `src/lib/gemini.ts` setup
- API follows established patterns from products endpoints
- Goal-specific prompt instructions designed to produce genuinely different creative directions
