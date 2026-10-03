
"use client";

import {
  MapPin,
  Users,
  ArrowRight,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";

import Link from "next/link";
import { useState } from "react";

interface Area {
  _id?: string;
  areaId: string;
  name: string;
  description?: string;
  status?: "Active" | "Inactive";
  supplierCount?: number;
}

interface AreasTableProps {
  areas: Area[];
  onView?: (area: Area) => void;
  onUpdated?: () => void | Promise<void>;
}

export default function AreasTable({
  areas,
  onUpdated,
}: AreasTableProps) {
  const [editingArea, setEditingArea] =
    useState<Area | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [status, setStatus] =
    useState<"Active" | "Inactive">("Active");

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const openEdit = (area: Area) => {
    setEditingArea(area);
    setName(area.name);
    setDescription(area.description || "");
    setStatus(area.status || "Active");
  };

  const closeEdit = () => {
    setEditingArea(null);
    setName("");
    setDescription("");
    setStatus("Active");
  };

  const handleUpdate = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!editingArea) return;

    if (!name.trim()) {
      alert("Area name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/areas/${encodeURIComponent(
          editingArea.areaId
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            status,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update area."
        );
      }

      closeEdit();

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update area."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (area: Area) => {
    const confirmed = window.confirm(
      `Delete ${area.name}?\n\nExisting suppliers will be kept but marked inactive.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(area.areaId);

      const response = await fetch(
        `/api/areas/${encodeURIComponent(
          area.areaId
        )}`,
        {
          method: "DELETE",
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete area."
        );
      }

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete area."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (areas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-5 py-14 text-center">
        <MapPin className="mx-auto h-10 w-10 text-slate-700" />

        <h3 className="mt-4 text-lg font-semibold text-slate-300">
          No areas found
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Create your first area to start adding
          suppliers.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* AREA CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {areas.map((area) => (
          <div
            key={area.areaId}
            className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 transition hover:-translate-y-0.5 hover:border-emerald-500/30"
          >
            <Link
              href={`/areas/${encodeURIComponent(
                area.areaId
              )}`}
              className="block p-5"
            >
              {/* TOP */}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                      {area.areaId}
                    </p>

                    <h3 className="mt-0.5 text-lg font-semibold text-white">
                      {area.name}
                    </h3>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    area.status === "Inactive"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {area.status || "Active"}
                </span>
              </div>

              {/* SUPPLIER COUNT */}

              <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-slate-500" />

                  <span className="text-sm text-slate-400">
                    Suppliers
                  </span>
                </div>

                <span className="text-lg font-bold text-white">
                  {area.supplierCount ?? 0}
                </span>
              </div>

              {/* VIEW */}

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500 transition group-hover:text-emerald-400">
                  View Suppliers
                </span>

                <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
              </div>
            </Link>

            {/* ACTIONS */}

            <div className="flex border-t border-slate-800">
              <button
                type="button"
                onClick={() => openEdit(area)}
                className="flex flex-1 items-center justify-center gap-2 border-r border-slate-800 py-3 text-xs text-slate-400 transition hover:bg-slate-900 hover:text-emerald-400"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDelete(area)}
                disabled={
                  deletingId === area.areaId
                }
                className="flex flex-1 items-center justify-center gap-2 py-3 text-xs text-slate-400 transition hover:bg-slate-900 hover:text-red-400 disabled:opacity-50"
              >
                {deletingId === area.areaId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}

                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}

      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-[#020617] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Area
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {editingArea.areaId}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Area Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                  placeholder="Area name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                  placeholder="Area description"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "Active"
                        | "Inactive"
                    )
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 rounded-xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

