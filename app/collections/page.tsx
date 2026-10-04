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

  // Dashboard mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

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

  useEffect(() => {
    loadCollections();
    loadAreas();
  }, []);

  function handleCreated() {
    setShowAddModal(false);
    loadCollections();
  }

  function handleEdited() {
    setEditingCollection(null);
    loadCollections();
  }

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
          data.message || "Failed to delete collection"
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

  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      const matchesDate =
        !selectedDate ||
        getSriLankaDate(collection.date) === selectedDate;

      const matchesArea =
        !selectedAreaId ||
        collection.areaId === selectedAreaId;

      return matchesDate && matchesArea;
    });
  }, [collections, selectedDate, selectedAreaId]);

  const totalTeaWeight = filteredCollections.reduce(
    (total, collection) =>
      total + Number(collection.totalKg || 0),
    0
  );

  const totalFactoryWeight = filteredCollections.reduce(
    (total, collection) =>
      total + Number(collection.factoryWeightKg || 0),
    0
  );

  const totalDifference = Number(
    (totalFactoryWeight - totalTeaWeight).toFixed(2)
  );

  const hasActiveFilter =
    selectedDate !== "" || selectedAreaId !== "";

  function clearFilters() {
    setSelectedDate("");
    setSelectedAreaId("");
  }

  return (
    <div className="min-h-screen bg-[#07130d] text-white">
      {/* Dashboard Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Dashboard Header */}
        <Header
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/dashboard"
                className="mb-3 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </Link>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Tea Collections
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Manage daily tea collections
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  loadCollections();
                  loadAreas();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#284635] bg-[#102218] px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-[#16301f]"
              >
                <RefreshCw
                  size={17}
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
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f8f4d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#25a657]"
              >
                <Plus size={18} />
                Add Collection
              </button>
            </div>
          </div>

          {/* Main Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Areas Error */}
          {areasError && (
            <div className="mb-6 rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-4 text-sm text-yellow-300">
              {areasError}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label
                htmlFor="collection-date"
                className="mb-1.5 block text-xs font-medium text-gray-500"
              >
                Date
              </label>

              <input
                id="collection-date"
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-[#294936] bg-[#09180f] px-3 text-sm text-white outline-none transition focus:border-green-500 sm:w-[190px]"
              />
            </div>

            <div>
              <label
                htmlFor="collection-area"
                className="mb-1.5 block text-xs font-medium text-gray-500"
              >
                Area
              </label>

              <select
                id="collection-area"
                value={selectedAreaId}
                onChange={(event) =>
                  setSelectedAreaId(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-[#294936] bg-[#09180f] px-3 text-sm text-white outline-none transition focus:border-green-500 sm:w-[220px]"
              >
                <option value="">All Areas</option>

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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#294936] bg-[#112519] px-4 text-sm text-gray-300 transition hover:bg-[#183421]"
              >
                <X size={16} />
                Clear
              </button>
            )}

            <div className="flex h-11 items-center text-sm text-gray-500 sm:ml-2">
              Showing{" "}
              <span className="ml-1 font-semibold text-green-400">
                {filteredCollections.length}
              </span>

              <span className="ml-1">
                collection
                {filteredCollections.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5">
              <p className="text-sm text-gray-400">
                Collections
              </p>

              <p className="mt-2 text-2xl font-bold">
                {filteredCollections.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5">
              <p className="text-sm text-gray-400">
                Total Tea / Field Weight
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(totalTeaWeight)}{" "}
                <span className="text-sm font-normal text-gray-400">
                  kg
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5">
              <p className="text-sm text-gray-400">
                Total Factory Weight
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(totalFactoryWeight)}{" "}
                <span className="text-sm font-normal text-gray-400">
                  kg
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5">
              <p className="text-sm text-gray-400">
                Difference
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  totalDifference > 0
                    ? "text-cyan-400"
                    : totalDifference < 0
                      ? "text-red-400"
                      : "text-green-400"
                }`}
              >
                {totalDifference > 0 ? "+" : ""}
                {formatNumber(totalDifference)}{" "}
                <span className="text-sm font-normal text-gray-400">
                  kg
                </span>
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Factory weight − tea weight
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-10 text-center text-gray-400">
              Loading collections...
            </div>
          )}

          {/* Empty */}
          {!loading &&
            filteredCollections.length === 0 &&
            !error && (
              <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-10 text-center">
                <Scale
                  size={42}
                  className="mx-auto mb-4 text-gray-500"
                />

                <h2 className="text-lg font-semibold">
                  No collections found
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {hasActiveFilter
                    ? "No collections match the selected filters."
                    : "Add your first tea collection."}
                </p>

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f8f4d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#25a657]"
                  >
                    <X size={16} />
                    Clear Filters
                  </button>
                )}
              </div>
            )}

          {/* Collections */}
          {!loading &&
            filteredCollections.length > 0 && (
              <div className="space-y-4">
                {filteredCollections.map((collection) => {
                  const teaWeight = Number(
                    collection.totalKg || 0
                  );

                  const factoryWeight = Number(
                    collection.factoryWeightKg || 0
                  );

                  const difference = Number(
                    (
                      factoryWeight -
                      teaWeight
                    ).toFixed(2)
                  );

                  return (
                    <div
                      key={collection.collectionId}
                      className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5 transition hover:border-[#31563f]"
                    >
                      {/* Collection Header */}
                      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-semibold">
                              {collection.areaName}
                            </h2>

                            <span className="rounded-lg bg-[#173421] px-2.5 py-1 text-xs text-green-300">
                              {collection.collectionId}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-500">
                            {formatDate(collection.date)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/collections/${encodeURIComponent(
                              collection.collectionId
                            )}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#294936] bg-[#112519] px-3 py-2 text-sm text-gray-200 transition hover:bg-[#183421]"
                          >
                            <Eye size={16} />
                            View Collection
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setEditingCollection(
                                collection
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-[#294936] bg-[#112519] px-3 py-2 text-sm text-gray-200 transition hover:bg-[#183421]"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                collection.collectionId
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950/40"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Weight Details */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-[#1e3929] bg-[#09180f] p-4">
                          <p className="text-xs text-gray-500">
                            Tea / Field Weight
                          </p>

                          <p className="mt-2 text-xl font-bold">
                            {formatNumber(teaWeight)}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              kg
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#1e3929] bg-[#09180f] p-4">
                          <p className="text-xs text-gray-500">
                            Factory Weight
                          </p>

                          <p className="mt-2 text-xl font-bold">
                            {formatNumber(factoryWeight)}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              kg
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#1e3929] bg-[#09180f] p-4">
                          <p className="text-xs text-gray-500">
                            Difference
                          </p>

                          <p
                            className={`mt-2 text-xl font-bold ${
                              difference > 0
                                ? "text-cyan-400"
                                : difference < 0
                                  ? "text-red-400"
                                  : "text-green-400"
                            }`}
                          >
                            {difference > 0
                              ? "+"
                              : ""}
                            {formatNumber(difference)}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              kg
                            </span>
                          </p>

                          <p className="mt-1 text-xs text-gray-600">
                            Factory weight − tea weight
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {collection.notes && (
                        <div className="mt-4 rounded-xl border border-[#1e3929] bg-[#09180f] p-4">
                          <p className="text-xs text-gray-500">
                            Notes
                          </p>

                          <p className="mt-1 text-sm text-gray-300">
                            {collection.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </main>
      </div>

      {/* Add Collection Modal */}
      <CollectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />

      {/* Edit Collection Modal */}
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