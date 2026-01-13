import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  TriggerRule,
  TriggerRuleWithSource,
  ConditionOperator,
  TriggerActionType,
} from "@/lib/supabase/database.types";
import { evaluateSingleRule } from "@/lib/trigger-engine";

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

// GET: Get single rule with evaluation status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid trigger rule ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the rule with data source
    const { data: rule, error: ruleError } = await supabase
      .from("trigger_rules")
      .select("*, data_source:data_sources(*)")
      .eq("id", id)
      .single();

    if (ruleError || !rule) {
      return NextResponse.json(
        { error: "Trigger rule not found" },
        { status: 404 }
      );
    }

    // Evaluate the rule to get current status
    const evaluation = await evaluateSingleRule(supabase, rule as TriggerRule);

    return NextResponse.json({
      ...rule,
      evaluation: {
        triggered: evaluation.triggered,
        current_value: evaluation.current_value,
        recommended_campaigns: evaluation.recommended_campaigns,
      },
    });
  } catch (error) {
    console.error("GET /api/trigger-rules/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid trigger rule ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Check if rule exists
    const { data: existingRule, error: checkError } = await supabase
      .from("trigger_rules")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingRule) {
      return NextResponse.json(
        { error: "Trigger rule not found" },
        { status: 404 }
      );
    }

    // Build update object from allowed fields
    const {
      name,
      condition_key,
      condition_operator,
      condition_value,
      action_type,
      action_value,
      is_active,
      priority,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (condition_key !== undefined) updateData.condition_key = condition_key;

    if (condition_operator !== undefined) {
      if (!VALID_OPERATORS.includes(condition_operator)) {
        return NextResponse.json(
          {
            error: `Invalid condition_operator. Must be one of: ${VALID_OPERATORS.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.condition_operator = condition_operator;
    }

    if (condition_value !== undefined) {
      updateData.condition_value = String(condition_value);
    }

    if (action_type !== undefined) {
      if (!VALID_ACTION_TYPES.includes(action_type)) {
        return NextResponse.json(
          {
            error: `Invalid action_type. Must be one of: ${VALID_ACTION_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.action_type = action_type;
    }

    if (action_value !== undefined) updateData.action_value = action_value;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (priority !== undefined) updateData.priority = priority;

    const { error: updateError } = await supabase
      .from("trigger_rules")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update trigger rule", details: updateError.message },
        { status: 500 }
      );
    }

    // Fetch and return updated rule with data source
    const { data: updatedRule } = await supabase
      .from("trigger_rules")
      .select("*, data_source:data_sources(*)")
      .eq("id", id)
      .single();

    return NextResponse.json(updatedRule as TriggerRuleWithSource);
  } catch (error) {
    console.error("PATCH /api/trigger-rules/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid trigger rule ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if rule exists
    const { data: existingRule, error: checkError } = await supabase
      .from("trigger_rules")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingRule) {
      return NextResponse.json(
        { error: "Trigger rule not found" },
        { status: 404 }
      );
    }

    // Delete the rule
    const { error: deleteError } = await supabase
      .from("trigger_rules")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete trigger rule", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error) {
    console.error("DELETE /api/trigger-rules/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
