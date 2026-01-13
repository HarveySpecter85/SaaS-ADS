// Trigger evaluation engine

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConditionOperator,
  TriggerRule,
  TriggerEvaluation,
  DataSourceValue,
  Campaign,
} from "@/lib/supabase/database.types";

/**
 * Evaluate a condition against a value
 */
export function evaluateCondition(
  operator: ConditionOperator,
  currentValue: unknown,
  targetValue: string
): boolean {
  // Handle null/undefined
  if (currentValue === null || currentValue === undefined) {
    return false;
  }

  // Convert to string for comparison
  const currentStr = String(currentValue);

  // For numeric comparisons
  const currentNum = parseFloat(currentStr);
  const targetNum = parseFloat(targetValue);

  switch (operator) {
    case "eq":
      // String equality (case-insensitive)
      return currentStr.toLowerCase() === targetValue.toLowerCase();

    case "neq":
      return currentStr.toLowerCase() !== targetValue.toLowerCase();

    case "gt":
      if (isNaN(currentNum) || isNaN(targetNum)) return false;
      return currentNum > targetNum;

    case "gte":
      if (isNaN(currentNum) || isNaN(targetNum)) return false;
      return currentNum >= targetNum;

    case "lt":
      if (isNaN(currentNum) || isNaN(targetNum)) return false;
      return currentNum < targetNum;

    case "lte":
      if (isNaN(currentNum) || isNaN(targetNum)) return false;
      return currentNum <= targetNum;

    case "contains":
      return currentStr.toLowerCase().includes(targetValue.toLowerCase());

    case "not_contains":
      return !currentStr.toLowerCase().includes(targetValue.toLowerCase());

    default:
      return false;
  }
}

/**
 * Evaluate: is this rule triggered by current data source values?
 */
export function evaluateRule(
  rule: TriggerRule,
  values: DataSourceValue[]
): { triggered: boolean; currentValue: unknown } {
  // Find the value matching the condition key
  // For weather data, values are stored with key "current" containing all weather fields
  const currentDataValue = values.find((v) => v.key === "current")?.value as Record<string, unknown> | undefined;

  // Try to get the value from the "current" object first (weather data structure)
  let currentValue: unknown = undefined;

  if (currentDataValue && typeof currentDataValue === "object") {
    currentValue = currentDataValue[rule.condition_key];
  }

  // If not found in "current", look for a direct key match
  if (currentValue === undefined) {
    const directValue = values.find((v) => v.key === rule.condition_key);
    if (directValue) {
      currentValue = directValue.value;
    }
  }

  // If value not found, rule is not triggered
  if (currentValue === undefined) {
    return { triggered: false, currentValue: undefined };
  }

  const triggered = evaluateCondition(
    rule.condition_operator,
    currentValue,
    rule.condition_value
  );

  return { triggered, currentValue };
}

/**
 * Evaluate all active rules and return triggered ones
 */
export async function evaluateAllRules(
  supabase: SupabaseClient
): Promise<TriggerEvaluation[]> {
  // Fetch all active rules with their data sources
  const { data: rules, error: rulesError } = await supabase
    .from("trigger_rules")
    .select("*, data_source:data_sources(*)")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (rulesError || !rules) {
    console.error("Error fetching trigger rules:", rulesError);
    return [];
  }

  const evaluations: TriggerEvaluation[] = [];

  // Group rules by data source to minimize queries
  const rulesByDataSource = new Map<string, TriggerRule[]>();
  for (const rule of rules) {
    const dataSourceId = rule.data_source_id;
    if (!rulesByDataSource.has(dataSourceId)) {
      rulesByDataSource.set(dataSourceId, []);
    }
    rulesByDataSource.get(dataSourceId)!.push(rule);
  }

  // Fetch values for each data source and evaluate rules
  for (const [dataSourceId, dataSourceRules] of rulesByDataSource) {
    const { data: values } = await supabase
      .from("data_source_values")
      .select("*")
      .eq("data_source_id", dataSourceId);

    for (const rule of dataSourceRules) {
      const { triggered, currentValue } = evaluateRule(
        rule,
        (values as DataSourceValue[]) || []
      );

      evaluations.push({
        rule,
        triggered,
        current_value: currentValue,
      });
    }
  }

  return evaluations;
}

/**
 * Get recommended campaigns based on triggered rules
 */
export async function getRecommendedCampaigns(
  supabase: SupabaseClient,
  triggeredRules: TriggerRule[]
): Promise<Campaign[]> {
  if (triggeredRules.length === 0) {
    return [];
  }

  // Collect goal values to filter by
  const goalValues = triggeredRules
    .filter((rule) => rule.action_type === "recommend_goal")
    .map((rule) => rule.action_value);

  if (goalValues.length === 0) {
    return [];
  }

  // Fetch campaigns matching the recommended goals
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .in("goal", goalValues)
    .eq("status", "complete");

  if (error) {
    console.error("Error fetching recommended campaigns:", error);
    return [];
  }

  return (campaigns as Campaign[]) || [];
}

/**
 * Evaluate a single rule with its data source values
 * Returns full evaluation including recommended campaigns
 */
export async function evaluateSingleRule(
  supabase: SupabaseClient,
  rule: TriggerRule
): Promise<TriggerEvaluation> {
  // Fetch current values for the data source
  const { data: values } = await supabase
    .from("data_source_values")
    .select("*")
    .eq("data_source_id", rule.data_source_id);

  const { triggered, currentValue } = evaluateRule(
    rule,
    (values as DataSourceValue[]) || []
  );

  // Get recommended campaigns if triggered
  let recommendedCampaigns: Campaign[] = [];
  if (triggered && rule.action_type === "recommend_goal") {
    recommendedCampaigns = await getRecommendedCampaigns(supabase, [rule]);
  }

  return {
    rule,
    triggered,
    current_value: currentValue,
    recommended_campaigns: recommendedCampaigns,
  };
}
