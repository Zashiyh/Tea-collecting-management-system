"use client";

import { useEffect, useState } from "react";
import {
  X,
  CalendarDays,
  Loader2,
  Save,
} from "lucide-react";

interface Area {
  areaId: string;
  name: string;
  status: "Active" | "Inactive";
}

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
}

export default function CollectionModal({
  isOpen,
  onClose,
  onCreated,
}: CollectionModalProps) {
  const [date, setDate] = useState("");
  const [areaId, setAreaId] = useState("");
  const [totalKg, setTotalKg] = useState("");
  const [factoryWeightKg, setFactoryWeightKg] =
    useState("");
  const [notes, setNotes] = useState("");

  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();

    const localDate = new Date(
      today.getTime() -
        today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    setDate(localDate);
    setAreaId("");
    setTotalKg("");
    setFactoryWeightKg("");
    setNotes("");
    setError("");

    loadAreas();
  }, [isOpen]);

  async function loadAreas() {
    try {
      setLoadingAreas(true);
      setError("");

      const response = await fetch("/api/areas", {
        cache: "no-store",
      });

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load areas"
        );
      }

      const activeAreas = Array.isArray(data.areas)
        ? data.areas.filter(
            (area: Area) => area.status === "Active"
          )
        : [];

      setAreas(activeAreas);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load areas"
      );
    } finally {
      setLoadingAreas(false);
    }
  }

  /*
   * Format number with commas.
   * Example:
   * 50000 -> 50,000
   * 1250000 -> 1,250,000
   */
  function formatNumberWithCommas(value: string) {
    if (!value) return "";

    const cleaned = value.replace(/,/g, "");

    if (cleaned === "") return "";

    const parts = cleaned.split(".");

    const integerPart = parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );

    if (parts.length > 1) {
      return `${integerPart}.${parts[1]}`;
    }

    return integerPart;
  }

  /*
   * Convert formatted value back to a normal number string.
   * Example:
   * 50,000 -> 50000
   */
  function removeCommas(value: string) {
    return value.replace(/,/g, "");
  }

  function handleTeaWeightChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = removeCommas(e.target.value);

    // Allow only numbers and decimal values
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setTotalKg(formatNumberWithCommas(value));
  }

  function handleFactoryWeightChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = removeCommas(e.target.value);

    // Allow only numbers and decimal values
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setFactoryWeightKg(
      formatNumberWithCommas(value)
    );
  }

  const teaWeight =
    Number(removeCommas(totalKg)) || 0;

  const factoryWeight =
    Number(removeCommas(factoryWeightKg)) || 0;

  const difference = teaWeight - factoryWeight;

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!areaId) {
      setError("Please select an area.");
      return;
    }

    if (!totalKg || teaWeight < 0) {
      setError(
        "Please enter a valid Tea Weight."
      );
      return;
    }

    if (!factoryWeightKg || factoryWeight < 0) {
      setError(
        "Please enter a valid Factory Weight."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/collections",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            areaId,
            totalKg: teaWeight,
            factoryWeightKg: factoryWeight,
            notes: notes.trim(),
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create collection"
        );
      }

      await onCreated?.();

      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create collection"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b1510] shadow-2xl shadow-black/40">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Add Tea Collection
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Add daily tea and factory weights
              for an area.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          <div className="space-y-5">

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Collection Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-[#101c14] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    colorScheme: "dark",
                  }}
                />
              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                You can select today or any previous
                date.
              </p>
            </div>

            {/* Area */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Area
              </label>

              <select
                value={areaId}
                onChange={(e) =>
                  setAreaId(e.target.value)
                }
                disabled={
                  loadingAreas || saving
                }
                className="w-full rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option
                  value=""
                  className="bg-[#101c14]"
                >
                  {loadingAreas
                    ? "Loading areas..."
                    : "Select an area"}
                </option>

                {areas.map((area) => (
                  <option
                    key={area.areaId}
                    value={area.areaId}
                    className="bg-[#101c14]"
                  >
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Weight Fields */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Tea Weight */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Tea Weight / Area Weight
                </label>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={totalKg}
                    onChange={
                      handleTeaWeightChange
                    }
                    placeholder="e.g. 50,000"
                    disabled={saving}
                    className="w-full rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 pr-16 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-400">
                    KG
                  </span>
                </div>
              </div>

              {/* Factory Weight */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Factory Weight
                </label>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={factoryWeightKg}
                    onChange={
                      handleFactoryWeightChange
                    }
                    placeholder="e.g. 49,500"
                    disabled={saving}
                    className="w-full rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 pr-16 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-400">
                    KG
                  </span>
                </div>
              </div>
            </div>

            {/* Difference */}
            <div className="rounded-xl border border-emerald-500/10 bg-[#101c14] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Weight Difference
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Tea Weight − Factory Weight
                  </p>
                </div>

                <div
                  className={`text-xl font-bold ${
                    difference > 0
                      ? "text-amber-400"
                      : difference < 0
                        ? "text-red-400"
                        : "text-emerald-400"
                  }`}
                >
                  {difference.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}{" "}
                  KG
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Notes
                <span className="ml-1 text-gray-500">
                  (Optional)
                </span>
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder="Enter any notes..."
                rows={3}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving || loadingAreas
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Add Collection
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}