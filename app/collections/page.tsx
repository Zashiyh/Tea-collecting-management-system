"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Leaf,
  Plus,
  Search,
  Wallet,
  Scale,
  Users,
  RefreshCw,
} from "lucide-react";

import CollectionModal from "@/components/collections/CollectionModal";

interface Collection {
  _id: string;
  collectionId: string;
  date: string;
  areaId: string;
  areaName: string;
  supplierId: string;
  supplierName: string;
  weightKg: number;
  ratePerKg: number;
  totalAmount: number;
  notes?: string;
}

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<
    Collection[]
  >([]);

  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedDate, setSelectedDate] =
    useState(getTodayDate());

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function fetchCollections() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/collections?date=${encodeURIComponent(
          selectedDate
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch collections"
        );
      }

      setCollections(data.collections || []);
    } catch (error) {
      console.error(
        "Fetch collections error:",
        error
      );

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
    fetchCollections();
  }, [selectedDate]);

  const filteredCollections = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return collections;
    }

    return collections.filter((collection) => {
      return (
        collection.supplierName
          .toLowerCase()
          .includes(query) ||
        collection.supplierId
          .toLowerCase()
          .includes(query) ||
        collection.collectionId
          .toLowerCase()
          .includes(query) ||
        collection.areaName
          .toLowerCase()
          .includes(query)
      );
    });
  }, [collections, search]);

  const totalKg = filteredCollections.reduce(
    (sum, collection) =>
      sum + Number(collection.weightKg || 0),
    0
  );

  const totalAmount = filteredCollections.reduce(
    (sum, collection) =>
      sum + Number(collection.totalAmount || 0),
    0
  );

  const averageRate =
    totalKg > 0 ? totalAmount / totalKg : 0;

  const formattedDate = new Date(
    `${selectedDate}T00:00:00`
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-600/10 p-3 text-emerald-400">
                  <Leaf size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Tea Collections
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Record and monitor daily tea leaf
                    collections.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-500"
            >
              <Plus size={18} />
              Add Collection
            </button>
          </div>

          {/* Date + Search */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="rounded-xl border border-slate-800 bg-[#07140d] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-emerald-600"
              />
            </div>

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search supplier, area or collection ID..."
                className="w-full rounded-xl border border-slate-800 bg-[#07140d] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-600"
              />
            </div>

            <button
              type="button"
              onClick={fetchCollections}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              <Download size={17} />
              Export
            </button>
          </div>

          {/* Selected Date */}
          <div className="mb-5">
            <p className="text-sm text-slate-500">
              Collection for
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {formattedDate}
            </h2>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>

              <button
                type="button"
                onClick={fetchCollections}
                className="rounded-lg border border-red-500/20 px-3 py-2 text-red-300 transition hover:bg-red-500/10"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Total KG */}
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Total Collection
                </p>

                <div className="rounded-xl bg-emerald-600/10 p-2.5 text-emerald-400">
                  <Scale size={20} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-white">
                {totalKg.toLocaleString()} KG
              </p>
            </div>

            {/* Suppliers */}
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Suppliers
                </p>

                <div className="rounded-xl bg-emerald-600/10 p-2.5 text-emerald-400">
                  <Users size={20} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-white">
                {filteredCollections.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Collection records
              </p>
            </div>

            {/* Average Rate */}
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Average Rate
                </p>

                <div className="rounded-xl bg-emerald-600/10 p-2.5 text-emerald-400">
                  <Wallet size={20} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-white">
                Rs.{" "}
                {averageRate.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                per KG
              </p>
            </div>

            {/* Total Value */}
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Total Value
                </p>

                <div className="rounded-xl bg-emerald-600/10 p-2.5 text-emerald-400">
                  <Wallet size={20} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-emerald-400">
                Rs.{" "}
                {totalAmount.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d]">
            <div className="border-b border-slate-800 p-5">
              <h2 className="font-semibold text-white">
                Daily Collection Records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredCollections.length} records for{" "}
                {formattedDate}
              </p>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw
                  size={30}
                  className="mx-auto animate-spin text-emerald-500"
                />

                <p className="mt-4 text-sm text-slate-500">
                  Loading collection records...
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4 font-medium">
                          Collection ID
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Area
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Supplier
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Weight
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Rate / KG
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Total
                        </th>

                        <th className="px-5 py-4 font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCollections.map(
                        (collection) => (
                          <tr
                            key={collection._id}
                            className="border-b border-slate-800/70 transition hover:bg-slate-900/40"
                          >
                            {/* ID */}
                            <td className="px-5 py-4">
                              <span className="rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-400">
                                {collection.collectionId}
                              </span>
                            </td>

                            {/* Area */}
                            <td className="px-5 py-4">
                              <p className="font-medium text-emerald-400">
                                {collection.areaName}
                              </p>

                              <p className="mt-1 text-xs text-slate-600">
                                {collection.areaId}
                              </p>
                            </td>

                            {/* Supplier */}
                            <td className="px-5 py-4">
                              <p className="font-medium text-white">
                                {collection.supplierName}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {collection.supplierId}
                              </p>
                            </td>

                            {/* Weight */}
                            <td className="px-5 py-4 font-semibold text-white">
                              {Number(
                                collection.weightKg
                              ).toLocaleString()}{" "}
                              KG
                            </td>

                            {/* Rate */}
                            <td className="px-5 py-4 text-slate-400">
                              Rs.{" "}
                              {Number(
                                collection.ratePerKg
                              ).toLocaleString()}
                            </td>

                            {/* Total */}
                            <td className="px-5 py-4 font-semibold text-emerald-400">
                              Rs.{" "}
                              {Number(
                                collection.totalAmount
                              ).toLocaleString("en-LK", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            {/* Date */}
                            <td className="px-5 py-4 text-slate-400">
                              {new Date(
                                `${selectedDate}T00:00:00`
                              ).toLocaleDateString(
                                "en-GB"
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredCollections.length === 0 && (
                  <div className="py-16 text-center">
                    <Leaf
                      size={32}
                      className="mx-auto text-slate-700"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      No collection records found for{" "}
                      {formattedDate}.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setModalOpen(true)
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                    >
                      <Plus size={17} />
                      Add Collection
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Add Collection Modal */}
      <CollectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          fetchCollections();
        }}
      />
    </div>
  );
}