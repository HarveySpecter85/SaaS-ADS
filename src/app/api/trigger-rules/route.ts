import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type {
  TriggerRule,
  TriggerRuleWithSource,
  ConditionOperator,
  TriggerActionType,
} from "@/lib/supabase/database.types";

// Valid operators and action types
const VALID_OPERATORS: ConditionOperator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "not_contains",
];

const VALID_ACTION_TYPES: TriggerActionType[] = [
  "recommend_goal",
  "recommend_tag",
  "show_message",
];

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET: List all trigger rules (filter by data_source_id, is_active)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const dataSourceId = searchParams.get("data_source_id");
    const active = searchParams.get("active");

    // Build query with data source relation
    let query = supabase
      .from("trigger_rules")
      .select("*, data_source:data_sources(*)")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    // Filter by data source ID if provided
    if (dataSourceId) {
      if (!isValidUUID(dataSourceId)) {
        return NextResponse.json(
          { error: "Invalid data_source_id format" },
          { status: 400 }
        );
      }
      query = query.eq("data_source_id", dataSourceId);
    }

    // Filter by active status if provided
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    const { data: rules, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch trigger rules", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json((rules as TriggerRuleWithSource[]) || []);
  } catch (error) {
    console.error("GET /api/trigger-rules error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new trigger rule
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      name,
      data_source_id,
      condition_key,
      condition_operator,
      condition_value,
      action_type = "recommend_goal",
      action_value,
      is_active = true,
      priority = 0,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!data_source_id) {
      return NextResponse.json(
        { error: "data_source_id is required" },
        { status: 400 }
      );
    }

    if (!isValidUUID(data_source_id)) {
      return NextResponse.json(
        { error: "Invalid data_source_id format" },
        { status: 400 }
      );
    }

    if (!condition_key) {
      return NextResponse.json(
        { error: "condition_key is required" },
        { status: 400 }
      );
    }

    if (!condition_operator) {
      return NextResponse.json(
        { error: "condition_operator is required" },
        { status: 400 }
      );
    }

    if (!VALID_OPERATORS.includes(condition_operator)) {
      return NextResponse.json(
        {
          error: `Invalid condition_operator. Must be one of: ${VALID_OPERATORS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (condition_value === undefined || condition_value === null) {
      return NextResponse.json(
        { error: "condition_value is required" },
        { status: 400 }
      );
    }

    if (!action_value) {
      return NextResponse.json(
        { error: "action_value is required" },
        { status: 400 }
      );
    }

    if (!VALID_ACTION_TYPES.includes(action_type)) {
      return NextResponse.json(
        {
          error: `Invalid action_type. Must be one of: ${VALID_ACTION_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verify data source exists
    const { data: dataSource, error: dataSourceError } = await supabase
      .from("data_sources")
      .select("id")
      .eq("id", data_source_id)
      .single();

    if (dataSourceError || !dataSource) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 }
      );
    }

    // Create the trigger rule
    const { data: rule, error } = await supabase
      .from("trigger_rules")
      .insert({
        name,
        data_source_id,
        condition_key,
        condition_operator,
        condition_value: String(condition_value),
        action_type,
        action_value,
        is_active,
        priority,
      })
      .select("*, data_source:data_sources(*)")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create trigger rule", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(rule as TriggerRuleWithSource, { status: 201 });
  } catch (error) {
    console.error("POST /api/trigger-rules error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
