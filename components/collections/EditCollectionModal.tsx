"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  X,
  Save,
  Loader2,
} from "lucide-react";

interface Area {
  areaId: string;
  name: string;
  status: string;
}

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
  collection:
    | Collection
    | null;
  onClose: () => void;
  onUpdated: () => void;
}

function formatInputDate(
  date: string
) {
  const value =
    new Date(date);

  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      value.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function EditCollectionModal({
  isOpen,
  collection,
  onClose,
  onUpdated,
}: EditCollectionModalProps) {
  const [date, setDate] =
    useState("");

  const [areaId, setAreaId] =
    useState("");

  const [totalKg, setTotalKg] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [areas, setAreas] =
    useState<Area[]>([]);

  const [loadingAreas, setLoadingAreas] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      !isOpen ||
      !collection
    ) {
      return;
    }

    setDate(
      formatInputDate(
        collection.date
      )
    );

    setAreaId(
      collection.areaId
    );

    setTotalKg(
      String(
        collection.totalKg
      )
    );

    setNotes(
      collection.notes || ""
    );

    setError("");

    loadAreas();
  }, [
    isOpen,
    collection,
  ]);

  async function loadAreas() {
    try {
      setLoadingAreas(true);

      const response =
        await fetch(
          "/api/areas",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load areas"
        );
      }

      setAreas(
        (data.areas || []).filter(
          (area: Area) =>
            area.status ===
            "Active"
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load areas"
      );
    } finally {
      setLoadingAreas(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!collection) {
      return;
    }

    setError("");

    const kg =
      Number(
        totalKg.trim()
      );

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
      !Number.isFinite(kg) ||
      kg <= 0
    ) {
      setError(
        "Please enter a valid KG greater than 0."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/collections/${encodeURIComponent(
            collection.collectionId
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache:
              "no-store",

            body: JSON.stringify({
              date,
              areaId,
              totalKg: kg,
              notes:
                notes.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update collection"
        );
      }

      alert(
        `Collection updated successfully!\n\nArea: ${data.collection.areaName}\nTotal: ${Number(
          data.collection.totalKg
        ).toLocaleString()} KG`
      );

      onUpdated();
    } catch (error) {
      console.error(
        "UPDATE COLLECTION ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update collection"
      );
    } finally {
      setSaving(false);
    }
  }

  if (
    !isOpen ||
    !collection
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1811] shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Edit Tea Collection
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {
                collection.collectionId
              }
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5 p-5"
        >

          {/* Date */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Collection Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value
                )
              }
              disabled={saving}
              className="w-full rounded-xl border border-white/10 bg-[#07100b] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Area */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Area
            </label>

            <select
              value={areaId}
              onChange={(event) =>
                setAreaId(
                  event.target.value
                )
              }
              disabled={
                saving ||
                loadingAreas
              }
              className="w-full rounded-xl border border-white/10 bg-[#07100b] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="">
                {loadingAreas
                  ? "Loading areas..."
                  : "Select Area"}
              </option>

              {areas.map(
                (area) => (
                  <option
                    key={
                      area.areaId
                    }
                    value={
                      area.areaId
                    }
                  >
                    {area.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* KG */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Total Tea KG
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={totalKg}
              onChange={(event) =>
                setTotalKg(
                  event.target.value
                )
              }
              disabled={saving}
              className="w-full rounded-xl border border-white/10 bg-[#07100b] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Notes */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              rows={3}
              disabled={saving}
              placeholder="Optional notes..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#07100b] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Error */}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Buttons */}

          <div className="flex gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Update Collection
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}