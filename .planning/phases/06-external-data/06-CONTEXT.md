# Phase 6: External Data - Context

**Gathered:** 2026-01-13
**Status:** Ready for planning

<vision>
## How This Should Work

External data connections that enable contextual triggers for ad creative. When real-world conditions change — weather shifts, inventory levels drop, a holiday approaches — the system can surface relevant creative variations.

Think of it as making ads smarter by connecting them to the outside world. A hot day triggers cold drink ads. Low stock triggers urgency messaging. An upcoming event triggers timely creative.

The key is flexibility: different clients need different signals, so the system should handle multiple signal types (weather, stock/inventory, time-based events) without being locked to just one.

</vision>

<essential>
## What Must Be Nailed

- **Easy data connection** — Non-technical setup for connecting external data sources. Should feel like plugging in an integration, not writing code.

The system needs to make it simple for agency users to connect APIs and data sources without engineering involvement.

</essential>

<boundaries>
## What's Out of Scope

- **Automated bidding** — This phase connects data only. Don't automatically change bid strategies based on signals yet. That's a future enhancement.
- Keep it to data ingestion and display, not autonomous decision-making.

</boundaries>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for weather APIs, data connectors, and trigger logic.

</specifics>

<notes>
## Additional Context

This phase brings external context into the ad creative workflow. The vision is contextual triggers: real-world signals that influence which creative variations are relevant.

Signal types to support:
- Weather-based (temperature, conditions, forecasts)
- Stock/inventory (availability, price changes)
- Time-based (holidays, events, day-of-week patterns)

The emphasis is on ease of connection — making it non-technical for agency users to plug in data sources and define trigger rules.

</notes>

---

*Phase: 06-external-data*
*Context gathered: 2026-01-13*
