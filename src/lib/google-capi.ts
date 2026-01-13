import { ConversionEvent, CAPIConfig } from '@/lib/supabase/database.types';

// Google Ads API endpoint
const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com';

// Conversion upload request format
interface ConversionUpload {
  conversionAction: string;
  conversionDateTime: string;
  conversionValue?: number;
  currencyCode?: string;
  orderId?: string;
  userIdentifiers?: UserIdentifier[];
}

interface UserIdentifier {
  hashedEmail?: string;
  hashedPhoneNumber?: string;
  addressInfo?: {
    hashedFirstName?: string;
    hashedLastName?: string;
  };
}

// Sync result
export interface CAPISyncResult {
  success: boolean;
  totalEvents: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

// Build conversion action resource name
function buildConversionActionName(customerId: string, conversionActionId: string): string {
  return `customers/${customerId}/conversionActions/${conversionActionId}`;
}

// Format datetime for Google Ads (yyyy-mm-dd hh:mm:ss+|-hh:mm)
function formatGoogleDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  // Format: 2024-01-15 14:30:00+00:00
  return date.toISOString().replace('T', ' ').replace('Z', '+00:00').slice(0, -5) + '+00:00';
}

// Convert our events to Google Ads format
function convertToGoogleFormat(
  event: ConversionEvent,
  conversionActionName: string
): ConversionUpload {
  const upload: ConversionUpload = {
    conversionAction: conversionActionName,
    conversionDateTime: formatGoogleDateTime(event.event_time),
  };

  // Add value if present
  if (event.event_value !== null) {
    upload.conversionValue = event.event_value;
    upload.currencyCode = event.currency;
  }

  // Add order ID if present
  if (event.transaction_id) {
    upload.orderId = event.transaction_id;
  }

  // Add user identifiers for Enhanced Conversions
  const userIdentifiers: UserIdentifier[] = [];

  if (event.user_email_hash) {
    userIdentifiers.push({ hashedEmail: event.user_email_hash });
  }

  if (event.user_phone_hash) {
    userIdentifiers.push({ hashedPhoneNumber: event.user_phone_hash });
  }

  if (event.user_first_name_hash || event.user_last_name_hash) {
    userIdentifiers.push({
      addressInfo: {
        hashedFirstName: event.user_first_name_hash || undefined,
        hashedLastName: event.user_last_name_hash || undefined,
      },
    });
  }

  if (userIdentifiers.length > 0) {
    upload.userIdentifiers = userIdentifiers;
  }

  return upload;
}

// Upload conversions to Google Ads
export async function uploadConversions(
  config: CAPIConfig,
  events: ConversionEvent[]
): Promise<CAPISyncResult> {
  const result: CAPISyncResult = {
    success: false,
    totalEvents: events.length,
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  if (events.length === 0) {
    result.success = true;
    return result;
  }

  if (!config.access_token) {
    result.errors.push('No access token configured');
    result.failureCount = events.length;
    return result;
  }

  const conversionActionName = buildConversionActionName(
    config.customer_id,
    config.conversion_action_id
  );

  // Convert events to Google format
  const conversions = events.map(event =>
    convertToGoogleFormat(event, conversionActionName)
  );

  // Build request
  const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/customers/${config.customer_id}:uploadClickConversions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        'login-customer-id': config.customer_id,
      },
      body: JSON.stringify({
        conversions,
        partialFailure: true, // Continue even if some fail
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      result.errors.push(`API error: ${response.status} - ${errorText}`);
      result.failureCount = events.length;
      return result;
    }

    const data = await response.json();

    // Parse partial failure errors
    if (data.partialFailureError) {
      const failures = data.partialFailureError.details || [];
      result.failureCount = failures.length;
      result.successCount = events.length - failures.length;
      result.errors = failures.map((f: { message: string }) => f.message);
    } else {
      result.successCount = events.length;
    }

    result.success = result.successCount > 0;
    return result;
  } catch (error) {
    result.errors.push(`Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
    result.failureCount = events.length;
    return result;
  }
}

// Placeholder for OAuth token refresh (implement when needed)
export async function refreshAccessToken(config: CAPIConfig): Promise<string | null> {
  // TODO: Implement OAuth refresh flow
  // For now, return existing token
  return config.access_token;
}
