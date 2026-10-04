
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Scale,
  X,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

import CollectionModal from "@/components/collections/CollectionModal";
import EditCollectionModal from "@/components/collections/EditCollectionModal";

interface Collection {
  _id?: string;
  collectionId: string;
  date: string;
  areaId: string;
  areaName: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes?: string;
}

interface CollectionsResponse {
  success: boolean;
  message?: string;
  collections: Collection[];
}

interface Area {
  areaId: string;
  name: string;
}

interface AreasResponse {
  success: boolean;
  message?: string;
  areas?: Area[];
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatDate(dateValue: string) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(date);
}

function getSriLankaDate(dateValue: string) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue.slice(0, 10);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [loading, setLoading] = useState(true);
  const [areasLoading, setAreasLoading] = useState(true);

  const [error, setError] = useState("");
  const [areasError, setAreasError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [editingCollection, setEditingCollection] =
    useState<Collection | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  /* =====================================================
     LOAD COLLECTIONS
  ===================================================== */

  async function loadCollections() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/collections", {
        cache: "no-store",
      });

      const text = await response.text();

      let data: CollectionsResponse;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load collections"
        );
      }

      const fixedCollections = (data.collections || []).map(
        (collection) => {
          const teaWeight = Number(collection.totalKg || 0);

          const factoryWeight = Number(
            collection.factoryWeightKg || 0
          );

          const difference = Number(
            (factoryWeight - teaWeight).toFixed(2)
          );

          return {
            ...collection,
            totalKg: teaWeight,
            factoryWeightKg: factoryWeight,
            differenceKg: difference,
          };
        }
      );

      setCollections(fixedCollections);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load collections"
      );

      setCollections([]);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD AREAS
  ===================================================== */

  async function loadAreas() {
    try {
      setAreasLoading(true);
      setAreasError("");

      const response = await fetch("/api/areas", {
        cache: "no-store",
      });

      const text = await response.text();

      let data: AreasResponse;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid areas response");
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load areas"
        );
      }

      setAreas(data.areas || []);
    } catch (error) {
      console.error(error);

      setAreasError(
        error instanceof Error
          ? error.message
          : "Failed to load areas"
      );

      setAreas([]);
    } finally {
      setAreasLoading(false);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadCollections();
    loadAreas();
  }, []);

  /* =====================================================
     CREATE / EDIT
  ===================================================== */

  function handleCreated() {
    setShowAddModal(false);
    loadCollections();
  }

  function handleEdited() {
    setEditingCollection(null);
    loadCollections();
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function handleDelete(collectionId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this collection?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(
          collectionId
        )}`,
        {
          method: "DELETE",
        }
      );

      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
      };

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete collection"
        );
      }

      await loadCollections();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete collection"
      );
    }
  }

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      const matchesDate =
        !selectedDate ||
        getSriLankaDate(collection.date) ===
          selectedDate;

      const matchesArea =
        !selectedAreaId ||
        collection.areaId === selectedAreaId;

      return matchesDate && matchesArea;
    });
  }, [
    collections,
    selectedDate,
    selectedAreaId,
  ]);

  /* =====================================================
     TOTALS
  ===================================================== */

  const totalTeaWeight =
    filteredCollections.reduce(
      (total, collection) =>
        total + Number(collection.totalKg || 0),
      0
    );

  const totalFactoryWeight =
    filteredCollections.reduce(
      (total, collection) =>
        total +
        Number(
          collection.factoryWeightKg || 0
        ),
      0
    );

  const totalDifference = Number(
    (
      totalFactoryWeight -
      totalTeaWeight
    ).toFixed(2)
  );

  const hasActiveFilter =
    selectedDate !== "" ||
    selectedAreaId !== "";

  function clearFilters() {
    setSelectedDate("");
    setSelectedAreaId("");
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      {/* SIDEBAR */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* MAIN */}
      <div className="lg:ml-64">
        <Header
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* PAGE HEADER */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/dashboard"
                className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-600/10 p-2.5 text-emerald-400">
                  <Scale size={21} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Tea Collections
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage daily tea collections
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  loadCollections();
                  loadAreas();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-[#07140d] px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading || areasLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowAddModal(true)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                <Plus size={17} />
                Add Collection
              </button>
            </div>
          </div>

          {/* ERRORS */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {areasError && (
            <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
              {areasError}
            </div>
          )}

          {/* FILTER BAR */}
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#07140d] p-3.5 sm:flex-row sm:flex-wrap sm:items-end">
            <div>
              <label
                htmlFor="collection-date"
                className="mb-1.5 block text-[11px] font-medium text-slate-500"
              >
                Date
              </label>

              <input
                id="collection-date"
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
                className="h-9 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-xs text-white outline-none transition focus:border-emerald-500 sm:w-[175px]"
              />
            </div>

            <div>
              <label
                htmlFor="collection-area"
                className="mb-1.5 block text-[11px] font-medium text-slate-500"
              >
                Area
              </label>

              <select
                id="collection-area"
                value={selectedAreaId}
                onChange={(event) =>
                  setSelectedAreaId(
                    event.target.value
                  )
                }
                className="h-9 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-xs text-white outline-none transition focus:border-emerald-500 sm:w-[200px]"
              >
                <option value="">
                  All Areas
                </option>

                {areas.map((area) => (
                  <option
                    key={area.areaId}
                    value={area.areaId}
                  >
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-[#020a06] px-3 text-xs text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                <X size={14} />
                Clear
              </button>
            )}

            <div className="flex h-9 items-center text-xs text-slate-500">
              Showing
              <span className="ml-1 font-semibold text-emerald-400">
                {filteredCollections.length}
              </span>

              <span className="ml-1">
                record
                {filteredCollections.length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3">
              <p className="text-[11px] text-slate-500">
                Collections
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {filteredCollections.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3">
              <p className="text-[11px] text-slate-500">
                Tea / Field Weight
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {formatNumber(
                  totalTeaWeight
                )}

                <span className="ml-1 text-[11px] font-normal text-slate-500">
                  kg
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3">
              <p className="text-[11px] text-slate-500">
                Factory Weight
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {formatNumber(
                  totalFactoryWeight
                )}

                <span className="ml-1 text-[11px] font-normal text-slate-500">
                  kg
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3">
              <p className="text-[11px] text-slate-500">
                Difference
              </p>

              <p
                className={`mt-1 text-lg font-bold ${
                  totalDifference > 0
                    ? "text-cyan-400"
                    : totalDifference < 0
                      ? "text-red-400"
                      : "text-emerald-400"
                }`}
              >
                {totalDifference > 0
                  ? "+"
                  : ""}

                {formatNumber(
                  totalDifference
                )}

                <span className="ml-1 text-[11px] font-normal text-slate-500">
                  kg
                </span>
              </p>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-10 text-center text-sm text-slate-500">
              Loading collections...
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            filteredCollections.length ===
              0 &&
            !error && (
              <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-10 text-center">
                <Scale
                  size={36}
                  className="mx-auto mb-3 text-slate-600"
                />

                <h2 className="text-base font-semibold text-white">
                  No collections found
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {hasActiveFilter
                    ? "No collections match the selected filters."
                    : "Add your first tea collection."}
                </p>

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <X size={14} />
                    Clear Filters
                  </button>
                )}
              </div>
            )}

          {/* EXCEL STYLE TABLE */}
          {!loading &&
            filteredCollections.length >
              0 && (
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#07140d]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#0a1a11]">
                        <th className="border-r border-slate-800 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          #
                        </th>

                        <th className="border-r border-slate-800 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="border-r border-slate-800 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Area
                        </th>

                        <th className="border-r border-slate-800 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Tea / Field
                          <br />
                          Weight
                        </th>

                        <th className="border-r border-slate-800 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Factory
                          <br />
                          Weight
                        </th>

                        <th className="border-r border-slate-800 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Difference
                        </th>

                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCollections.map(
                        (
                          collection,
                          index
                        ) => {
                          const teaWeight =
                            Number(
                              collection.totalKg ||
                                0
                            );

                          const factoryWeight =
                            Number(
                              collection.factoryWeightKg ||
                                0
                            );

                          const difference =
                            Number(
                              (
                                factoryWeight -
                                teaWeight
                              ).toFixed(2)
                            );

                          return (
                            <tr
                              key={
                                collection.collectionId
                              }
                              className="border-b border-slate-800/80 transition hover:bg-[#0a1a11]"
                            >
                              {/* NUMBER */}
                              <td className="border-r border-slate-800/80 px-3 py-2.5 text-xs text-slate-600">
                                {index + 1}
                              </td>

                              {/* DATE */}
                              <td className="border-r border-slate-800/80 px-3 py-2.5 text-xs text-slate-300">
                                {formatDate(
                                  collection.date
                                )}
                              </td>

                              {/* AREA */}
                              <td className="border-r border-slate-800/80 px-3 py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-white">
                                    {
                                      collection.areaName
                                    }
                                  </span>

                                  <span className="mt-0.5 text-[10px] text-slate-600">
                                    {
                                      collection.collectionId
                                    }
                                  </span>
                                </div>
                              </td>

                              {/* TEA */}
                              <td className="border-r border-slate-800/80 px-3 py-2.5 text-right">
                                <span className="text-sm font-medium text-white">
                                  {formatNumber(
                                    teaWeight
                                  )}
                                </span>

                                <span className="ml-1 text-[10px] text-slate-600">
                                  kg
                                </span>
                              </td>

                              {/* FACTORY */}
                              <td className="border-r border-slate-800/80 px-3 py-2.5 text-right">
                                <span className="text-sm font-medium text-white">
                                  {formatNumber(
                                    factoryWeight
                                  )}
                                </span>

                                <span className="ml-1 text-[10px] text-slate-600">
                                  kg
                                </span>
                              </td>

                              {/* DIFFERENCE */}
                              <td className="border-r border-slate-800/80 px-3 py-2.5 text-right">
                                <span
                                  className={`text-sm font-semibold ${
                                    difference >
                                    0
                                      ? "text-cyan-400"
                                      : difference <
                                          0
                                        ? "text-red-400"
                                        : "text-emerald-400"
                                  }`}
                                >
                                  {difference >
                                  0
                                    ? "+"
                                    : ""}
                                  {formatNumber(
                                    difference
                                  )}
                                </span>

                                <span className="ml-1 text-[10px] text-slate-600">
                                  kg
                                </span>
                              </td>

                              {/* ACTIONS */}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Link
                                    href={`/collections/${encodeURIComponent(
                                      collection.collectionId
                                    )}`}
                                    title="View"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-[#020a06] text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-400"
                                  >
                                    <Eye
                                      size={14}
                                    />
                                  </Link>

                                  <button
                                    type="button"
                                    title="Edit"
                                    onClick={() =>
                                      setEditingCollection(
                                        collection
                                      )
                                    }
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-[#020a06] text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-400"
                                  >
                                    <Pencil
                                      size={14}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    title="Delete"
                                    onClick={() =>
                                      handleDelete(
                                        collection.collectionId
                                      )
                                    }
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/20 bg-red-500/5 text-red-400 transition hover:bg-red-500/10"
                                  >
                                    <Trash2
                                      size={14}
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>

                    {/* TOTAL */}
                    <tfoot>
                      <tr className="bg-[#0a1a11]">
                        <td
                          colSpan={3}
                          className="border-r border-slate-800 px-3 py-3 text-right text-xs font-semibold text-slate-400"
                        >
                          TOTAL
                        </td>

                        <td className="border-r border-slate-800 px-3 py-3 text-right text-sm font-bold text-white">
                          {formatNumber(
                            totalTeaWeight
                          )}{" "}
                          <span className="text-[10px] font-normal text-slate-600">
                            kg
                          </span>
                        </td>

                        <td className="border-r border-slate-800 px-3 py-3 text-right text-sm font-bold text-white">
                          {formatNumber(
                            totalFactoryWeight
                          )}{" "}
                          <span className="text-[10px] font-normal text-slate-600">
                            kg
                          </span>
                        </td>

                        <td className="border-r border-slate-800 px-3 py-3 text-right">
                          <span
                            className={`text-sm font-bold ${
                              totalDifference >
                              0
                                ? "text-cyan-400"
                                : totalDifference <
                                    0
                                  ? "text-red-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {totalDifference >
                            0
                              ? "+"
                              : ""}
                            {formatNumber(
                              totalDifference
                            )}{" "}
                            <span className="text-[10px] font-normal text-slate-600">
                              kg
                            </span>
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center text-[10px] text-slate-600">
                          {filteredCollections.length}{" "}
                          records
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
        </main>
      </div>

      {/* ADD */}
      <CollectionModal
        isOpen={showAddModal}
        onClose={() =>
          setShowAddModal(false)
        }
        onCreated={handleCreated}
      />

      {/* EDIT */}
      {editingCollection && (
        <EditCollectionModal
          isOpen={true}
          collection={editingCollection}
          onClose={() =>
            setEditingCollection(null)
          }
          onUpdated={handleEdited}
        />
      )}
    </div>
  );
}

