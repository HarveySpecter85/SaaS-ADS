"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DataSourceWithValues,
  DataSourceType,
  WeatherConfig,
  CalendarConfig,
  CustomConfig,
} from "@/lib/supabase/database.types";
import { getWeatherIconUrl } from "@/lib/weather";

interface DataSourceDetailClientProps {
  dataSource: DataSourceWithValues;
}

// Type badge colors
const typeColors: Record<DataSourceType, { bg: string; text: string; label: string }> = {
  weather: { bg: "bg-blue-100", text: "text-blue-700", label: "Weather" },
  calendar: { bg: "bg-purple-100", text: "text-purple-700", label: "Calendar" },
  custom: { bg: "bg-amber-100", text: "text-amber-700", label: "Custom" },
};

// Format relative time
function formatLastSync(dateString: string | null): string {
  if (!dateString) return "Never synced";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

export function DataSourceDetailClient({ dataSource }: DataSourceDetailClientProps) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(dataSource.name);
  const [isActive, setIsActive] = useState(dataSource.is_active);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const type = typeColors[dataSource.type];

  // Get current weather data from values
  const currentWeather = dataSource.values.find((v) => v.key === "current")?.value as {
    temperature: number;
    feels_like: number;
    humidity: number;
    conditions: string;
    description: string;
    icon: string;
    wind_speed: number;
    location: string;
    fetched_at: string;
  } | undefined;

  // Save name
  const saveName = async () => {
    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to save name");
      }

      setEditingName(false);
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  // Toggle active status
  const toggleActive = async () => {
    const newStatus = !isActive;
    setIsActive(newStatus);

    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
        setIsActive(!newStatus);
      }

      router.refresh();
    } catch (error) {
      console.error("Toggle error:", error);
      setIsActive(!newStatus);
    }
  };

  // Sync data source
  const syncNow = async () => {
    setSyncing(true);

    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync");
      }

      router.refresh();
    } catch (error) {
      console.error("Sync error:", error);
      alert(error instanceof Error ? error.message : "Failed to sync. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  // Delete data source
  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/data-sources/${dataSource.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      router.push("/data-sources");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            {/* Data Source Name (Editable) */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-semibold text-slate-900 border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={saveName}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setName(dataSource.name);
                  }}
                  className="px-3 py-1 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1
                className="text-2xl font-semibold text-slate-900 cursor-pointer hover:text-blue-600"
                onClick={() => setEditingName(true)}
              >
                {dataSource.name}
              </h1>
            )}

            {/* Type and Status Badges */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${type.bg} ${type.text}`}>
                {type.label}
              </span>
              <button
                onClick={toggleActive}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-slate-400"}`} />
                {isActive ? "Active" : "Inactive"}
              </button>
            </div>

            {/* Last Sync */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Last synced: {formatLastSync(dataSource.last_sync_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {dataSource.type === "weather" && (
              <button
                onClick={syncNow}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Sync Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weather Data Display */}
      {dataSource.type === "weather" && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {currentWeather ? (
            <div className="space-y-6">
              {/* Main Weather Display */}
              <div className="flex items-center gap-6">
                {/* Weather Icon */}
                <div className="flex-shrink-0">
                  <img
                    src={getWeatherIconUrl(currentWeather.icon)}
                    alt={currentWeather.conditions}
                    className="w-24 h-24"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      {currentWeather.temperature}
                    </span>
                    <span className="text-2xl text-slate-400">
                      {(dataSource.config as WeatherConfig).units === "imperial" ? "F" : "C"}
                    </span>
                  </div>
                  <p className="text-lg text-slate-600 capitalize">
                    {currentWeather.description}
                  </p>
                  <p className="text-sm text-slate-500">
                    {currentWeather.location}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Feels Like</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {currentWeather.feels_like}{(dataSource.config as WeatherConfig).units === "imperial" ? "F" : "C"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Humidity</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {currentWeather.humidity}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Wind Speed</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {currentWeather.wind_speed} {(dataSource.config as WeatherConfig).units === "imperial" ? "mph" : "m/s"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No weather data</h3>
              <p className="mt-2 text-sm text-slate-600">
                Click &quot;Sync Now&quot; to fetch current weather conditions.
              </p>
              <button
                onClick={syncNow}
                disabled={syncing}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Calendar Events Display */}
      {dataSource.type === "calendar" && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Events</h2>

          {(dataSource.config as CalendarConfig).events?.length > 0 ? (
            <div className="space-y-3">
              {(dataSource.config as CalendarConfig).events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event, index) => {
                  const eventDate = new Date(event.date);
                  const today = new Date();
                  const isUpcoming = eventDate >= today;
                  const isPast = eventDate < today;

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isUpcoming ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          event.type === "holiday" ? "bg-red-100" :
                          event.type === "sale" ? "bg-green-100" :
                          "bg-blue-100"
                        }`}>
                          {event.type === "holiday" && (
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
                            </svg>
                          )}
                          {event.type === "sale" && (
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                            </svg>
                          )}
                          {event.type === "event" && (
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{event.name}</h3>
                          <p className="text-sm text-slate-500">
                            {eventDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        event.type === "holiday" ? "bg-red-100 text-red-700" :
                        event.type === "sale" ? "bg-green-100 text-green-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {event.type}
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No events configured</h3>
              <p className="mt-2 text-sm text-slate-600">
                Edit this data source to add events.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom Data Display */}
      {dataSource.type === "custom" && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Custom Data</h2>

          {Object.keys((dataSource.config as CustomConfig).data || {}).length > 0 ? (
            <div className="space-y-2">
              {Object.entries((dataSource.config as CustomConfig).data || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between p-3 rounded-lg bg-slate-50"
                >
                  <span className="font-mono text-sm text-slate-600">{key}</span>
                  <span className="font-mono text-sm text-slate-900 max-w-md truncate">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No data configured</h3>
              <p className="mt-2 text-sm text-slate-600">
                Edit this data source to add custom key-value pairs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Configuration Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Configuration</h2>

        {dataSource.type === "weather" && (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Location</span>
              <span className="text-sm font-medium text-slate-900">{(dataSource.config as WeatherConfig).location}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Units</span>
              <span className="text-sm font-medium text-slate-900">
                {(dataSource.config as WeatherConfig).units === "imperial" ? "Fahrenheit" : "Celsius"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-500">API Key</span>
              <span className="text-sm font-medium text-slate-900">
                {(dataSource.config as WeatherConfig).api_key ? "Custom" : "Default"}
              </span>
            </div>
          </div>
        )}

        {dataSource.type === "calendar" && (
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-500">Total Events</span>
              <span className="text-sm font-medium text-slate-900">
                {(dataSource.config as CalendarConfig).events?.length || 0}
              </span>
            </div>
          </div>
        )}

        {dataSource.type === "custom" && (
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-500">Total Fields</span>
              <span className="text-sm font-medium text-slate-900">
                {Object.keys((dataSource.config as CustomConfig).data || {}).length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-700 mb-4">
          Deleting this data source will remove all associated values and cannot be undone.
        </p>

        {showDeleteConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-700">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-100"
          >
            Delete Data Source
          </button>
        )}
      </div>
    </div>
  );
}
