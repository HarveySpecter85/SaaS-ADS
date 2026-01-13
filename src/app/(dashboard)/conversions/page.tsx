import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { CAPIConfig } from '@/lib/supabase/database.types';

export default async function ConversionsPage() {
  const supabase = await createClient();

  // Get brands with CAPI configs
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .order('name');

  // Get CAPI configs
  const { data: configs } = await supabase
    .from('capi_configs')
    .select('*');

  // Get event counts by brand and status
  const { data: eventCounts } = await supabase
    .from('conversion_events')
    .select('brand_id, sync_status');

  // Aggregate counts
  const countsByBrand: Record<string, Record<string, number>> = {};
  for (const event of eventCounts || []) {
    if (!event.brand_id) continue;
    if (!countsByBrand[event.brand_id]) {
      countsByBrand[event.brand_id] = { total: 0, pending: 0, sent: 0, failed: 0 };
    }
    countsByBrand[event.brand_id].total++;
    countsByBrand[event.brand_id][event.sync_status] =
      (countsByBrand[event.brand_id][event.sync_status] || 0) + 1;
  }

  const configByBrand = (configs || []).reduce((acc, c) => {
    acc[c.brand_id] = c;
    return acc;
  }, {} as Record<string, CAPIConfig>);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Server-Side Tracking</h1>
          <p className="text-gray-500 mt-1">Manage conversion events and Google Ads CAPI integration</p>
        </div>
      </div>

      {/* Brands grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands?.map(brand => {
          const config = configByBrand[brand.id];
          const counts = countsByBrand[brand.id] || { total: 0, pending: 0, sent: 0, failed: 0 };

          return (
            <Link
              key={brand.id}
              href={`/conversions/${brand.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                {config ? (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Not configured
                  </span>
                )}
              </div>

              {/* Event counts */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total events</span>
                  <span className="font-medium">{counts.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pending</span>
                  <span className={`font-medium ${counts.pending > 0 ? 'text-yellow-600' : ''}`}>
                    {counts.pending}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sent</span>
                  <span className="font-medium text-green-600">{counts.sent}</span>
                </div>
                {counts.failed > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Failed</span>
                    <span className="font-medium text-red-600">{counts.failed}</span>
                  </div>
                )}
              </div>

              {/* Last sync */}
              {config?.last_sync_at && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  Last sync: {new Date(config.last_sync_at).toLocaleString()}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {(!brands || brands.length === 0) && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No brands found. Create a brand first to configure tracking.</p>
          <Link href="/brands/new" className="text-blue-600 hover:underline mt-2 inline-block">
            Add brand
          </Link>
        </div>
      )}
    </div>
  );
}
