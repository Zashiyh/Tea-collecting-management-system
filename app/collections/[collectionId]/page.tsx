"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Database,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import SupplierContributionModal from "@/components/collections/SupplierContributionModal";

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

interface Contribution {
  _id: string;
  contributionId: string;
  date: string;
  areaId: string;
  areaName: string;
  supplierId: string;
  supplierName: string;
  weightKg: number;
  notes?: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatKg(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

export default function CollectionDetailsPage() {
  const router = useRouter();

  const params = useParams<{
    collectionId: string;
  }>();

  const rawCollectionId =
    params.collectionId;

  const collectionId = rawCollectionId
    ? decodeURIComponent(rawCollectionId)
    : "";

  const [collection, setCollection] =
    useState<Collection | null>(null);

  const [contributions, setContributions] =
    useState<Contribution[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showSupplierModal, setShowSupplierModal] =
    useState(false);

  /*
   * This stores the contribution currently
   * being edited.
   *
   * null = Add mode
   * contribution object = Edit mode
   */
  const [editingContribution, setEditingContribution] =
    useState<Contribution | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  async function fetchDetails() {
    if (!collectionId) {
      return;
    }

    try {
      setError("");

      const collectionResponse =
        await fetch(
          `/api/collections/${encodeURIComponent(
            collectionId
          )}`,
          {
            cache: "no-store",
          }
        );

      const collectionData =
        await collectionResponse.json();

      if (
        !collectionResponse.ok ||
        !collectionData.success
      ) {
        throw new Error(
          collectionData.message ||
            "Failed to load collection"
        );
      }

      const suppliersResponse =
        await fetch(
          `/api/collections/${encodeURIComponent(
            collectionId
          )}/suppliers`,
          {
            cache: "no-store",
          }
        );

      const suppliersData =
        await suppliersResponse.json();

      if (
        !suppliersResponse.ok ||
        !suppliersData.success
      ) {
        throw new Error(
          suppliersData.message ||
            "Failed to load supplier contributions"
        );
      }

      setCollection(
        collectionData.collection
      );

      setContributions(
        suppliersData.contributions || []
      );
    } catch (error) {
      console.error(
        "LOAD COLLECTION DETAILS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load collection"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!collectionId) {
      return;
    }

    fetchDetails();
  }, [collectionId]);

  /*
   * ADD SUPPLIER
   */
  function handleAddSupplier() {
    setEditingContribution(null);
    setShowSupplierModal(true);
  }

  /*
   * EDIT SUPPLIER
   */
  function handleEditContribution(
    contribution: Contribution
  ) {
    console.log(
      "EDIT CONTRIBUTION:",
      contribution
    );

    setEditingContribution(
      contribution
    );

    setShowSupplierModal(true);
  }

  /*
   * CLOSE MODAL
   */
  function handleCloseSupplierModal() {
    setShowSupplierModal(false);

    setEditingContribution(null);
  }

  /*
   * DELETE SUPPLIER CONTRIBUTION
   */
  async function handleDeleteContribution(
    contributionId: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this supplier tea contribution?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        contributionId
      );

      const response =
        await fetch(
          `/api/collections/${encodeURIComponent(
            collectionId
          )}/suppliers/${encodeURIComponent(
            contributionId
          )}`,
          {
            method: "DELETE",
            cache: "no-store",
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
            "Failed to delete contribution"
        );
      }

      await fetchDetails();
    } catch (error) {
      console.error(
        "DELETE CONTRIBUTION ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete contribution"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const areaTotal = Number(
    collection?.totalKg || 0
  );

  const supplierTotal =
    contributions.reduce(
      (sum, item) =>
        sum +
        Number(
          item.weightKg || 0
        ),
      0
    );

  const difference =
    areaTotal - supplierTotal;

  const status =
    difference === 0
      ? "Matched"
      : difference > 0
      ? "Remaining"
      : "Over";

  const statusText =
    status === "Matched"
      ? "Matched"
      : status === "Remaining"
      ? `${formatKg(
          difference
        )} KG Remaining`
      : `${formatKg(
          Math.abs(difference)
        )} KG Over`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07100b] px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-white/10 bg-[#0d1811] p-10 text-center text-gray-400">
            Loading collection...
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#07100b] px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error ||
              "Collection not found"}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07100b] text-white">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Back */}

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* Header */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2 text-sm text-emerald-400">
              <Database size={16} />
              Cooroonduwatte Tea
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              {collection.areaName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <CalendarDays size={15} />

              {formatDate(
                collection.date
              )}

              <span>
                •
              </span>

              {collection.collectionId}
            </div>

          </div>

          {/* Add Supplier */}

          <button
            type="button"
            onClick={
              handleAddSupplier
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold transition hover:bg-emerald-500"
          >
            <Plus size={18} />
            Add Supplier
          </button>

        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Summary */}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-white/10 bg-[#0d1811] px-5 py-4">

            <p className="text-sm text-gray-400">
              Area Total
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {formatKg(
                areaTotal
              )}{" "}
              KG
            </p>

          </div>

          <div className="rounded-xl border border-white/10 bg-[#0d1811] px-5 py-4">

            <p className="text-sm text-gray-400">
              Supplier Total
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {formatKg(
                supplierTotal
              )}{" "}
              KG
            </p>

          </div>

          <div className="rounded-xl border border-white/10 bg-[#0d1811] px-5 py-4">

            <p className="text-sm text-gray-400">
              Status
            </p>

            <p
              className={`mt-2 text-lg font-bold ${
                status ===
                "Matched"
                  ? "text-emerald-400"
                  : status ===
                    "Remaining"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {statusText}
            </p>

          </div>

        </div>

        {/* Supplier Contributions */}

        <div className="rounded-xl border border-white/10 bg-[#0d1811]">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

            <div>

              <h2 className="font-semibold text-white">
                Supplier Contributions
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Tea received from suppliers
                in this area
              </p>

            </div>

            <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400">
              {
                contributions.length
              }{" "}
              Suppliers
            </span>

          </div>

          {contributions.length ===
          0 ? (

            <div className="px-5 py-12 text-center">

              <Database
                size={34}
                className="mx-auto mb-3 text-gray-600"
              />

              <h3 className="font-medium text-gray-300">
                No supplier contributions
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add supplier tea KG to
                this area collection.
              </p>

              <button
                type="button"
                onClick={
                  handleAddSupplier
                }
                className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500"
              >
                <Plus size={17} />
                Add Supplier
              </button>

            </div>

          ) : (

            <div className="divide-y divide-white/5">

              {contributions.map(
                (
                  contribution
                ) => (

                  <div
                    key={
                      contribution.contributionId
                    }
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  >

                    {/* Supplier */}

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Database
                          size={18}
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="font-medium text-white">
                          {
                            contribution.supplierName
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-500">

                          {
                            contribution.supplierId
                          }

                          <span className="mx-2">
                            •
                          </span>

                          {
                            contribution.contributionId
                          }

                        </p>

                      </div>

                    </div>

                    {/* Actions */}

                    <div className="flex items-center gap-4">

                      <div className="text-right">

                        <p className="text-xs text-gray-500">
                          Tea KG
                        </p>

                        <p className="mt-1 text-lg font-bold text-emerald-400">
                          {formatKg(
                            contribution.weightKg
                          )}{" "}
                          KG
                        </p>

                      </div>

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          handleEditContribution(
                            contribution
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                        title="Edit contribution"
                      >
                        <Pencil
                          size={15}
                        />
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteContribution(
                            contribution.contributionId
                          )
                        }
                        disabled={
                          deletingId ===
                          contribution.contributionId
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        title="Delete contribution"
                      >
                        {deletingId ===
                        contribution.contributionId ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={15}
                          />
                        )}
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

      {/* SUPPLIER MODAL */}

      <SupplierContributionModal
        isOpen={
          showSupplierModal
        }
        collectionId={
          collection.collectionId
        }
        areaId={
          collection.areaId
        }
        areaName={
          collection.areaName
        }
        date={
          collection.date
        }
        editContribution={
          editingContribution
        }
        onClose={
          handleCloseSupplierModal
        }
        onAdded={async () => {
          await fetchDetails();
        }}
      />

    </div>
  );
}