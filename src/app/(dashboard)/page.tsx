import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome to AdOrchestrator
        </h1>
        <p className="mt-2 text-slate-600">
          Your autonomous ad orchestration platform for scaling creative production.
        </p>
      </div>

      {/* Module Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Nano Banana */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900">Nano Banana</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Asset Factory powered by Few-Shot Context. Generate 500+ creative variations
            per campaign while maintaining brand consistency.
          </p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>Brand guidelines ingestion</li>
            <li>Product image anchoring</li>
            <li>Persona-based prompt sets</li>
          </ul>
        </div>

        {/* Gemini Core */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900">Gemini Core</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Strategic Brain for real-time campaign optimization. Connect external data
            sources and enable conversational ad experiences.
          </p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>CRM & external data integration</li>
            <li>Conversational ads interface</li>
            <li>Smart bidding context</li>
          </ul>
        </div>

        {/* Tracking */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900">Tracking</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Privacy Shield for the cookieless future. Server-side tracking and
            first-party data pipeline for accurate attribution.
          </p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>Server-side CAPI implementation</li>
            <li>Enhanced Conversions</li>
            <li>First-party data pipeline</li>
          </ul>
        </div>

        {/* Campaigns */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900">Campaigns</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Dashboard for managing client campaigns, creative history, and
            API usage metrics across your agency.
          </p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>Multi-client management</li>
            <li>Creative asset history</li>
            <li>Performance metrics</li>
          </ul>
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-medium text-blue-900 mb-2">
          Getting Started
        </h2>
        <p className="text-sm text-blue-700">
          Begin by uploading brand guidelines in Nano Banana to establish your creative
          foundation. Once your brand assets are configured, you can start generating
          persona-based creative variations at scale.
        </p>
      </div>
    </div>
  );
}
