import { createClient } from "@/lib/supabase/server";
import { DataSourcesClient } from "./client";
import type { DataSource } from "@/lib/supabase/database.types";

export default async function DataSourcesPage() {
  const supabase = await createClient();

  // Fetch all data sources
  const { data: dataSources, error } = await supabase
    .from("data_sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching data sources:", error);
    return (
      <div className="text-red-600">
        Error loading data sources. Please try again.
      </div>
    );
  }

  return <DataSourcesClient dataSources={(dataSources as DataSource[]) || []} />;
}
