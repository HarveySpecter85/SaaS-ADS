'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
}

interface CAPIConfig {
  id: string;
  brand_id: string;
  customer_id: string;
  conversion_action_id: string;
  is_active: boolean;
  batch_size: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_count: number;
}

interface ConversionEvent {
  id: string;
  event_name: string;
  event_value: number | null;
  currency: string;
  sync_status: string;
  event_time: string;
  transaction_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  queued: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  skipped: 'bg-gray-100 text-gray-800',
};

export default function ConversionsClient({
  brand,
  config: initialConfig,
  initialEvents,
}: {
  brand: Brand;
  config: CAPIConfig | null;
  initialEvents: ConversionEvent[];
}) {
  const router = useRouter();
  const [config, setConfig] = useState<CAPIConfig | null>(initialConfig);
  const [events] = useState<ConversionEvent[]>(initialEvents);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!initialConfig);

  // Config form state
  const [customerId, setCustomerId] = useState(config?.customer_id || '');
  const [conversionActionId, setConversionActionId] = useState(config?.conversion_action_id || '');
  const [isActive, setIsActive] = useState(config?.is_active ?? true);

  const saveConfig = useCallback(async () => {
    const endpoint = config
      ? `/api/capi-configs/${config.id}`
      : '/api/capi-configs';

    const method = config ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_id: brand.id,
        customer_id: customerId,
        conversion_action_id: conversionActionId,
        is_active: isActive,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setConfig(data);
      setIsEditing(false);
      router.refresh();
    }
  }, [brand.id, config, customerId, conversionActionId, isActive, router]);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch(`/api/conversions/sync?brand_id=${brand.id}`, {
        method: 'POST',
      });

      const data = await response.json();
      setSyncResult(data.message);
      router.refresh();
    } catch (error) {
      setSyncResult('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [brand.id, router]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/conversions"
          className="text-gray-400 hover:text-gray-600"
        >
          &larr; Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
          <p className="text-gray-500">Conversion tracking configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Google Ads CAPI</h2>
              {config && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    placeholder="123-456-7890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conversion Action ID
                  </label>
                  <input
                    type="text"
                    value={conversionActionId}
                    onChange={e => setConversionActionId(e.target.value)}
                    placeholder="123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Enable sync
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveConfig}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  {config && (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : config ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer ID</span>
                  <span className="font-mono">{config.customer_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conversion Action</span>
                  <span className="font-mono">{config.conversion_action_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {config.last_sync_at && (
                  <>
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last sync</span>
                        <span>{new Date(config.last_sync_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Events sent</span>
                        <span>{config.last_sync_count}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* Sync button */}
            {config && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={triggerSync}
                  disabled={isSyncing || !config.is_active}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                {syncResult && (
                  <p className="mt-2 text-sm text-center text-gray-600">{syncResult}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Events list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Events</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {events.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No conversion events yet
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{event.event_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[event.sync_status]}`}>
                          {event.sync_status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(event.event_time).toLocaleString()}
                        {event.transaction_id && ` \u2022 ${event.transaction_id}`}
                      </div>
                    </div>
                    {event.event_value !== null && (
                      <div className="text-right">
                        <span className="font-medium text-gray-900">
                          {event.currency} {event.event_value.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
