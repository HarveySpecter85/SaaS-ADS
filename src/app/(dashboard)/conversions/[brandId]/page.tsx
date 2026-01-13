import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ConversionsClient from './client';

export default async function BrandConversionsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const supabase = await createClient();

  // Get brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, name')
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    notFound();
  }

  // Get CAPI config for brand
  const { data: config } = await supabase
    .from('capi_configs')
    .select('*')
    .eq('brand_id', brandId)
    .single();

  // Get recent events
  const { data: events } = await supabase
    .from('conversion_events')
    .select('*')
    .eq('brand_id', brandId)
    .order('event_time', { ascending: false })
    .limit(50);

  return (
    <ConversionsClient
      brand={brand}
      config={config}
      initialEvents={events || []}
    />
  );
}
