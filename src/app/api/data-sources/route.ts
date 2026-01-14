import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { DataSource, DataSourceType } from "@/lib/supabase/database.types";

// Valid data source types
const VALID_TYPES: DataSourceType[] = ['weather', 'calendar', 'custom'];

// GET: List all data sources (filter by type query param)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Build query
    let query = supabase
      .from("data_sources")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by type if provided
    if (type) {
      if (!VALID_TYPES.includes(type as DataSourceType)) {
        return NextResponse.json(
          { error: "Invalid type. Must be one of: weather, calendar, custom" },
          { status: 400 }
        );
      }
      query = query.eq("type", type);
    }

    const { data: dataSources, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch data sources", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(dataSources || []);
  } catch (error) {
    console.error("GET /api/data-sources error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new data source
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, type, config, is_active } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be one of: weather, calendar, custom" },
        { status: 400 }
      );
    }

    const { data: dataSource, error } = await supabase
      .from("data_sources")
      .insert({
        name,
        type,
        config: config || {},
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create data source", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(dataSource as DataSource, { status: 201 });
  } catch (error) {
    console.error("POST /api/data-sources error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
