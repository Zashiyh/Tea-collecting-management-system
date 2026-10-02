"use client";

import { useEffect, useState } from "react";
import {
  X,
  UserPlus,
  Save,
  Loader2,
} from "lucide-react";

interface Supplier {
  supplierId: string;
  name: string;
  phone?: string;
  areaId: string;
  areaName: string;
  village?: string;
  status: "Active" | "Inactive";
}

interface Contribution {
  contributionId: string;
  supplierId: string;
  supplierName: string;
  weightKg: number;
  notes?: string;
}

interface SupplierContributionModalProps {
  isOpen: boolean;
  collectionId: string;
  areaId: string;
  areaName: string;
  date: string;
  editContribution?: Contribution | null;
  onClose: () => void;
  onAdded: () => void | Promise<void>;
}

export default function SupplierContributionModal({
  isOpen,
  collectionId,
  areaId,
  areaName,
  date,
  editContribution,
  onClose,
  onAdded,
}: SupplierContributionModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(
    []
  );

  const [supplierId, setSupplierId] =
    useState("");

  const [weightKg, setWeightKg] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [isLoadingSuppliers, setIsLoadingSuppliers] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * IMPORTANT:
   * Keep these as primitive values.
   * Do not put the whole editContribution object
   * inside useEffect dependency arrays.
   */
  const editContributionId =
    editContribution?.contributionId ?? "";

  const editSupplierId =
    editContribution?.supplierId ?? "";

  const editWeightKg =
    editContribution?.weightKg ?? 0;

  const editNotes =
    editContribution?.notes ?? "";

  const isEditMode =
    editContributionId !== "";

  /*
   * Load suppliers when modal opens
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    loadSuppliers();
  }, [isOpen, areaId]);

  /*
   * Set form values.
   *
   * This works for both:
   * Add mode
   * Edit mode
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError("");

    if (editContributionId) {
      setSupplierId(editSupplierId);

      setWeightKg(
        Number(editWeightKg || 0).toLocaleString(
          "en-US",
          {
            maximumFractionDigits: 2,
          }
        )
      );

      setNotes(editNotes);
    } else {
      setSupplierId("");
      setWeightKg("");
      setNotes("");
    }
  }, [
    isOpen,
    editContributionId,
    editSupplierId,
    editWeightKg,
    editNotes,
  ]);

  async function loadSuppliers() {
    try {
      setIsLoadingSuppliers(true);
      setError("");

      const response = await fetch(
        `/api/suppliers?areaId=${encodeURIComponent(
          areaId
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        suppliers?: Supplier[];
        message?: string;
      } = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error(
            "SUPPLIERS INVALID JSON:",
            responseText
          );

          throw new Error(
            `Server returned invalid JSON (${response.status}).`
          );
        }
      } else {
        throw new Error(
          `Server returned an empty response (${response.status}).`
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load suppliers."
        );
      }

      setSuppliers(
        Array.isArray(data.suppliers)
          ? data.suppliers
          : []
      );
    } catch (error) {
      console.error(
        "LOAD SUPPLIERS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load suppliers."
      );
    } finally {
      setIsLoadingSuppliers(false);
    }
  }

  function handleWeightChange(
    value: string
  ) {
    /*
     * Allow only numbers and decimal point.
     */
    const cleaned = value.replace(
      /[^0-9.]/g,
      ""
    );

    /*
     * Prevent multiple decimal points.
     */
    const parts =
      cleaned.split(".");

    let formatted =
      parts[0] || "";

    if (parts.length > 1) {
      formatted +=
        "." +
        parts
          .slice(1)
          .join("");
    }

    /*
     * Format integer part with commas.
     */
    if (formatted) {
      const [integerPart, decimalPart] =
        formatted.split(".");

      const formattedInteger =
        Number(integerPart || 0).toLocaleString(
          "en-US"
        );

      formatted =
        decimalPart !== undefined
          ? `${formattedInteger}.${decimalPart}`
          : formattedInteger;
    }

    setWeightKg(formatted);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      if (!supplierId) {
        setError(
          "Please select a supplier."
        );
        return;
      }

      const numericWeight = Number(
        weightKg.replace(/,/g, "")
      );

      if (
        !Number.isFinite(
          numericWeight
        ) ||
        numericWeight <= 0
      ) {
        setError(
          "Please enter a valid tea weight."
        );
        return;
      }

      let response: Response;

      /*
       * EDIT
       */
      if (
        isEditMode &&
        editContributionId
      ) {
        response = await fetch(
          `/api/collections/${encodeURIComponent(
            collectionId
          )}/suppliers/${encodeURIComponent(
            editContributionId
          )}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              supplierId,
              weightKg:
                numericWeight,
              notes:
                notes.trim(),
            }),
          }
        );
      }

      /*
       * ADD
       */
      else {
        response = await fetch(
          `/api/collections/${encodeURIComponent(
            collectionId
          )}/suppliers`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              supplierId,
              weightKg:
                numericWeight,
              notes:
                notes.trim(),
            }),
          }
        );
      }

      /*
       * IMPORTANT:
       *
       * Do NOT use:
       *
       * await response.json()
       *
       * directly.
       *
       * Some server errors can return an empty
       * response and that causes:
       *
       * Unexpected end of JSON input
       */
      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(
            responseText
          );
        } catch {
          console.error(
            "INVALID API JSON RESPONSE:",
            responseText
          );

          setError(
            `Server returned an invalid response (${response.status}).`
          );

          return;
        }
      } else {
        console.error(
          "EMPTY API RESPONSE:",
          response.status,
          response.statusText
        );

        setError(
          `Server returned an empty response (${response.status}).`
        );

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            `Request failed (${response.status}).`
        );

        return;
      }

      /*
       * Refresh contribution list
       */
      await onAdded();

      /*
       * Close modal
       */
      onClose();
    } catch (error) {
      console.error(
        "SUPPLIER CONTRIBUTION SUBMIT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d1811] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                {isEditMode ? (
                  <Save size={19} />
                ) : (
                  <UserPlus size={19} />
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEditMode
                    ? "Edit Supplier"
                    : "Add Supplier"}
                </h2>

                <p className="text-xs text-gray-500">
                  {areaName}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-6"
        >
          {/* Collection information */}
          <div className="mb-5 rounded-xl border border-white/5 bg-black/10 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500">
                  Area
                </p>

                <p className="mt-1 text-sm font-medium text-white">
                  {areaName}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500">
                  Date
                </p>

                <p className="mt-1 text-sm font-medium text-white">
                  {date
                    ? new Date(
                        date
                      ).toLocaleDateString(
                        "en-GB"
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Supplier */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Supplier
            </label>

            <select
              value={supplierId}
              onChange={(event) =>
                setSupplierId(
                  event.target.value
                )
              }
              disabled={
                isLoadingSuppliers ||
                isSubmitting
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-[#07100b] px-3 text-sm text-white outline-none transition focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isLoadingSuppliers
                  ? "Loading suppliers..."
                  : "Select supplier"}
              </option>

              {suppliers.map(
                (supplier) => (
                  <option
                    key={
                      supplier.supplierId
                    }
                    value={
                      supplier.supplierId
                    }
                  >
                    {supplier.name} —{" "}
                    {supplier.supplierId}
                  </option>
                )
              )}
            </select>

            {!isLoadingSuppliers &&
              suppliers.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  No active suppliers found
                  for this area.
                </p>
              )}
          </div>

          {/* Weight */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Tea Weight (KG)
            </label>

            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={weightKg}
                onChange={(event) =>
                  handleWeightChange(
                    event.target.value
                  )
                }
                placeholder="e.g. 500"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#07100b] px-3 pr-14 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                KG
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Notes
              <span className="ml-1 text-xs font-normal text-gray-600">
                (Optional)
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Add notes..."
              rows={3}
              disabled={isSubmitting}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#07100b] px-3 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingSuppliers ||
                !supplierId ||
                !weightKg
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#07100b] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  {isEditMode
                    ? "Saving..."
                    : "Adding..."}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <Save size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}

                  {isEditMode
                    ? "Save Changes"
                    : "Add Supplier"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}