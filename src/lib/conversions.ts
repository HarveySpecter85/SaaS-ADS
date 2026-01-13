import { createHash } from 'crypto';
import { ConversionEventInsert } from '@/lib/supabase/database.types';

// Hash user data for Enhanced Conversions (SHA256, lowercase)
export function hashUserData(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return createHash('sha256').update(normalized).digest('hex');
}

// Normalize phone to E.164 format before hashing
export function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Assume US if no country code and 10 digits
  if (digits.length === 10) {
    return '+1' + digits;
  }
  // Add + if missing
  return digits.startsWith('+') ? digits : '+' + digits;
}

// Prepare event data for database insertion
export function prepareConversionEvent(input: ConversionEventInsert): {
  event_name: string;
  event_id: string | null;
  user_email_hash: string | null;
  user_phone_hash: string | null;
  user_first_name_hash: string | null;
  user_last_name_hash: string | null;
  user_ip: string | null;
  user_agent: string | null;
  event_value: number | null;
  currency: string;
  transaction_id: string | null;
  custom_params: Record<string, unknown>;
  source: string | null;
  campaign_id: string | null;
  brand_id: string | null;
  event_time: string;
} {
  return {
    event_name: input.event_name,
    event_id: input.event_id || null,
    user_email_hash: hashUserData(input.user_email),
    user_phone_hash: input.user_phone ? hashUserData(normalizePhone(input.user_phone)) : null,
    user_first_name_hash: hashUserData(input.user_first_name),
    user_last_name_hash: hashUserData(input.user_last_name),
    user_ip: input.user_ip || null,
    user_agent: input.user_agent || null,
    event_value: input.event_value ?? null,
    currency: input.currency || 'USD',
    transaction_id: input.transaction_id || null,
    custom_params: input.custom_params || {},
    source: input.source || null,
    campaign_id: input.campaign_id || null,
    brand_id: input.brand_id || null,
    event_time: input.event_time || new Date().toISOString(),
  };
}

// Generate unique event ID for deduplication
export function generateEventId(prefix: string = 'evt'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}
