"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Database,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import CollectionModal from "@/components/collections/CollectionModal";

import EditCollectionModal from "@/components/collections/EditCollectionModal";

interface Collection {
  _id: string;
  collectionId: string;
  date: string;
  areaId: string;
  areaName: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes?: string;
}

function formatDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatKg(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  );
}

export default function CollectionsPage() {
  const router = useRouter();

  const [
    collections,
    setCollections,
  ] = useState<
    Collection[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [
    editingCollection,
    setEditingCollection,
  ] = useState<
    Collection | null
  >(null);

  const [
    deletingCollection,
    setDeletingCollection,
  ] = useState<
    string | null
  >(null);

  const [error, setError] =
    useState("");

  /* =================================
     LOAD COLLECTIONS
  ================================= */

  async function fetchCollections() {
    try {
      setError("");

      const response =
        await fetch(
          "/api/collections",
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
            "Failed to load collections"
        );
      }

      setCollections(
        data.collections || []
      );
    } catch (error) {
      console.error(
        "FETCH COLLECTIONS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load collections"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  /* =================================
     REFRESH
  ================================= */

  async function handleRefresh() {
    setRefreshing(true);

    await fetchCollections();
  }

  /* =================================
     OPEN COLLECTION DETAILS
  ================================= */

  function handleOpenCollection(
    collectionId: string
  ) {
    router.push(
      `/collections/${encodeURIComponent(
        collectionId
      )}`
    );
  }

  /* =================================
     DELETE COLLECTION
  ================================= */

  async function handleDeleteCollection(
    collectionId: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this tea collection?\n\nThis action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCollection(
        collectionId
      );

      const response =
        await fetch(
          `/api/collections/${encodeURIComponent(
            collectionId
          )}`,
          {
            method: "DELETE",
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
            "Failed to delete collection"
        );
      }

      alert(
        "Collection deleted successfully!"
      );

      await fetchCollections();
    } catch (error) {
      console.error(
        "DELETE COLLECTION ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete collection"
      );
    } finally {
      setDeletingCollection(
        null
      );
    }
  }

  /* =================================
     TOTAL
  ================================= */

  const totalKg =
    collections.reduce(
      (sum, item) =>
        sum +
        Number(
          item.totalKg || 0
        ),
      0
    );

  return (
    <div className="min-h-screen bg-[#07100b] text-white">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================
            BACK BUTTON
        ================================= */}

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={17} />

          Back
        </button>

        {/* =================================
            HEADER
        ================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2 text-sm text-emerald-400">
              <Database size={16} />

              Cooroonduwatte Tea
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Tea Collections
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Daily tea collection by area
            </p>

          </div>

          <div className="flex gap-2">

            {/* Refresh */}

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* Add */}

            <button
              type="button"
              onClick={() =>
                setShowModal(true)
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold transition hover:bg-emerald-500"
            >
              <Plus size={18} />

              Add Collection
            </button>

          </div>

        </div>

        {/* =================================
            SUMMARY
        ================================= */}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

          <div className="rounded-xl border border-white/10 bg-[#0d1811] px-5 py-4">

            <p className="text-sm text-gray-400">
              Collection Records
            </p>

            <p className="mt-2 text-2xl font-bold">
              {collections.length}
            </p>

          </div>

          <div className="rounded-xl border border-white/10 bg-[#0d1811] px-5 py-4">

            <p className="text-sm text-gray-400">
              Total Tea KG
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {formatKg(
                totalKg
              )}{" "}
              KG
            </p>

          </div>

        </div>

        {/* =================================
            ERROR
        ================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* =================================
            LOADING
        ================================= */}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-[#0d1811] p-10 text-center text-gray-400">
            Loading collections...
          </div>
        ) : collections.length === 0 ? (

          /* =================================
             EMPTY
          ================================= */

          <div className="rounded-xl border border-dashed border-white/10 bg-[#0d1811] p-14 text-center">

            <Database
              size={38}
              className="mx-auto mb-4 text-gray-600"
            />

            <h2 className="font-semibold">
              No tea collections yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add the daily total tea collection for an area.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowModal(true)
              }
              className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-500"
            >
              <Plus size={18} />

              Add Collection
            </button>

          </div>

        ) : (

          /* =================================
             COLLECTION LIST
          ================================= */

          <div className="space-y-3">

            {collections.map(
              (
                collection
              ) => (

                <div
                  key={
                    collection.collectionId
                  }

                  onClick={() =>
                    handleOpenCollection(
                      collection.collectionId
                    )
                  }

                  className="cursor-pointer rounded-xl border border-white/10 bg-[#0d1811] px-4 py-4 transition hover:border-emerald-500/30 hover:bg-[#101c14]"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* =================================
                        LEFT
                    ================================= */}

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">

                        <Database
                          size={20}
                        />

                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="font-semibold text-white">
                            {
                              collection.areaName
                            }
                          </h2>

                          <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-500">
                            {
                              collection.areaId
                            }
                          </span>

                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">

                          <CalendarDays
                            size={14}
                          />

                          {formatDate(
                            collection.date
                          )}

                          <span>
                            •
                          </span>

                          {
                            collection.collectionId
                          }

                        </div>

                      </div>

                    </div>

                    {/* =================================
                        RIGHT
                    ================================= */}

                    <div className="flex flex-wrap items-center gap-5 lg:justify-end">

                      {/* Area Total */}

                      <div>

                        <p className="text-xs text-gray-500">
                          Area Total
                        </p>

                        <p className="mt-1 text-lg font-bold text-emerald-400">
                          {formatKg(
                            collection.totalKg
                          )}{" "}
                          KG
                        </p>

                      </div>

                      {/* Factory Weight */}

                      <div className="hidden sm:block">

                        <p className="text-xs text-gray-500">
                          Factory Weight
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-300">
                          {formatKg(
                            collection.factoryWeightKg
                          )}{" "}
                          KG
                        </p>

                      </div>

                      {/* =================================
                          EDIT
                      ================================= */}

                      <button
                        type="button"

                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          setEditingCollection(
                            collection
                          );
                        }}

                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                        title="Edit collection"
                      >
                        <Pencil
                          size={16}
                        />
                      </button>

                      {/* =================================
                          DELETE
                      ================================= */}

                      <button
                        type="button"

                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          handleDeleteCollection(
                            collection.collectionId
                          );
                        }}

                        disabled={
                          deletingCollection ===
                          collection.collectionId
                        }

                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"

                        title="Delete collection"
                      >

                        {deletingCollection ===
                        collection.collectionId ? (
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

                      {/* Arrow */}

                      <ArrowRight
                        size={18}
                        className="text-gray-600 transition group-hover:text-emerald-400"
                      />

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =================================
          ADD COLLECTION MODAL
      ================================= */}

      <CollectionModal
        isOpen={
          showModal
        }
        onClose={() =>
          setShowModal(false)
        }
        onAdded={
          fetchCollections
        }
      />

      {/* =================================
          EDIT COLLECTION MODAL
      ================================= */}

      <EditCollectionModal
        isOpen={
          !!editingCollection
        }
        collection={
          editingCollection
        }
        onClose={() =>
          setEditingCollection(
            null
          )
        }
        onUpdated={async () => {
          setEditingCollection(
            null
          );

          await fetchCollections();
        }}
      />

    </div>
  );
}