"use client";

import { useEffect, useState } from "react";

import {
  X,
  CalendarDays,
  Loader2,
  Save,
} from "lucide-react";

interface Collection {
  collectionId: string;
  date: string;
  areaId: string;
  areaName: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes?: string;
}

interface EditCollectionModalProps {
  isOpen: boolean;
  collection: Collection;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
}

export default function EditCollectionModal({
  isOpen,
  collection,
  onClose,
  onUpdated,
}: EditCollectionModalProps) {
  const [date, setDate] = useState("");
  const [totalKg, setTotalKg] = useState("");
  const [factoryWeightKg, setFactoryWeightKg] =
    useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !collection) {
      return;
    }

    const existingDate = new Date(
      collection.date
    );

    const formattedDate =
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(existingDate);

    setDate(formattedDate);

    setTotalKg(
      formatNumberWithCommas(
        String(
          collection.totalKg ?? ""
        )
      )
    );

    setFactoryWeightKg(
      formatNumberWithCommas(
        String(
          collection.factoryWeightKg ?? ""
        )
      )
    );

    setNotes(
      collection.notes || ""
    );

    setError("");
  }, [isOpen, collection]);

  function formatNumberWithCommas(
    value: string
  ) {
    if (!value) {
      return "";
    }

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

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setFactoryWeightKg(
      formatNumberWithCommas(value)
    );
  }

  const teaWeight =
    Number(
      removeCommas(totalKg)
    ) || 0;

  const factoryWeight =
    Number(
      removeCommas(factoryWeightKg)
    ) || 0;

  /*
   * IMPORTANT
   *
   * Difference =
   * Factory Weight - Tea Weight
   */
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

    if (!totalKg) {
      setError(
        "Please enter a valid Tea Weight."
      );
      return;
    }

    if (
      !Number.isFinite(teaWeight) ||
      teaWeight < 0
    ) {
      setError(
        "Please enter a valid Tea Weight."
      );
      return;
    }

    if (!factoryWeightKg) {
      setError(
        "Please enter a valid Factory Weight."
      );
      return;
    }

    if (
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
        `/api/collections/${encodeURIComponent(
          collection.collectionId
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            date,

            /*
             * Tea Weight can now be edited.
             */
            totalKg: teaWeight,

            /*
             * Factory Weight can also be edited.
             */
            factoryWeightKg:
              factoryWeight,

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
            "Failed to update collection"
        );
      }

      await onUpdated?.();

      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update collection"
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
              Edit Tea Collection
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Update collection date and
              weights.
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
            {/* Collection ID */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Collection ID
              </label>

              <div className="rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 text-gray-400">
                {collection.collectionId}
              </div>
            </div>

            {/* Area */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Area
              </label>

              <div className="rounded-xl border border-white/10 bg-[#101c14] px-4 py-3 text-gray-400">
                {collection.areaName}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Collection Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={19}
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
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#101c14] py-3 pl-12 pr-4 text-white outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    colorScheme: "dark",
                  }}
                />
              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                You can change the
                collection date.
              </p>
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
                    placeholder="e.g. 40,000"
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
                    value={
                      factoryWeightKg
                    }
                    onChange={
                      handleFactoryWeightChange
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
            </div>

            {/* Difference */}
            <div className="rounded-xl border border-emerald-500/10 bg-[#101c14] p-4">
              <div className="flex items-center justify-between gap-4">
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
                  className={`text-xl font-bold ${
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
              disabled={saving}
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}