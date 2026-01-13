# Roadmap: AdOrchestrator

## Overview

Build an internal agency tool implementing the "Autonomous Ad Orchestration" architecture. Starting with foundation and brand ingestion, progressing through the Nano Banana asset factory (creative generation with few-shot context), then Gemini Core (strategic brain), and finally Gemini Nano integration (privacy-first tracking). The platform wraps everything in a multi-client dashboard for agency use.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Next.js + Supabase setup, auth, base layout
- [x] **Phase 2: Brand Ingestion** - PDF parsing for brand guidelines, hex/font/tone extraction
- [x] **Phase 3: Asset Anchoring** - Product image upload, geometry "lock" system
- [x] **Phase 4: Prompt Generation** - Persona-based prompt sets, 50+ variations per set
- [x] **Phase 5: Asset Gallery** - Generated asset management, filters, search, export
- [x] **Phase 6: External Data** - Weather integration, data sources, trigger rules
- [x] **Phase 7: Conversational Ads** - Embedded chat UI, FAQ automation
- [x] **Phase 8: Server-Side Tracking** - CAPI implementation, Enhanced Conversions
- [ ] **Phase 9: Campaign Dashboard** - Client campaigns, metrics, multi-client management
- [ ] **Phase 10: Polish & Integration** - Final integration, testing, deployment

## Phase Details

### Phase 1: Foundation
**Goal**: Project scaffolding with Next.js 14+ App Router, Supabase connection, team auth, and base layout
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established Next.js + Supabase patterns)
**Plans**: 3 plans

Plans:
- [x] 01-01: Project Setup (Next.js + Supabase + Tailwind)
- [x] 01-02: Team Auth (Supabase Auth + login + middleware)
- [x] 01-03: Layout Shell (Sidebar + dashboard home)

### Phase 2: Brand Ingestion
**Goal**: Upload and parse brand guidelines PDFs to extract hex codes, fonts, tone of voice
**Depends on**: Phase 1
**Research**: Completed (pdf-parse + Gemini approach)
**Plans**: 3 plans

Plans:
- [x] 02-01: Brand Data Foundation (database types + CRUD API)
- [x] 02-02: PDF Extraction (Gemini integration + upload endpoint)
- [x] 02-03: Brand UI (list page + profile page with visual swatches)

### Phase 3: Asset Anchoring
**Goal**: Upload "Source of Truth" product images and create geometry "anchors" to prevent hallucinations
**Depends on**: Phase 2
**Research**: Not needed (established patterns from Phase 2)
**Plans**: 2 plans

Plans:
- [x] 03-01: Asset Data Foundation (database types + CRUD API + image upload)
- [x] 03-02: Asset UI (product list + profile page with image gallery)

### Phase 4: Prompt Generation
**Goal**: Generate persona-based prompt sets and produce 50+ creative variations per prompt set
**Depends on**: Phase 3
**Research**: Not needed (used Gemini Flash, established patterns)
**Plans**: 2 plans

Plans:
- [x] 04-01: Prompt Data Foundation (database types + campaign CRUD API + generation endpoint)
- [x] 04-02: Prompt Generation UI (campaign list + profile with prompts + creation wizard)

### Phase 5: Asset Gallery
**Goal**: Gallery view for generated assets with filters, search, and campaign export packages
**Depends on**: Phase 4
**Research**: Not needed (established patterns)
**Plans**: 3 plans

Plans:
- [x] 05-01: Asset Gallery Foundation (asset data types + API routes)
- [x] 05-02: Gallery UI (grid layout + filtering + selection + lightbox)
- [x] 05-03: Export Workflow (platform bundles + ZIP generation)

### Phase 6: External Data
**Goal**: Connect to weather APIs and external data sources for contextual creative triggers
**Depends on**: Phase 1
**Research**: Completed (OpenWeatherMap API, data source architecture)
**Plans**: 3 plans

Plans:
- [x] 06-01: Data Sources Foundation (database types + CRUD API)
- [x] 06-02: Weather Integration (OpenWeatherMap API + sync endpoint + UI)
- [x] 06-03: Trigger Rules Engine (conditions + evaluation + campaign recommendations)

### Phase 7: Conversational Ads
**Goal**: Embedded chat UI for conversational ads, FAQ automation, inventory integration
**Depends on**: Phase 6
**Research**: Completed (Gemini chat integration)
**Research topics**: Gemini for conversational AI, chat embedding patterns, FAQ training
**Plans**: 3 plans

Plans:
- [x] 07-01: Chat UI Foundation (ChatMessage, ChatBubble, ChatWidget, /chat page)
- [x] 07-02: Gemini Chat Backend (streaming responses, brand awareness)
- [x] 07-03: Product Recommendations (criteria extraction, inline product cards)

### Phase 8: Server-Side Tracking
**Goal**: CAPI implementation, Enhanced Conversions setup, first-party data pipeline
**Depends on**: Phase 1
**Research**: Not needed (implemented Google Ads API v17 patterns)
**Plans**: 3 plans

Plans:
- [x] 08-01: Conversion Events Foundation (database + types + hashing + CRUD API)
- [x] 08-02: Google CAPI Integration (config schema + CAPI client + sync endpoint)
- [x] 08-03: Enhanced Conversions UI (config API + conversions list + brand detail)

### Phase 9: Campaign Dashboard
**Goal**: Dashboard showing campaigns per client, creative history, API usage metrics
**Depends on**: Phase 5, Phase 7, Phase 8
**Research**: Not needed (internal dashboard patterns)
**Plans**: 3 plans

Plans:
- [ ] 09-01: API Usage Tracking (database + types + tracking utilities + API)
- [ ] 09-02: Dashboard Metrics (metrics API + dashboard home page with live data)
- [ ] 09-03: Navigation & Settings (sidebar update + settings page)

### Phase 10: Polish & Integration
**Goal**: Final integration testing, performance optimization, production deployment
**Depends on**: Phase 9
**Research**: Unlikely (integration of existing work)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-13 |
| 2. Brand Ingestion | 3/3 | Complete | 2026-01-13 |
| 3. Asset Anchoring | 2/2 | Complete | 2026-01-13 |
| 4. Prompt Generation | 2/2 | Complete | 2026-01-13 |
| 5. Asset Gallery | 3/3 | Complete | 2026-01-13 |
| 6. External Data | 3/3 | Complete | 2026-01-13 |
| 7. Conversational Ads | 3/3 | Complete | 2026-01-13 |
| 8. Server-Side Tracking | 3/3 | Complete | 2026-01-13 |
| 9. Campaign Dashboard | 0/TBD | Not started | - |
| 10. Polish & Integration | 0/TBD | Not started | - |
