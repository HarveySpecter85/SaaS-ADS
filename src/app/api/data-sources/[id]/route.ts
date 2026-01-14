import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { DataSourceWithValues, DataSourceValue } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET: Get single data source with cached values
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

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

    // Fetch related values
    const { data: values } = await supabase
      .from("data_source_values")
      .select("*")
      .eq("data_source_id", id)
      .order("created_at", { ascending: true });

    const dataSourceWithValues: DataSourceWithValues = {
      ...dataSource,
      values: (values as DataSourceValue[]) || [],
    };

    return NextResponse.json(dataSourceWithValues);
  } catch (error) {
    console.error("GET /api/data-sources/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update data source config
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid data source ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Check if data source exists
    const { data: existingDataSource, error: checkError } = await supabase
      .from("data_sources")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingDataSource) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 }
      );
    }

    // Build update object from allowed fields
    const { name, config, is_active } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (config !== undefined) updateData.config = config;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { error: updateError } = await supabase
      .from("data_sources")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update data source", details: updateError.message },
        { status: 500 }
      );
    }

    // Fetch and return updated data source with values
    const { data: updatedDataSource } = await supabase
      .from("data_sources")
      .select("*")
      .eq("id", id)
      .single();

    const { data: values } = await supabase
      .from("data_source_values")
      .select("*")
      .eq("data_source_id", id)
      .order("created_at", { ascending: true });

    const dataSourceWithValues: DataSourceWithValues = {
      ...updatedDataSource,
      values: (values as DataSourceValue[]) || [],
    };

    return NextResponse.json(dataSourceWithValues);
  } catch (error) {
    console.error("PATCH /api/data-sources/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete data source (cascades to values)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid data source ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if data source exists
    const { data: existingDataSource, error: checkError } = await supabase
      .from("data_sources")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingDataSource) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 }
      );
    }

    // Delete data source (cascade will handle values)
    const { error: deleteError } = await supabase
      .from("data_sources")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete data source", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error) {
    console.error("DELETE /api/data-sources/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
