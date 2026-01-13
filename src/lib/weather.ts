// OpenWeatherMap API integration

export interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  conditions: string;
  description: string;
  icon: string;
  wind_speed: number;
  location: string;
  fetched_at: string;
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  name: string;
}

// Parse OpenWeatherMap response to our format
function parseWeatherResponse(data: OpenWeatherResponse, location: string): WeatherData {
  return {
    temperature: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    conditions: data.weather[0]?.main || "Unknown",
    description: data.weather[0]?.description || "Unknown conditions",
    icon: data.weather[0]?.icon || "01d",
    wind_speed: Math.round(data.wind.speed * 10) / 10,
    location: data.name || location,
    fetched_at: new Date().toISOString(),
  };
}

// Fetch current weather from OpenWeatherMap
export async function fetchWeather(
  location: string,
  units: "metric" | "imperial" = "metric",
  apiKey?: string
): Promise<WeatherData> {
  // Use provided API key or fall back to environment variable
  const key = apiKey || process.env.OPENWEATHER_API_KEY;

  if (!key) {
    throw new Error("OpenWeatherMap API key is required. Set OPENWEATHER_API_KEY environment variable or provide api_key in config.");
  }

  // Build API URL
  const params = new URLSearchParams({
    q: location,
    units: units,
    appid: key,
  });

  const url = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error codes
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenWeatherMap API key.");
      }
      if (response.status === 404) {
        throw new Error(`Location not found: "${location}". Please check the city name.`);
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      throw new Error(
        (errorData as { message?: string }).message ||
        `Failed to fetch weather data (status ${response.status})`
      );
    }

    const data: OpenWeatherResponse = await response.json();
    return parseWeatherResponse(data, location);
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch weather data. Please check your network connection.");
  }
}

// Get weather icon URL from OpenWeatherMap
export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
