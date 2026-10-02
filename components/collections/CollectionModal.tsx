
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
  const [loadingAreas, setLoadingAreas] =
    useState(false);
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

      const response = await fetch(
        "/api/areas",
        {
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data;

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load areas"
        );
      }

      const activeAreas = Array.isArray(
        data.areas
      )
        ? data.areas.filter(
            (area: Area) =>
              area.status === "Active"
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

  function formatNumberWithCommas(
    value: string
  ) {
    if (!value) return "";

    const cleaned =
      value.replace(/,/g, "");

    if (cleaned === "") {
      return "";
    }

    const parts =
      cleaned.split(".");

    const integerPart =
      parts[0].replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );

    if (parts.length > 1) {
      return `${integerPart}.${parts[1]}`;
    }

    return integerPart;
  }

  function removeCommas(
    value: string
  ) {
    return value.replace(/,/g, "");
  }

  function handleTeaWeightChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = removeCommas(
      e.target.value
    );

    // Allows: 123, 123.5, 50000, 50000.25
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setTotalKg(
      formatNumberWithCommas(value)
    );
  }

  function handleFactoryWeightChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = removeCommas(
      e.target.value
    );

    // Allows: 123, 123.5, 50000, 50000.25
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
    Number(
      removeCommas(factoryWeightKg)
    ) || 0;

  // Factory Weight - Tea Weight
  const difference = Number(
    (
      factoryWeight -
      teaWeight
    ).toFixed(2)
  );

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!date) {
      setError(
        "Please select a date."
      );
      return;
    }

    if (!areaId) {
      setError(
        "Please select an area."
      );
      return;
    }

    if (
      !totalKg ||
      !Number.isFinite(teaWeight) ||
      teaWeight < 0
    ) {
      setError(
        "Please enter a valid Tea Weight."
      );
      return;
    }

    if (
      !factoryWeightKg ||
      !Number.isFinite(factoryWeight) ||
      factoryWeight < 0
    ) {
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
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            date,
            areaId,
            totalKg: teaWeight,
            factoryWeightKg:
              factoryWeight,
            differenceKg:
              difference,
            notes:
              notes.trim(),
          }),
        }
      );

      const text =
        await response.text();

      let data;

      try {
        data = text
          ? JSON.parse(text)
          : {};
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
      {/* 
        Mobile:
        - Full screen
        - Vertical scrolling enabled

        Desktop:
        - Centered modal
        - Maximum width
      */}
      <div className="flex min-h-full items-start justify-center overflow-y-auto px-3 py-3 sm:items-center sm:px-4 sm:py-6">
        <div className="my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0b1510] shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0 pr-3">
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                Add Tea Collection
              </h2>

              <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                Add daily tea and factory
                weights for an area.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="shrink-0 rounded-xl p-2 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* 
            Form area

            overflow-y-auto:
            This is the important part for mobile.
          */}
          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-100px)] overflow-y-auto p-4 sm:max-h-[85vh] sm:p-6"
          >
            <div className="space-y-4 sm:space-y-5">
              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">
                  Collection Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    strokeWidth={2}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white"
                  />

                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#101c14] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                </div>

                <p className="mt-1.5 text-xs text-gray-500">
                  You can select today or
                  any previous date.
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
                    setAreaId(
                      e.target.value
                    )
                  }
                  disabled={
                    loadingAreas ||
                    saving
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
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
                      className="w-full rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 pr-16 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
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
                      value={
                        factoryWeightKg
                      }
                      onChange={
                        handleFactoryWeightChange
                      }
                      placeholder="e.g. 49,500"
                      disabled={saving}
                      className="w-full rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 pr-16 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-400">
                      KG
                    </span>
                  </div>
                </div>
              </div>

              {/* Difference */}
              <div className="rounded-xl border border-emerald-500/10 bg-[#101c14] p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Weight Difference
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Factory Weight − Tea
                      Weight
                    </p>
                  </div>

                  <div
                    className={`text-xl font-bold sm:text-2xl ${
                      difference > 0
                        ? "text-cyan-400"
                        : difference < 0
                          ? "text-red-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {difference > 0
                      ? "+"
                      : ""}

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
                    setNotes(
                      e.target.value
                    )
                  }
                  placeholder="Enter any notes..."
                  rows={3}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
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
            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:mt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  loadingAreas
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
    </div>
  );
}
