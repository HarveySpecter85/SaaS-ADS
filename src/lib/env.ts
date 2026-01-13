// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Optional but recommended
const optionalEnvVars = [
  'GOOGLE_AI_API_KEY',
  'OPENWEATHERMAP_API_KEY',
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Type-safe env access
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
  openWeatherMapApiKey: process.env.OPENWEATHERMAP_API_KEY,
} as const;
