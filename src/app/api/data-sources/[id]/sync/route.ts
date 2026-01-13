import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchWeather } from "@/lib/weather";
import type {
  DataSource,
  WeatherConfig,
  CalendarConfig,
  CustomConfig,
} from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// POST: Sync data source (fetch fresh data from external API)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid data source ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch data source
    const { data: dataSource, error: dataSourceError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (dataSourceError || !dataSource) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 }
      );
    }

    const ds = dataSource as DataSource;

    // Handle sync based on type
    let syncedValues: Record<string, unknown> = {};

    switch (ds.type) {
      case "weather": {
        const config = ds.config as WeatherConfig;

        // Validate weather config
        if (!config.location) {
          return NextResponse.json(
            { error: "Weather data source requires a location" },
            { status: 400 }
          );
        }

        try {
          // Fetch weather data
          const weatherData = await fetchWeather(
            config.location,
            config.units || "metric",
            config.api_key
          );

          // Set expiry to 30 minutes from now
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 30);

          // Delete existing values for this data source
          await supabase
            .from("data_source_values")
            .delete()
            .eq("data_source_id", id);

          // Store values in data_source_values
          const valuesToInsert = [
            {
              data_source_id: id,
              key: "current",
              value: weatherData,
              expires_at: expiresAt.toISOString(),
            },
            {
              data_source_id: id,
              key: "temperature",
              value: {
                value: weatherData.temperature,
                unit: config.units === "imperial" ? "F" : "C",
              },
              expires_at: expiresAt.toISOString(),
            },
            {
              data_source_id: id,
              key: "conditions",
              value: {
                main: weatherData.conditions,
                description: weatherData.description,
              },
              expires_at: expiresAt.toISOString(),
            },
          ];

          const { error: insertError } = await supabase
            .from("data_source_values")
            .insert(valuesToInsert);

          if (insertError) {
            console.error("Error inserting values:", insertError);
            return NextResponse.json(
              { error: "Failed to store weather data", details: insertError.message },
              { status: 500 }
            );
          }

          syncedValues = {
            current: weatherData,
            temperature: valuesToInsert[1].value,
            conditions: valuesToInsert[2].value,
          };
        } catch (weatherError) {
          console.error("Weather API error:", weatherError);
          return NextResponse.json(
            {
              error: "Failed to fetch weather data",
              details: weatherError instanceof Error ? weatherError.message : "Unknown error",
            },
            { status: 400 }
          );
        }
        break;
      }

      case "calendar": {
        // Calendar events are stored in config, no external fetch needed
        const config = ds.config as CalendarConfig;
        syncedValues = {
          events: config.events || [],
        };
        break;
      }

      case "custom": {
        // Custom data is stored in config, no external fetch needed
        const config = ds.config as CustomConfig;
        syncedValues = {
          data: config.data || {},
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown data source type: ${ds.type}` },
          { status: 400 }
        );
    }

    // Update last_sync_at
    const { error: updateError } = await supabase
      .from("data_sources")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating last_sync_at:", updateError);
    }

    // Return synced values
    return NextResponse.json({
      id,
      type: ds.type,
      synced_at: new Date().toISOString(),
      values: syncedValues,
    });
  } catch (error) {
    console.error("POST /api/data-sources/[id]/sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
