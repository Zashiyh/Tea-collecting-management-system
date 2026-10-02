"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Scale,
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
}

interface CollectionsResponse {
  success: boolean;
  message?: string;
  collections: Collection[];
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

export default function CollectionsPage() {
  const [collections, setCollections] =
    useState<Collection[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [editingCollection, setEditingCollection] =
    useState<Collection | null>(null);

  async function loadCollections() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/collections",
        {
          cache: "no-store",
        }
      );

      const text =
        await response.text();

      let data: CollectionsResponse;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load collections"
        );
      }

      /*
       * IMPORTANT
       *
       * Always calculate Difference here again.
       *
       * Difference =
       * Factory Weight - Tea Weight
       *
       * Example:
       * Factory 50,000
       * Tea     40,000
       * Difference +10,000
       *
       * Example:
       * Factory 40,000
       * Tea     50,000
       * Difference -10,000
       */
      const fixedCollections =
        (data.collections || []).map(
          (collection) => {
            const teaWeight =
              Number(
                collection.totalKg || 0
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

            return {
              ...collection,
              totalKg: teaWeight,
              factoryWeightKg:
                factoryWeight,
              differenceKg:
                difference,
            };
          }
        );

      setCollections(
        fixedCollections
      );
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

  useEffect(() => {
    loadCollections();
  }, []);

  function handleCreated() {
    setShowAddModal(false);
    loadCollections();
  }

  function handleEdited() {
    setEditingCollection(null);
    loadCollections();
  }

  async function handleDelete(
    collectionId: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this collection?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/collections/${encodeURIComponent(
            collectionId
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
      };

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
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

  const totalTeaWeight =
    collections.reduce(
      (total, collection) =>
        total +
        Number(
          collection.totalKg || 0
        ),
      0
    );

  const totalFactoryWeight =
    collections.reduce(
      (total, collection) =>
        total +
        Number(
          collection.factoryWeightKg ||
            0
        ),
      0
    );

  /*
   * IMPORTANT
   *
   * Do NOT use:
   *
   * totalTeaWeight - totalFactoryWeight
   *
   * Correct:
   *
   * totalFactoryWeight - totalTeaWeight
   */
  const totalDifference =
    Number(
      (
        totalFactoryWeight -
        totalTeaWeight
      ).toFixed(2)
    );

  return (
    <div className="min-h-screen bg-[#07130d] text-white">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
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
              onClick={loadCollections}
              className="inline-flex items-center gap-2 rounded-xl border border-[#284635] bg-[#102218] px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-[#16301f]"
            >
              <RefreshCw
                size={17}
                className={
                  loading
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f8f4d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#25a657]"
            >
              <Plus size={18} />
              Add Collection
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5">
            <p className="text-sm text-gray-400">
              Collections
            </p>

            <p className="mt-2 text-2xl font-bold">
              {collections.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5">
            <p className="text-sm text-gray-400">
              Total Tea / Field Weight
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatNumber(
                totalTeaWeight
              )}{" "}
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
              {formatNumber(
                totalFactoryWeight
              )}{" "}
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
              {totalDifference > 0
                ? "+"
                : ""}
              {formatNumber(
                totalDifference
              )}{" "}
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
          collections.length === 0 &&
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
                Add your first tea collection.
              </p>
            </div>
          )}

        {/* Collections */}
        {!loading &&
          collections.length > 0 && (
            <div className="space-y-4">
              {collections.map(
                (collection) => {
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

                  /*
                   * IMPORTANT:
                   *
                   * Factory - Tea
                   */
                  const difference =
                    Number(
                      (
                        factoryWeight -
                        teaWeight
                      ).toFixed(2)
                    );

                  return (
                    <div
                      key={
                        collection.collectionId
                      }
                      className="rounded-2xl border border-[#203b2b] bg-[#0c1d13] p-5 transition hover:border-[#31563f]"
                    >
                      {/* Top */}
                      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-semibold">
                              {
                                collection.areaName
                              }
                            </h2>

                            <span className="rounded-lg bg-[#173421] px-2.5 py-1 text-xs text-green-300">
                              {
                                collection.collectionId
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-500">
                            {formatDate(
                              collection.date
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/collections/${encodeURIComponent(
                              collection.collectionId
                            )}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#294936] bg-[#112519] px-3 py-2 text-sm text-gray-200 transition hover:bg-[#183421]"
                          >
                            <Eye
                              size={16}
                            />
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
                            <Pencil
                              size={16}
                            />
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
                            <Trash2
                              size={16}
                            />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Weights */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Tea */}
                        <div className="rounded-xl border border-[#1e3929] bg-[#09180f] p-4">
                          <p className="text-xs text-gray-500">
                            Tea / Field Weight
                          </p>

                          <p className="mt-2 text-xl font-bold">
                            {formatNumber(
                              teaWeight
                            )}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              kg
                            </span>
                          </p>
                        </div>

                        {/* Factory */}
                        <div className="rounded-xl border border-[#1e3929] bg-[#09180f] p-4">
                          <p className="text-xs text-gray-500">
                            Factory Weight
                          </p>

                          <p className="mt-2 text-xl font-bold">
                            {formatNumber(
                              factoryWeight
                            )}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              kg
                            </span>
                          </p>
                        </div>

                        {/* Difference */}
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
                            {formatNumber(
                              difference
                            )}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              kg
                            </span>
                          </p>

                          <p className="mt-1 text-xs text-gray-600">
                            Factory weight − tea
                            weight
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
                            {
                              collection.notes
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
      </div>

      {/* Add */}
      <CollectionModal
        isOpen={showAddModal}
        onClose={() =>
          setShowAddModal(false)
        }
        onCreated={handleCreated}
      />

      {/* Edit */}
      {editingCollection && (
        <EditCollectionModal
          isOpen={true}
          collection={
            editingCollection
          }
          onClose={() =>
            setEditingCollection(null)
          }
          onUpdated={
            handleEdited
          }
        />
      )}
    </div>
  );
}