"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Database,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

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
  createdAt?: string;
  updatedAt?: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] =
    useState<Collection[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [
    editingCollection,
    setEditingCollection,
  ] = useState<Collection | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  /* =====================================================
     LOAD COLLECTIONS
  ===================================================== */

  const loadCollections = useCallback(
    async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/collections",
          {
            cache: "no-store",
          }
        );

        const text =
          await response.text();

        let data: {
          success?: boolean;
          message?: string;
          collections?: Collection[];
        } = {};

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
              "Failed to load collections"
          );
        }

        setCollections(
          data.collections || []
        );
      } catch (error) {
        console.error(
          "LOAD COLLECTIONS ERROR:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to load collections"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  function formatDate(
    value: string
  ) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /* =====================================================
     FORMAT NUMBER
  ===================================================== */

  function formatNumber(
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

  /* =====================================================
     ADD SUCCESS
  ===================================================== */

  async function handleCreated() {
    setShowAddModal(false);

    await loadCollections();
  }

  /* =====================================================
     EDIT SUCCESS
  ===================================================== */

  async function handleEdited() {
    setEditingCollection(null);

    await loadCollections();
  }

  /* =====================================================
     DELETE COLLECTION
  ===================================================== */

  async function handleDelete(
    collection: Collection
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete the collection for ${collection.areaName} on ${formatDate(
          collection.date
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        collection.collectionId
      );

      const response =
        await fetch(
          `/api/collections/${encodeURIComponent(
            collection.collectionId
          )}`,
          {
            method: "DELETE",
          }
        );

      const text =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete collection"
        );
      }

      /* --------------------------------
         Remove immediately from UI
      -------------------------------- */

      setCollections(
        (current) =>
          current.filter(
            (item) =>
              item.collectionId !==
              collection.collectionId
          )
      );

      /* --------------------------------
         Sync with database
      -------------------------------- */

      await loadCollections();
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
      setDeletingId(null);
    }
  }

  /* =====================================================
     EDIT COLLECTION
  ===================================================== */

  function handleEdit(
    collection: Collection
  ) {
    setEditingCollection(
      collection
    );
  }

  /* =====================================================
     CLOSE EDIT
  ===================================================== */

  function handleCloseEdit() {
    setEditingCollection(null);
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#020a06] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              Cooroonduwatte Tea
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Tea Collections
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage daily area tea collections
            </p>
          </div>

          <div className="flex items-center gap-2">

            {/* Refresh */}

            <button
              type="button"
              onClick={loadCollections}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-4 text-sm font-medium text-slate-300 transition hover:border-emerald-500/30 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            {/* Add Collection */}

            <button
              type="button"
              onClick={() =>
                setShowAddModal(true)
              }
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              <Plus size={17} />

              Add Collection
            </button>
          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        {!loading &&
          collections.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Collection Count */}

              <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Database size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Collections
                    </p>

                    <p className="mt-1 text-xl font-bold text-white">
                      {collections.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tea Weight */}

              <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                <p className="text-xs text-slate-500">
                  Total Field Weight
                </p>

                <p className="mt-2 text-xl font-bold text-white">
                  {formatNumber(
                    collections.reduce(
                      (
                        total,
                        item
                      ) =>
                        total +
                        Number(
                          item.totalKg ||
                            0
                        ),
                      0
                    )
                  )}{" "}
                  KG
                </p>
              </div>

              {/* Factory Weight */}

              <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                <p className="text-xs text-slate-500">
                  Total Factory Weight
                </p>

                <p className="mt-2 text-xl font-bold text-emerald-400">
                  {formatNumber(
                    collections.reduce(
                      (
                        total,
                        item
                      ) =>
                        total +
                        Number(
                          item.factoryWeightKg ||
                            0
                        ),
                      0
                    )
                  )}{" "}
                  KG
                </p>
              </div>
            </div>
          )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-12 text-center">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-emerald-400"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading collections...
            </p>
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          collections.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Database size={26} />
              </div>

              <h3 className="mt-4 font-semibold text-white">
                No collections found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add your first tea collection.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowAddModal(true)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
              >
                <Plus size={17} />

                Add Collection
              </button>
            </div>
          )}

        {/* =================================================
            COLLECTION CARDS
        ================================================= */}

        {!loading &&
          collections.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {collections.map(
                (collection) => {
                  const difference =
                    Number(
                      collection.differenceKg ||
                        0
                    );

                  return (
                    <div
                      key={
                        collection.collectionId
                      }
                      className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] transition duration-200 hover:-translate-y-1 hover:border-emerald-500/30"
                    >

                      {/* =================================================
                          CARD HEADER
                      ================================================= */}

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="text-xs font-medium text-emerald-400">
                              {
                                collection.collectionId
                              }
                            </p>

                            <h3 className="mt-1 truncate font-semibold text-white">
                              {
                                collection.areaName
                              }
                            </h3>

                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                              <CalendarDays
                                size={14}
                              />

                              <span>
                                {formatDate(
                                  collection.date
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}

                          <div className="flex items-center gap-1">

                            {/* Edit */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  collection
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-400"
                              title="Edit collection"
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            {/* Delete */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  collection
                                )
                              }
                              disabled={
                                deletingId ===
                                collection.collectionId
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete collection"
                            >
                              {deletingId ===
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
                          </div>
                        </div>

                        {/* =================================================
                            WEIGHTS
                        ================================================= */}

                        <div className="mt-5 grid grid-cols-2 gap-3">

                          {/* Tea Weight */}

                          <div className="rounded-xl bg-slate-900/50 p-3">
                            <p className="text-xs text-slate-500">
                              Field Weight
                            </p>

                            <p className="mt-1 text-lg font-bold text-white">
                              {formatNumber(
                                collection.totalKg
                              )}{" "}
                              <span className="text-xs font-medium text-slate-500">
                                KG
                              </span>
                            </p>
                          </div>

                          {/* Factory Weight */}

                          <div className="rounded-xl bg-slate-900/50 p-3">
                            <p className="text-xs text-slate-500">
                              Factory Weight
                            </p>

                            <p className="mt-1 text-lg font-bold text-emerald-400">
                              {formatNumber(
                                collection.factoryWeightKg
                              )}{" "}
                              <span className="text-xs font-medium text-slate-500">
                                KG
                              </span>
                            </p>
                          </div>

                        </div>

                        {/* =================================================
                            DIFFERENCE
                        ================================================= */}

                        <div className="mt-3 rounded-xl bg-slate-900/50 p-3">

                          <div className="flex items-center justify-between gap-3">

                            <div>
                              <p className="text-xs text-slate-500">
                                Difference
                              </p>

                              <p className="mt-1 text-xs text-slate-600">
                                Field Weight − Factory Weight
                              </p>
                            </div>

                            <p
                              className={`text-lg font-bold ${
                                difference > 0
                                  ? "text-amber-400"
                                  : difference < 0
                                    ? "text-red-400"
                                    : "text-emerald-400"
                              }`}
                            >
                              {difference > 0
                                ? "+"
                                : ""}
                              {formatNumber(
                                difference
                              )}{" "}
                              KG
                            </p>
                          </div>
                        </div>

                        {/* Notes */}

                        {collection.notes && (
                          <div className="mt-3 rounded-xl bg-slate-900/30 p-3">
                            <p className="text-xs text-slate-500">
                              Notes
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                              {
                                collection.notes
                              }
                            </p>
                          </div>
                        )}

                      </div>

                      {/* =================================================
                          VIEW COLLECTION
                      ================================================= */}

                      <Link
                        href={`/collections/${encodeURIComponent(
                          collection.collectionId
                        )}`}
                        className="flex w-full items-center justify-between border-t border-slate-800 bg-slate-900/20 px-5 py-3.5 text-sm font-medium text-slate-400 transition hover:bg-emerald-500/5 hover:text-emerald-400"
                      >
                        <span>
                          View Collection
                        </span>

                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </Link>
                    </div>
                  );
                }
              )}
            </div>
          )}
      </div>

      {/* ===================================================
          ADD COLLECTION MODAL
      =================================================== */}

      <CollectionModal
        isOpen={showAddModal}
        onClose={() =>
          setShowAddModal(false)
        }
        onCreated={
          handleCreated
        }
      />

      {/* ===================================================
          EDIT COLLECTION MODAL
      =================================================== */}

      {editingCollection && (
        <EditCollectionModal
          isOpen={true}
          collection={
            editingCollection
          }
          onClose={
            handleCloseEdit
          }
          onUpdated={
            handleEdited
          }
        />
      )}
    </main>
  );
}