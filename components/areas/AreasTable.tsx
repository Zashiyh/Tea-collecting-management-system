"use client";

import {
  MapPin,
  Users,
  Scale,
  Wallet,
  ArrowRight,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";

interface Area {
  _id?: string;
  areaId: string;
  name: string;
  description?: string;
  status?: "Active" | "Inactive";
  supplierCount?: number;
  todayKg?: number;
  todayValue?: number;
  totalKg?: number;
  totalValue?: number;
}

interface AreasTableProps {
  areas: Area[];
  onView?: (area: Area) => void;
  onUpdated?: () => void | Promise<void>;
}

export default function AreasTable({
  areas,
  onView,
  onUpdated,
}: AreasTableProps) {
  const [editingArea, setEditingArea] =
    useState<Area | null>(null);

  const [deletingArea, setDeletingArea] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<"Active" | "Inactive">(
      "Active"
    );

  function formatNumber(value = 0) {
    return Number(value).toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    );
  }

  function formatMoney(value = 0) {
    return `Rs. ${Number(value).toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }

  /* =========================================
     OPEN EDIT
  ========================================= */

  function handleEdit(area: Area) {
    setEditingArea(area);

    setName(area.name || "");

    setDescription(
      area.description || ""
    );

    setStatus(
      area.status === "Inactive"
        ? "Inactive"
        : "Active"
    );

    setError("");
  }

  /* =========================================
     CLOSE EDIT
  ========================================= */

  function handleCloseEdit() {
    if (isSaving) {
      return;
    }

    setEditingArea(null);

    setName("");

    setDescription("");

    setStatus("Active");

    setError("");
  }

  /* =========================================
     SAVE EDIT
  ========================================= */

  async function handleSaveEdit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingArea) {
      return;
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        "Area name is required."
      );

      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response =
        await fetch(
          `/api/areas/${encodeURIComponent(
            editingArea.areaId
          )}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name: trimmedName,
              description:
                description.trim(),
              status,
            }),
          }
        );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      if (responseText.trim()) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
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
            "Failed to update area."
        );
      }

      handleCloseEdit();

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error) {
      console.error(
        "UPDATE AREA ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update area."
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* =========================================
     DELETE AREA
  ========================================= */

  async function handleDelete(
    area: Area
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${area.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingArea(
        area.areaId
      );

      setIsDeleting(true);

      const response =
        await fetch(
          `/api/areas/${encodeURIComponent(
            area.areaId
          )}`,
          {
            method: "DELETE",
            cache: "no-store",
          }
        );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      if (responseText.trim()) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
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
            "Failed to delete area."
        );
      }

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error) {
      console.error(
        "DELETE AREA ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete area."
      );
    } finally {
      setDeletingArea(null);

      setIsDeleting(false);
    }
  }

  /* =========================================
     EMPTY STATE
  ========================================= */

  if (areas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-10 text-center">
        <MapPin
          size={32}
          className="mx-auto text-slate-700"
        />

        <h3 className="mt-4 font-semibold text-white">
          No areas found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Add your first tea collection area.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* =========================================
          AREA CARDS
      ========================================= */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <div
            key={
              area.areaId ||
              area._id
            }
            className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] transition duration-200 hover:-translate-y-1 hover:border-emerald-500/30"
          >
            {/* Header */}

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MapPin
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-emerald-400">
                      {area.areaId}
                    </p>

                    <h3 className="mt-1 font-semibold text-white">
                      {area.name}
                    </h3>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    area.status ===
                    "Inactive"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {area.status ||
                    "Active"}
                </span>
              </div>

              {area.description && (
                <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
                  {area.description}
                </p>
              )}

              {/* Stats */}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users
                      size={14}
                    />

                    Suppliers
                  </div>

                  <p className="mt-1 text-lg font-bold text-white">
                    {area.supplierCount ??
                      0}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Scale
                      size={14}
                    />

                    Total KG
                  </div>

                  <p className="mt-1 text-lg font-bold text-white">
                    {formatNumber(
                      area.totalKg ??
                        area.todayKg ??
                        0
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Scale
                      size={14}
                    />

                    Today
                  </div>

                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {formatNumber(
                      area.todayKg ??
                        0
                    )}{" "}
                    KG
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Wallet
                      size={14}
                    />

                    Value
                  </div>

                  <p className="mt-1 text-sm font-bold text-emerald-400">
                    {formatMoney(
                      area.totalValue ??
                        area.todayValue ??
                        0
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================
                ACTION BUTTONS
            ================================= */}

            <div className="flex border-t border-slate-800">
              {/* View */}

              <button
                type="button"
                onClick={() =>
                  onView?.(area)
                }
                className="flex flex-1 items-center justify-between bg-slate-900/20 px-5 py-3.5 text-sm font-medium text-slate-400 transition hover:bg-emerald-500/5 hover:text-emerald-400"
              >
                <span>
                  View Area
                </span>

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              {/* Edit */}

              <button
                type="button"
                onClick={() =>
                  handleEdit(area)
                }
                className="flex h-[53px] w-[53px] items-center justify-center border-l border-slate-800 bg-slate-900/20 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400"
                title="Edit area"
              >
                <Pencil
                  size={16}
                />
              </button>

              {/* Delete */}

              <button
                type="button"
                onClick={() =>
                  handleDelete(area)
                }
                disabled={
                  isDeleting &&
                  deletingArea ===
                    area.areaId
                }
                className="flex h-[53px] w-[53px] items-center justify-center border-l border-slate-800 bg-slate-900/20 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                title="Delete area"
              >
                {isDeleting &&
                deletingArea ===
                  area.areaId ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={16}
                  />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================
          EDIT AREA MODAL
      ========================================= */}

      {editingArea && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d1811] shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Pencil
                      size={18}
                    />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Edit Area
                    </h2>

                    <p className="text-xs text-gray-500">
                      {editingArea.areaId}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseEdit
                }
                disabled={isSaving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={
                handleSaveEdit
              }
              className="px-6 py-6"
            >
              {/* Error */}

              {error && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-sm text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Area Name */}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Area Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter area name"
                  disabled={isSaving}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#07100b] px-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 disabled:opacity-60"
                />
              </div>

              {/* Description */}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Enter area description"
                  rows={3}
                  disabled={isSaving}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#07100b] px-3 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500/50 disabled:opacity-60"
                />
              </div>

              {/* Status */}

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as
                        | "Active"
                        | "Inactive"
                    )
                  }
                  disabled={isSaving}
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#07100b] px-3 text-sm text-white outline-none transition focus:border-emerald-500/50 disabled:opacity-60"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* Buttons */}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    handleCloseEdit
                  }
                  disabled={isSaving}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !name.trim()
                  }
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#07100b] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save
                        size={16}
                      />

                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}