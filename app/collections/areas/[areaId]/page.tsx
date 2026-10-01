"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Leaf,
  Phone,
  RefreshCw,
  Users,
  Wallet,
  Weight,
} from "lucide-react";

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

interface Supplier {
  supplierId: string;
  name: string;
  phone: string;
  village: string;
  address: string;
  status: string;
  totalKg: number;
  totalValue: number;
  collectionCount: number;
  collections: Collection[];
}

interface Area {
  areaId: string;
  name: string;
  description: string;
  status: string;
}

interface Summary {
  supplierCount: number;
  totalKg: number;
  totalValue: number;
  collectionCount: number;
}

interface AreaResponse {
  success: boolean;
  area: Area;
  summary: Summary;
  suppliers: Supplier[];
  message?: string;
}

interface PageProps {
  params: Promise<{
    areaId: string;
  }>;
}

export default function AreaCollectionsPage({
  params,
}: PageProps) {
  const [areaId, setAreaId] = useState("");
  const [data, setData] = useState<AreaResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [openSupplier, setOpenSupplier] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setAreaId(resolvedParams.areaId);
    }

    loadParams();
  }, [params]);

  async function fetchArea(
    currentAreaId: string,
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `/api/collections/areas/${currentAreaId}`,
        {
          cache: "no-store",
        }
      );

      const text = await response.text();

      let result: AreaResponse;

      try {
        result = JSON.parse(text);
      } catch {
        console.error("API Response:", text);

        throw new Error(
          `Area API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load area details"
        );
      }

      setData(result);
    } catch (error) {
      console.error("Area details error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load area details"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!areaId) return;

    fetchArea(areaId);
  }, [areaId]);

  function formatNumber(value: number) {
    return new Intl.NumberFormat("en-LK").format(value || 0);
  }

  function formatCurrency(value: number) {
    return `Rs. ${formatNumber(value)}`;
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatTime(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function toggleSupplier(supplierId: string) {
    setOpenSupplier((current) =>
      current === supplierId ? null : supplierId
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020b06] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-emerald-400"
            />

            <p className="mt-3 text-sm text-gray-500">
              Loading area details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#020b06] text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
          <div className="w-full rounded-xl border border-red-500/20 bg-[#07140e] p-6 text-center">
            <p className="text-red-400">
              {error || "Area not found"}
            </p>

            <Link
              href="/collections"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
            >
              <ArrowLeft size={16} />
              Back to Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { area, summary, suppliers } = data;

  return (
    <div className="min-h-screen bg-[#020b06] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#07140e]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400">
              Cooroonduwatte Tea
            </p>

            <h1 className="mt-1 text-lg font-semibold">
              Area Collection Details
            </h1>
          </div>

          <button
            onClick={() => fetchArea(areaId, true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/collections"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-emerald-400"
        >
          <ArrowLeft size={16} />
          Back to Collections
        </Link>

        {/* Area Title */}
        <div className="rounded-xl border border-white/10 bg-[#07140e]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <Leaf size={25} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {area.name}
                  </h2>

                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">
                    {area.areaId}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {area.description ||
                    "Tea collection area"}
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              {area.status}
            </span>
          </div>
        </div>

        {/* Area Summary */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Suppliers */}
          <div className="rounded-xl border border-white/10 bg-[#07140e] p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Users size={16} />

              <span className="text-xs">
                Suppliers
              </span>
            </div>

            <p className="mt-2 text-xl font-bold">
              {formatNumber(summary.supplierCount)}
            </p>
          </div>

          {/* Total KG */}
          <div className="rounded-xl border border-white/10 bg-[#07140e] p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Weight size={16} />

              <span className="text-xs">
                Total Collection
              </span>
            </div>

            <p className="mt-2 text-xl font-bold text-emerald-400">
              {formatNumber(summary.totalKg)}
              <span className="ml-1 text-xs font-normal text-gray-500">
                KG
              </span>
            </p>
          </div>

          {/* Total Value */}
          <div className="rounded-xl border border-white/10 bg-[#07140e] p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Wallet size={16} />

              <span className="text-xs">
                Total Value
              </span>
            </div>

            <p className="mt-2 text-xl font-bold">
              {formatCurrency(summary.totalValue)}
            </p>
          </div>

          {/* Collection Records */}
          <div className="rounded-xl border border-white/10 bg-[#07140e] p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarDays size={16} />

              <span className="text-xs">
                Collection Records
              </span>
            </div>

            <p className="mt-2 text-xl font-bold">
              {formatNumber(summary.collectionCount)}
            </p>
          </div>
        </div>

        {/* Suppliers */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Suppliers in {area.name}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Click a supplier to view their complete
              collection history.
            </p>
          </div>

          {suppliers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
              <Users
                size={30}
                className="mx-auto text-gray-700"
              />

              <p className="mt-3 text-sm text-gray-500">
                No suppliers found in this area.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {suppliers.map((supplier) => {
                const isOpen =
                  openSupplier === supplier.supplierId;

                return (
                  <div
                    key={supplier.supplierId}
                    className="overflow-hidden rounded-xl border border-white/10 bg-[#07140e]"
                  >
                    {/* Supplier Bar */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleSupplier(
                          supplier.supplierId
                        )
                      }
                      className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#091b11] sm:px-5"
                    >
                      {/* Number/Icon */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                        {supplier.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      {/* Name */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">
                            {supplier.name}
                          </p>

                          <span
                            className={`hidden rounded-full px-2 py-0.5 text-[9px] sm:inline ${
                              supplier.status ===
                              "Active"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
                          <span>
                            {supplier.supplierId}
                          </span>

                          <span>
                            {supplier.village}
                          </span>

                          <span className="flex items-center gap-1">
                            <Phone size={11} />
                            {supplier.phone}
                          </span>
                        </div>
                      </div>

                      {/* Supplier Total */}
                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] text-gray-600">
                          Total
                        </p>

                        <p className="text-sm font-semibold text-emerald-400">
                          {formatNumber(
                            supplier.totalKg
                          )}{" "}
                          KG
                        </p>
                      </div>

                      {/* Records */}
                      <div className="hidden text-right md:block">
                        <p className="text-[10px] text-gray-600">
                          Records
                        </p>

                        <p className="text-sm font-semibold">
                          {supplier.collectionCount}
                        </p>
                      </div>

                      {/* Arrow */}
                      {isOpen ? (
                        <ChevronUp
                          size={18}
                          className="shrink-0 text-emerald-400"
                        />
                      ) : (
                        <ChevronDown
                          size={18}
                          className="shrink-0 text-gray-600"
                        />
                      )}
                    </button>

                    {/* Supplier History */}
                    {isOpen && (
                      <div className="border-t border-white/10">
                        {/* Supplier Summary */}
                        <div className="grid grid-cols-2 gap-2 border-b border-white/5 p-4 sm:grid-cols-4">
                          <div>
                            <p className="text-[10px] text-gray-600">
                              Village
                            </p>

                            <p className="mt-1 text-xs text-gray-300">
                              {supplier.village}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-gray-600">
                              Phone
                            </p>

                            <p className="mt-1 text-xs text-gray-300">
                              {supplier.phone}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-gray-600">
                              Total KG
                            </p>

                            <p className="mt-1 text-xs font-semibold text-emerald-400">
                              {formatNumber(
                                supplier.totalKg
                              )}{" "}
                              KG
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-gray-600">
                              Total Value
                            </p>

                            <p className="mt-1 text-xs font-semibold">
                              {formatCurrency(
                                supplier.totalValue
                              )}
                            </p>
                          </div>
                        </div>

                        {/* History */}
                        {supplier.collections.length ===
                        0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-600">
                              No collection history
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-left">
                              <thead>
                                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wide text-gray-600">
                                  <th className="px-4 py-3 font-medium">
                                    Date
                                  </th>

                                  <th className="px-4 py-3 font-medium">
                                    Collection ID
                                  </th>

                                  <th className="px-4 py-3 text-right font-medium">
                                    Weight
                                  </th>

                                  <th className="px-4 py-3 text-right font-medium">
                                    Rate
                                  </th>

                                  <th className="px-4 py-3 text-right font-medium">
                                    Amount
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {supplier.collections.map(
                                  (collection) => (
                                    <tr
                                      key={
                                        collection.collectionId
                                      }
                                      className="border-b border-white/5 last:border-0"
                                    >
                                      <td className="px-4 py-3">
                                        <p className="text-xs text-gray-300">
                                          {formatDate(
                                            collection.date
                                          )}
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-gray-600">
                                          {formatTime(
                                            collection.date
                                          )}
                                        </p>
                                      </td>

                                      <td className="px-4 py-3">
                                        <span className="text-xs text-gray-500">
                                          {
                                            collection.collectionId
                                          }
                                        </span>
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-medium text-emerald-400">
                                          {formatNumber(
                                            collection.weightKg
                                          )}{" "}
                                          KG
                                        </span>
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs text-gray-400">
                                          Rs.{" "}
                                          {formatNumber(
                                            collection.ratePerKg
                                          )}
                                        </span>
                                      </td>

                                      <td className="px-4 py-3 text-right">
                                        <span className="text-xs font-semibold text-white">
                                          {formatCurrency(
                                            collection.totalAmount
                                          )}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}