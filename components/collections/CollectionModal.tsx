"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Leaf } from "lucide-react";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Area {
  _id: string;
  areaId: string;
  name: string;
  status: "Active" | "Inactive";
}

interface Supplier {
  _id: string;
  supplierId: string;
  name: string;
  phone: string;
  areaId: string;
  areaName: string;
}

export default function CollectionModal({
  isOpen,
  onClose,
  onCreated,
}: CollectionModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [areas, setAreas] = useState<Area[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [date, setDate] = useState(today);
  const [areaId, setAreaId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const [weightKg, setWeightKg] = useState("");
  const [ratePerKg, setRatePerKg] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalAmount = useMemo(() => {
    const weight = Number(weightKg);
    const rate = Number(ratePerKg);

    if (!weight || !rate) {
      return 0;
    }

    return weight * rate;
  }, [weightKg, ratePerKg]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchAreas() {
      try {
        setLoadingAreas(true);

        const response = await fetch("/api/areas", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok) {
          setAreas(
            (data.areas || []).filter(
              (area: Area) => area.status === "Active"
            )
          );
        }
      } catch (error) {
        console.error("Fetch areas error:", error);
      } finally {
        setLoadingAreas(false);
      }
    }

    fetchAreas();
  }, [isOpen]);

  useEffect(() => {
    if (!areaId) {
      setSuppliers([]);
      setSupplierId("");
      return;
    }

    async function fetchSuppliers() {
      try {
        setLoadingSuppliers(true);
        setSupplierId("");

        const response = await fetch(
          `/api/suppliers?areaId=${encodeURIComponent(
            areaId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setSuppliers(data.suppliers || []);
        } else {
          setSuppliers([]);
        }
      } catch (error) {
        console.error(
          "Fetch suppliers error:",
          error
        );

        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    }

    fetchSuppliers();
  }, [areaId]);

  if (!isOpen) {
    return null;
  }

  function resetForm() {
    setDate(today);
    setAreaId("");
    setSupplierId("");
    setSuppliers([]);
    setWeightKg("");
    setRatePerKg("");
    setNotes("");
    setError("");
  }

  function handleClose() {
    if (loading) return;

    resetForm();
    onClose();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!date) {
      setError("Collection date is required.");
      return;
    }

    if (!areaId) {
      setError("Please select a collection area.");
      return;
    }

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (!weightKg || Number(weightKg) <= 0) {
      setError("Please enter a valid weight.");
      return;
    }

    if (!ratePerKg || Number(ratePerKg) <= 0) {
      setError("Please enter a valid rate per KG.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          areaId,
          supplierId,
          weightKg: Number(weightKg),
          ratePerKg: Number(ratePerKg),
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to save tea collection."
        );
        return;
      }

      resetForm();
      onCreated();
      onClose();
    } catch (error) {
      console.error(
        "Create collection error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#07140e] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <Leaf size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Add Tea Collection
              </h2>

              <p className="text-sm text-gray-500">
                Record collected tea leaves
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
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
                setDate(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Area */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Collection Area
            </label>

            <select
              value={areaId}
              onChange={(event) =>
                setAreaId(event.target.value)
              }
              disabled={loadingAreas}
              className="w-full rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" className="bg-[#0d1d14]">
                {loadingAreas
                  ? "Loading areas..."
                  : "Select collection area"}
              </option>

              {areas.map((area) => (
                <option
                  key={area.areaId}
                  value={area.areaId}
                  className="bg-[#0d1d14]"
                >
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Tea Leaf Supplier
            </label>

            <select
              value={supplierId}
              onChange={(event) =>
                setSupplierId(event.target.value)
              }
              disabled={
                !areaId ||
                loadingSuppliers
              }
              className="w-full rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" className="bg-[#0d1d14]">
                {!areaId
                  ? "Select area first"
                  : loadingSuppliers
                  ? "Loading suppliers..."
                  : suppliers.length === 0
                  ? "No suppliers in this area"
                  : "Select supplier"}
              </option>

              {suppliers.map((supplier) => (
                <option
                  key={supplier.supplierId}
                  value={supplier.supplierId}
                  className="bg-[#0d1d14]"
                >
                  {supplier.name} — {supplier.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Tea Leaf Weight (KG)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={weightKg}
              onChange={(event) =>
                setWeightKg(event.target.value)
              }
              placeholder="Example: 125"
              className="w-full rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-500"
            />
          </div>

          {/* Rate */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Rate per KG (Rs.)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={ratePerKg}
              onChange={(event) =>
                setRatePerKg(event.target.value)
              }
              placeholder="Example: 180"
              className="w-full rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-500"
            />
          </div>

          {/* Total */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Total Amount
              </span>

              <span className="text-xl font-bold text-emerald-400">
                Rs.{" "}
                {totalAmount.toLocaleString(
                  "en-LK",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

            {weightKg && ratePerKg && (
              <p className="mt-1 text-xs text-gray-500">
                {Number(weightKg).toLocaleString()} KG ×
                Rs. {Number(ratePerKg).toLocaleString()}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Notes
              <span className="ml-1 text-gray-600">
                (Optional)
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add any notes about this collection..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-medium text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : "Save Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}