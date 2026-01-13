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
- [ ] **Phase 3: Asset Anchoring** - Product image upload, geometry "lock" system
- [ ] **Phase 4: Prompt Generation** - Persona-based prompt sets, 50+ variations per set
- [ ] **Phase 5: Asset Gallery** - Generated asset management, filters, search, export
- [ ] **Phase 6: External Data** - CRM, weather, stock data connections
- [ ] **Phase 7: Conversational Ads** - Embedded chat UI, FAQ automation
- [ ] **Phase 8: Server-Side Tracking** - CAPI implementation, Enhanced Conversions
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
**Research**: Likely (Imagen 3 API, few-shot approach)
**Research topics**: Imagen 3 API for image generation, product anchoring techniques, Google AI Studio integration
**Plans**: TBD

### Phase 4: Prompt Generation
**Goal**: Generate persona-based prompt sets and produce 50+ creative variations per prompt set
**Depends on**: Phase 3
**Research**: Likely (Gemini Pro prompting)
**Research topics**: Gemini Pro for persona generation, batch prompt execution, variation strategies
**Plans**: TBD

### Phase 5: Asset Gallery
**Goal**: Gallery view for generated assets with filters, search, and campaign export packages
**Depends on**: Phase 4
**Research**: Unlikely (internal UI with established patterns)
**Plans**: TBD

### Phase 6: External Data
**Goal**: Connect to CRM, weather APIs, and stock data for real-time bidding context
**Depends on**: Phase 1
**Research**: Likely (external API integrations)
**Research topics**: CRM APIs (HubSpot, Salesforce), weather APIs, stock data sources
**Plans**: TBD

### Phase 7: Conversational Ads
**Goal**: Embedded chat UI for conversational ads, FAQ automation, inventory integration
**Depends on**: Phase 6
**Research**: Likely (Gemini chat integration)
**Research topics**: Gemini for conversational AI, chat embedding patterns, FAQ training
**Plans**: TBD

### Phase 8: Server-Side Tracking
**Goal**: CAPI implementation, Enhanced Conversions setup, first-party data pipeline
**Depends on**: Phase 1
**Research**: Likely (Google privacy APIs)
**Research topics**: Google CAPI, Enhanced Conversions, Privacy Sandbox, Protected Audience API
**Plans**: TBD

### Phase 9: Campaign Dashboard
**Goal**: Dashboard showing campaigns per client, creative history, API usage metrics
**Depends on**: Phase 5, Phase 7, Phase 8
**Research**: Unlikely (internal dashboard patterns)
**Plans**: TBD

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
| 3. Asset Anchoring | 0/TBD | Not started | - |
| 4. Prompt Generation | 0/TBD | Not started | - |
| 5. Asset Gallery | 0/TBD | Not started | - |
| 6. External Data | 0/TBD | Not started | - |
| 7. Conversational Ads | 0/TBD | Not started | - |
| 8. Server-Side Tracking | 0/TBD | Not started | - |
| 9. Campaign Dashboard | 0/TBD | Not started | - |
| 10. Polish & Integration | 0/TBD | Not started | - |
