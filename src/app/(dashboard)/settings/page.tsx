import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get counts for overview
  const [
    { count: brandCount },
    { count: campaignCount },
    { count: dataSourceCount },
    { count: capiConfigCount },
  ] = await Promise.all([
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('data_sources').select('*', { count: 'exact', head: true }),
    supabase.from('capi_configs').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">Manage your AdOrchestrator configuration.</p>
      </div>

      {/* Account Section */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-medium text-slate-900">Account</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Email</label>
            <p className="mt-1 text-slate-900">{user?.email || 'Not logged in'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">User ID</label>
            <p className="mt-1 text-sm text-slate-500 font-mono">{user?.id || '—'}</p>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-medium text-slate-900">Platform Overview</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-slate-50">
              <p className="text-2xl font-semibold text-slate-900">{brandCount || 0}</p>
              <p className="text-sm text-slate-600">Brands</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-50">
              <p className="text-2xl font-semibold text-slate-900">{campaignCount || 0}</p>
              <p className="text-sm text-slate-600">Campaigns</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-50">
              <p className="text-2xl font-semibold text-slate-900">{dataSourceCount || 0}</p>
              <p className="text-sm text-slate-600">Data Sources</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-50">
              <p className="text-2xl font-semibold text-slate-900">{capiConfigCount || 0}</p>
              <p className="text-sm text-slate-600">CAPI Configs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-medium text-slate-900">Quick Links</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/brands/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Add Brand</p>
                <p className="text-sm text-slate-500">Upload brand guidelines</p>
              </div>
            </Link>

            <Link
              href="/campaigns/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">New Campaign</p>
                <p className="text-sm text-slate-500">Generate creative variations</p>
              </div>
            </Link>

            <Link
              href="/data-sources/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Add Data Source</p>
                <p className="text-sm text-slate-500">Connect external data</p>
              </div>
            </Link>

            <Link
              href="/conversions"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Manage Conversions</p>
                <p className="text-sm text-slate-500">View CAPI sync status</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Environment Info */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-medium text-slate-900">Environment</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Platform</span>
            <span className="text-sm font-medium text-slate-900">AdOrchestrator</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Framework</span>
            <span className="text-sm font-medium text-slate-900">Next.js 16</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Database</span>
            <span className="text-sm font-medium text-slate-900">Supabase</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">AI Provider</span>
            <span className="text-sm font-medium text-slate-900">Google AI (Gemini)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
