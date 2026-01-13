"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DataSourceType, WeatherConfig, CalendarConfig, CustomConfig } from "@/lib/supabase/database.types";

// Type options with descriptions
const typeOptions: Array<{
  value: DataSourceType;
  label: string;
  description: string;
  icon: ReactNode;
  color: { bg: string; border: string; text: string };
}> = [
  {
    value: "weather",
    label: "Weather",
    description: "Current conditions and forecasts for location-based triggers",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    color: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  },
  {
    value: "calendar",
    label: "Calendar",
    description: "Holidays, events, and promotional dates for seasonal triggers",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" },
  },
  {
    value: "custom",
    label: "Custom",
    description: "Define your own key-value data for custom triggers",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    color: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  },
];

// Calendar event type options
const eventTypes = [
  { value: "holiday", label: "Holiday" },
  { value: "event", label: "Event" },
  { value: "sale", label: "Sale" },
] as const;

interface CalendarEvent {
  name: string;
  date: string;
  type: "holiday" | "event" | "sale";
}

interface CustomField {
  key: string;
  value: string;
}

export default function NewDataSourcePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [selectedType, setSelectedType] = useState<DataSourceType | null>(null);
  const [name, setName] = useState("");

  // Weather config
  const [weatherLocation, setWeatherLocation] = useState("");
  const [weatherUnits, setWeatherUnits] = useState<"metric" | "imperial">("metric");
  const [weatherApiKey, setWeatherApiKey] = useState("");

  // Calendar config
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState<"holiday" | "event" | "sale">("event");

  // Custom config
  const [customFields, setCustomFields] = useState<CustomField[]>([{ key: "", value: "" }]);

  // Select type and move to step 2
  const selectType = (type: DataSourceType) => {
    setSelectedType(type);
    // Set default name based on type
    if (!name) {
      switch (type) {
        case "weather":
          setName("Weather Data");
          break;
        case "calendar":
          setName("Event Calendar");
          break;
        case "custom":
          setName("Custom Data");
          break;
      }
    }
    setStep(2);
  };

  // Test weather connection
  const testWeatherConnection = async () => {
    if (!weatherLocation) {
      setTestResult({ success: false, message: "Please enter a location" });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      // Create a temporary data source to test
      const response = await fetch("/api/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Connection",
          type: "weather",
          config: {
            location: weatherLocation,
            units: weatherUnits,
            api_key: weatherApiKey || undefined,
          },
          is_active: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create test data source");
      }

      const dataSource = await response.json();

      // Try to sync it
      const syncResponse = await fetch(`/api/data-sources/${dataSource.id}/sync`, {
        method: "POST",
      });

      // Clean up test data source
      await fetch(`/api/data-sources/${dataSource.id}`, {
        method: "DELETE",
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        const temp = syncData.values?.current?.temperature;
        const conditions = syncData.values?.current?.conditions;
        setTestResult({
          success: true,
          message: `Connection successful! Current: ${temp} degrees, ${conditions}`,
        });
      } else {
        const errorData = await syncResponse.json();
        setTestResult({
          success: false,
          message: errorData.details || errorData.error || "Failed to fetch weather data",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Add calendar event
  const addCalendarEvent = () => {
    if (!newEventName || !newEventDate) return;

    setCalendarEvents([
      ...calendarEvents,
      { name: newEventName, date: newEventDate, type: newEventType },
    ]);
    setNewEventName("");
    setNewEventDate("");
    setNewEventType("event");
  };

  // Remove calendar event
  const removeCalendarEvent = (index: number) => {
    setCalendarEvents(calendarEvents.filter((_, i) => i !== index));
  };

  // Add custom field
  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  // Update custom field
  const updateCustomField = (index: number, field: "key" | "value", value: string) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  // Remove custom field
  const removeCustomField = (index: number) => {
    if (customFields.length <= 1) return;
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Build config based on type
  const buildConfig = (): WeatherConfig | CalendarConfig | CustomConfig => {
    switch (selectedType) {
      case "weather":
        return {
          location: weatherLocation,
          units: weatherUnits,
          api_key: weatherApiKey || undefined,
        };
      case "calendar":
        return {
          events: calendarEvents,
        };
      case "custom":
        const data: Record<string, unknown> = {};
        customFields.forEach((field) => {
          if (field.key.trim()) {
            // Try to parse as JSON, otherwise store as string
            try {
              data[field.key] = JSON.parse(field.value);
            } catch {
              data[field.key] = field.value;
            }
          }
        });
        return { data };
      default:
        return {} as CustomConfig;
    }
  };

  // Validate step 2 before proceeding
  const canProceedToReview = (): boolean => {
    if (!name.trim()) return false;

    switch (selectedType) {
      case "weather":
        return !!weatherLocation.trim();
      case "calendar":
        return true; // Can have empty calendar
      case "custom":
        return customFields.some((f) => f.key.trim());
      default:
        return false;
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedType || !name.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: selectedType,
          config: buildConfig(),
          is_active: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create data source");
      }

      const dataSource = await response.json();

      // If weather, trigger initial sync
      if (selectedType === "weather") {
        await fetch(`/api/data-sources/${dataSource.id}/sync`, {
          method: "POST",
        });
      }

      router.push(`/data-sources/${dataSource.id}`);
    } catch (error) {
      console.error("Create error:", error);
      alert("Failed to create data source. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/data-sources"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Data Sources
        </Link>

        <h1 className="text-2xl font-semibold text-slate-900">New Data Source</h1>
        <p className="mt-1 text-sm text-slate-600">
          Connect external data to power contextual ad triggers.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                s < step
                  ? "bg-blue-600 text-white"
                  : s === step
                  ? "bg-blue-100 text-blue-700 ring-2 ring-blue-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {s < step ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                s
              )}
            </span>
            <span className={`text-sm ${s === step ? "text-slate-900 font-medium" : "text-slate-500"}`}>
              {s === 1 ? "Select Type" : s === 2 ? "Configure" : "Review"}
            </span>
            {s < 3 && (
              <svg className="w-4 h-4 text-slate-300 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-slate-900">Select data source type</h2>
          <div className="grid gap-4">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectType(option.value)}
                className={`flex items-start gap-4 p-5 rounded-lg border-2 text-left transition-all hover:shadow-md ${option.color.bg} ${option.color.border}`}
              >
                <div className={option.color.text}>{option.icon}</div>
                <div className="flex-1">
                  <h3 className={`font-medium ${option.color.text}`}>{option.label}</h3>
                  <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && selectedType && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">Configure {selectedType} data source</h2>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Change type
            </button>
          </div>

          {/* Common: Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., London Weather"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Weather Configuration */}
          {selectedType === "weather" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Location</label>
                <input
                  type="text"
                  value={weatherLocation}
                  onChange={(e) => setWeatherLocation(e.target.value)}
                  placeholder="e.g., London, UK"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500">Enter city name with country code for best results</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Units</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setWeatherUnits("metric")}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      weatherUnits === "metric"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Celsius (metric)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeatherUnits("imperial")}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      weatherUnits === "imperial"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Fahrenheit (imperial)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  API Key <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="password"
                  value={weatherApiKey}
                  onChange={(e) => setWeatherApiKey(e.target.value)}
                  placeholder="Uses default if not provided"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500">Leave blank to use the system default API key</p>
              </div>

              {/* Test Connection Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={testWeatherConnection}
                  disabled={!weatherLocation || testingConnection}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingConnection ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Testing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Test Connection
                    </>
                  )}
                </button>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    <p className="text-sm">{testResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar Configuration */}
          {selectedType === "calendar" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-4 space-y-4">
                <h3 className="font-medium text-slate-900">Add Events</h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <input
                      type="text"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="Event name"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as "holiday" | "event" | "sale")}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {eventTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addCalendarEvent}
                      disabled={!newEventName || !newEventDate}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Events List */}
              {calendarEvents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-700">Added Events ({calendarEvents.length})</h3>
                  <div className="space-y-2">
                    {calendarEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            event.type === "holiday" ? "bg-red-100 text-red-700" :
                            event.type === "sale" ? "bg-green-100 text-green-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {event.type}
                          </span>
                          <span className="font-medium text-slate-900">{event.name}</span>
                          <span className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCalendarEvent(index)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {calendarEvents.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No events added yet</p>
              )}
            </div>
          )}

          {/* Custom Configuration */}
          {selectedType === "custom" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Key-Value Data</h3>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Field
                </button>
              </div>

              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, "key", e.target.value)}
                      placeholder="Key"
                      className="w-1/3 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {customFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">Values that look like JSON will be parsed automatically</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceedToReview()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && selectedType && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-slate-900">Review & Create</h2>

          {/* Summary Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedType === "weather" ? "bg-blue-100 text-blue-700" :
                selectedType === "calendar" ? "bg-purple-100 text-purple-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-slate-900">{name}</h3>

            {/* Type-specific summary */}
            {selectedType === "weather" && (
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium">Location:</span> {weatherLocation}</p>
                <p><span className="font-medium">Units:</span> {weatherUnits === "metric" ? "Celsius" : "Fahrenheit"}</p>
                <p><span className="font-medium">API Key:</span> {weatherApiKey ? "Custom" : "Default"}</p>
              </div>
            )}

            {selectedType === "calendar" && (
              <div className="text-sm text-slate-600">
                <p><span className="font-medium">Events:</span> {calendarEvents.length} configured</p>
                {calendarEvents.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {calendarEvents.slice(0, 3).map((event, i) => (
                      <li key={i} className="text-slate-500">
                        - {event.name} ({new Date(event.date).toLocaleDateString()})
                      </li>
                    ))}
                    {calendarEvents.length > 3 && (
                      <li className="text-slate-500">... and {calendarEvents.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {selectedType === "custom" && (
              <div className="text-sm text-slate-600">
                <p><span className="font-medium">Fields:</span> {customFields.filter(f => f.key.trim()).length} configured</p>
                <ul className="mt-2 space-y-1">
                  {customFields.filter(f => f.key.trim()).slice(0, 5).map((field, i) => (
                    <li key={i} className="text-slate-500">
                      - {field.key}: {field.value.slice(0, 30)}{field.value.length > 30 ? "..." : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Data Source
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
