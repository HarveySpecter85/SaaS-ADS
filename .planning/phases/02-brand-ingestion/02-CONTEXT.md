# Phase 2: Brand Ingestion - Context

**Gathered:** 2026-01-13
**Status:** Ready for planning

<vision>
## How This Should Work

Drop a brand guidelines PDF, and the system automatically extracts colors (hex codes), fonts, and tone of voice. Minimal manual input required - the user shouldn't need to configure or guide the extraction.

Each client/brand gets its own profile page showing what was extracted. The page is visual-first: big color swatches, font previews, tone examples. Not a form full of text fields - you should be able to see the brand at a glance.

</vision>

<essential>
## What Must Be Nailed

- **Easy editing** - Extraction doesn't need to be perfect. What matters is that when something is wrong or missing, correcting it is effortless. The edit experience is more important than extraction accuracy.

</essential>

<boundaries>
## What's Out of Scope

- Version history - not tracking changes to brand guidelines over time
- Brand comparison - no side-by-side views or conflict detection
- Non-PDF sources - no website scraping, Figma imports, or manual brand creation from scratch
- This phase is PDF-in, brand-profile-out

</boundaries>

<specifics>
## Specific Ideas

- Visual swatches for colors - big color blocks, not just hex codes in text
- Font previews showing actual typography
- Tone of voice displayed as examples or descriptors
- Profile page should feel like looking at the brand, not reading about it

</specifics>

<notes>
## Additional Context

This feeds into the Nano Banana asset factory (Phase 3+). The extracted brand data becomes the "few-shot context" that ensures generated assets stay on-brand. Getting brand data into the system is the prerequisite for everything else.

</notes>

---

*Phase: 02-brand-ingestion*
*Context gathered: 2026-01-13*
