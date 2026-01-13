---
phase: 02-brand-ingestion
plan: 02
subsystem: pdf-extraction
tags: [gemini, pdf-parse, upload, api, extraction, ai]

# Dependency graph
requires:
  - phase: 02-01
    provides: Brand database schema, CRUD API endpoints, TypeScript types
provides:
  - Gemini client for structured brand data extraction
  - PDF upload endpoint with automatic extraction
  - PDF text parsing with pdf-parse v2
affects: [brand-ui, asset-generation]

# Tech tracking
tech-stack:
  added: [pdf-parse@2.4.5, @google/generative-ai@0.24.1]
  patterns: [Gemini structured extraction prompts, Form data file upload, Error-tolerant insertion]

key-files:
  created:
    - src/lib/gemini.ts
    - src/lib/pdf-extraction.ts
    - src/app/api/brands/upload/route.ts
  modified:
    - package.json
    - package-lock.json
    - .env.local.example

key-decisions:
  - "Use gemini-1.5-flash for speed and cost efficiency"
  - "Truncate PDF text to 15000 chars for Gemini prompt to avoid token limits"
  - "Best-effort extraction - continue even if some data is missing"
  - "Storage upload is non-blocking - brand created even if PDF storage fails"
  - "Use pdf-parse v2 API (PDFParse class) instead of deprecated default import"

patterns-established:
  - "Structured extraction with JSON-only response prompts"
  - "Regex JSON extraction to handle potential markdown wrapping"
  - "Parallel insertion of related records with error logging but not failing"

issues-created: []

# Metrics
duration: 6min
completed: 2026-01-13
---

# Phase 2 Plan 02: PDF Upload and Extraction Summary

**Implement PDF upload and automatic brand data extraction using Gemini.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-13
- **Completed:** 2026-01-13
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

### Task 1: Gemini Client and Dependencies

Installed required packages and created the Gemini client:

- **pdf-parse v2.4.5** - Modern PDF text extraction with PDFParse class API
- **@google/generative-ai v0.24.1** - Official Google AI SDK for Gemini
- **@types/pdf-parse** - TypeScript definitions

Created `src/lib/gemini.ts` with:
- `gemini` - Pre-configured Gemini 1.5 Flash model instance
- `ExtractedBrandData` - Interface matching database schema for colors, fonts, tone
- `extractBrandFromText()` - Prompts Gemini with PDF text, returns structured JSON

### Task 2: PDF Upload Endpoint

Created `POST /api/brands/upload` endpoint:

**Flow:**
1. Parse multipart form data, extract file
2. Validate file is PDF (content-type or extension)
3. Convert to Buffer, extract text via pdf-parse
4. Send text to Gemini for structured extraction
5. Upload original PDF to Supabase Storage (brands bucket)
6. Create brand record with source_pdf_url
7. Insert colors, fonts, tone records in parallel
8. Return complete brand with all relations

**Error Handling:**
- 400: No file uploaded
- 400: File is not PDF
- 500: PDF text extraction failed
- 500: Gemini extraction failed
- 500: Database insert failed

## Task Commits

Each task was committed atomically:

1. **Task 1** - `88c903c` - `feat(02-02): add Gemini client and brand extraction`
2. **Task 2** - `a9dd984` - `feat(02-02): create PDF upload endpoint`

**Plan metadata:** [committed with summary]

## Files Created

- `src/lib/gemini.ts` - Gemini client with extractBrandFromText function
- `src/lib/pdf-extraction.ts` - PDF text extraction using pdf-parse v2
- `src/app/api/brands/upload/route.ts` - Upload endpoint with full extraction flow

## Files Modified

- `package.json` - Added pdf-parse, @google/generative-ai dependencies
- `.env.local.example` - Added GOOGLE_AI_API_KEY environment variable

## Verification Results

- [x] `npm run build` succeeds
- [x] pdf-parse and @google/generative-ai installed
- [x] Gemini client exports extractBrandFromText function
- [x] Upload endpoint handles PDF -> text -> Gemini -> database flow
- [x] Error cases return appropriate status codes

## Deviations from Plan

1. **pdf-parse v2 API** - The plan specified v1 syntax (`import pdf from 'pdf-parse'`), but pdf-parse v2 requires named import (`import { PDFParse } from 'pdf-parse'`) with class-based API. Updated implementation accordingly.

## API Usage Example

### Upload PDF and extract brand

```bash
curl -X POST /api/brands/upload \
  -F "file=@brand-guidelines.pdf"
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "UrbanTrek",
  "description": "Premium adventure backpacks...",
  "source_pdf_url": "https://storage.supabase.co/brands/1234-brand-guidelines.pdf",
  "created_at": "2026-01-13T...",
  "updated_at": "2026-01-13T...",
  "colors": [
    {"hex_code": "#FF5733", "name": "Brand Orange", "is_primary": true, ...}
  ],
  "fonts": [
    {"font_family": "Montserrat", "font_weight": "Bold", "is_primary": true, ...}
  ],
  "tone": [
    {"descriptor": "Adventurous", "example": "Explore beyond boundaries...", ...}
  ]
}
```

## Next Steps

Ready for Plan 03: Brand Profile UI
- Visual brand profile page with color swatches
- Font previews and tone display
- Edit functionality for extracted data

---
*Phase: 02-brand-ingestion*
*Completed: 2026-01-13*
