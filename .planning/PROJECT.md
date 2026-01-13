# AdOrchestrator: Autonomous Ad System

## What This Is

Sistema interno de agencia basado en la arquitectura "Autonomous Ad Orchestration" de Harvey Rodelo. Tres componentes integrados: **Nano Banana** (fábrica de creativos), **Gemini Core** (cerebro estratégico), y **Gemini Nano integration** (tracking server-side para privacy-first targeting).

Herramienta para la agencia — no es un SaaS público.

## Core Value

**Generar 500+ variaciones de creativos por campaña con Few-Shot Context** — eliminar "ad fatigue", mantener CPA bajo, y escalar producción de assets sin shoots tradicionales.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Nano Banana (Asset Factory)
- [ ] Ingestión de Brand Guidelines (PDF parsing: hex codes, fonts, tone)
- [ ] Upload de "Source of Truth" images (5-10 fotos del producto)
- [ ] Sistema de "anchor" para geometría de producto (no hallucinations)
- [ ] Generación de Prompt Sets por persona (ej: Corporate, Traveler, Student)
- [ ] Output de 50+ variaciones por prompt set
- [ ] Galería de assets generados con filtros y búsqueda
- [ ] Exportar paquetes de creativos por campaña

#### Gemini Core (Strategic Brain)
- [ ] Conexión con datos externos (CRM, weather, stock)
- [ ] Bidding logic que ajusta en tiempo real
- [ ] UI de Conversational Ads (chat embebido)
- [ ] Respuestas automáticas a preguntas frecuentes
- [ ] Integración con inventario del cliente

#### Gemini Nano Integration (Privacy Shield)
- [ ] Server-Side Tracking implementation (CAPI)
- [ ] Enhanced Conversions setup
- [ ] First-party data pipeline
- [ ] Research: Privacy Sandbox / Protected Audience API

#### Platform
- [ ] Dashboard de campañas por cliente
- [ ] Gestión de múltiples clientes (interno, no multi-tenant SaaS)
- [ ] Historial de creativos generados
- [ ] Métricas de uso de APIs

### Out of Scope

- SaaS público con billing — esto es herramienta interna de agencia
- Integración directa con Google Ads API para publicar — solo generar y exportar
- Mobile app — solo web dashboard
- Real-time bidding propio — usamos Smart Bidding de Google, solo lo informamos

## Context

**Problema que resuelve:**
- PMax y Demand Gen son "asset hungry" — necesitan cientos de variaciones
- Shoots tradicionales dan 20 fotos cada 3 meses → Ad Fatigue → CPA sube
- Cookies muriendo → targeting ciego sin server-side tracking
- Landing pages estáticas → usuarios con preguntas no convierten

**Cómo funciona el Few-Shot Context:**
1. **Ingest**: Upload Brand Guidelines + 5-10 product images
2. **Anchor**: IA "lock" en geometría específica del producto
3. **Generate**: Crear variaciones en diferentes contextos/personas
4. **No hallucinations**: El producto real aparece en nuevos ambientes

**Ejemplo real (del artículo):**
- UrbanTrek Bags (₹4,500 backpack)
- 3 personas: Corporate (Cyber Hub), Traveler (Rishikesh), Student (Delhi University)
- 50 variaciones por persona = 150 assets únicos
- Algoritmo testea qué persona convierte mejor

## Constraints

- **Tech stack**: Next.js 14+ (App Router) + Supabase
- **AI APIs**: Google AI Studio (Gemini Flash, Gemini Pro, Imagen 3)
- **Hosting**: Vercel
- **Uso**: Interno de agencia (no necesita auth complejo, solo usuarios del equipo)
- **Clientes**: Marcas D2C en India/LATAM (contexto del artículo)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google AI ecosystem | Consistente con visión del artículo, mejor para Google Ads | — Pending |
| Internal tool vs SaaS | Simplifica, no necesita billing/multi-tenant | — Pending |
| Few-Shot Context approach | Evita hallucinations, mantiene brand consistency | — Pending |
| Server-Side first | Prepararse para cookieless future | — Pending |

---
*Last updated: 2026-01-13 after initialization*
*Based on: "The New Google Ads Architecture" by Harvey Rodelo*
