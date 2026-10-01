"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Leaf,
  Plus,
  RefreshCw,
  Users,
  Weight,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import CollectionModal from "@/components/collections/CollectionModal";

interface Area {
  areaId: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  supplierCount?: number;
  totalKg?: number;
  totalValue?: number;
  todayKg?: number;
  todayValue?: number;
  latestCollectionDate?: string | null;
}

export default function CollectionsPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchAreas(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/collections/areas", {
        cache: "no-store",
      });

      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        areas?: Area[];
      };

      try {
        data = JSON.parse(text);
      } catch {
        console.error("API Response:", text);

        throw new Error(
          `Collections API returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load collection areas"
        );
      }

      setAreas(data.areas || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load collection areas"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAreas();
  }, []);

  function formatNumber(value: number) {
    return new Intl.NumberFormat("en-LK").format(value || 0);
  }

  function formatCurrency(value: number) {
    return `Rs. ${formatNumber(value)}`;
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  const totalSuppliers = areas.reduce(
    (sum, area) => sum + (area.supplierCount || 0),
    0
  );

  const totalKg = areas.reduce(
    (sum, area) => sum + (area.totalKg || 0),
    0
  );

  const totalValue = areas.reduce(
    (sum, area) => sum + (area.totalValue || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#020b06] text-white">
      <Sidebar />

      <div className="lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/10 bg-[#07140e] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400">
                Cooroonduwatte Tea
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                Tea Collection Management
              </h2>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-xs text-gray-500">
                Collection Records
              </p>

              <p className="text-sm text-gray-400">
                Area & Supplier Management
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">

            {/* Back */}
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-emerald-400"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            {/* Title */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                    <Leaf size={22} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold">
                      Tea Collections
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                      Manage daily tea leaf collections
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fetchAreas(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#07140e] px-4 py-2.5 text-sm text-gray-300 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />

                  Refresh
                </button>

                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium transition hover:bg-emerald-500"
                >
                  <Plus size={17} />

                  Add Collection
                </button>
              </div>
            </div>

            {/* Small Summary Bar */}
            <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#07140e]">
              <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
                
                <div className="px-4 py-3 sm:px-5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-600">
                    Areas
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {areas.length}
                  </p>
                </div>

                <div className="px-4 py-3 sm:px-5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-600">
                    Suppliers
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatNumber(totalSuppliers)}
                  </p>
                </div>

                <div className="px-4 py-3 sm:px-5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-600">
                    Total KG
                  </p>

                  <p className="mt-1 text-lg font-semibold text-emerald-400">
                    {formatNumber(totalKg)} KG
                  </p>
                </div>

                <div className="px-4 py-3 sm:px-5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-600">
                    Total Value
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(totalValue)}
                  </p>
                </div>

              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Collection Results */}
            <div className="mt-7">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  Collection Areas
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Select an area to view its suppliers and collection history.
                </p>
              </div>

              {loading ? (
                <div className="py-12 text-center">
                  <RefreshCw
                    size={26}
                    className="mx-auto animate-spin text-emerald-400"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    Loading collections...
                  </p>
                </div>
              ) : areas.length === 0 ? (
                <div className="border border-dashed border-white/10 py-12 text-center">
                  <Leaf
                    size={30}
                    className="mx-auto text-gray-700"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    No collection areas found.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {areas.map((area) => (
                    <Link
                      key={area.areaId}
                      href={`/collections/areas/${area.areaId}`}
                      className="group block"
                    >
                      {/* Area Bar */}
                      <div className="flex min-h-[72px] items-center gap-4 rounded-xl border border-white/10 bg-[#07140e] px-4 py-3 transition hover:border-emerald-500/40 hover:bg-[#091b11] sm:px-5">

                        {/* Icon */}
                        <div className="hidden rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 sm:block">
                          <Leaf size={19} />
                        </div>

                        {/* Area */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                              {area.name}
                            </h3>

                            <span className="hidden text-[10px] text-gray-600 sm:inline">
                              {area.areaId}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <Users size={13} />

                            <span>
                              {area.supplierCount || 0} suppliers
                            </span>
                          </div>
                        </div>

                        {/* Today */}
                        <div className="hidden min-w-[100px] text-right sm:block">
                          <p className="text-[10px] uppercase tracking-wide text-gray-600">
                            Today
                          </p>

                          <p className="mt-1 text-sm font-semibold text-emerald-400">
                            {formatNumber(area.todayKg || 0)} KG
                          </p>
                        </div>

                        {/* Total */}
                        <div className="hidden min-w-[110px] text-right md:block">
                          <p className="text-[10px] uppercase tracking-wide text-gray-600">
                            Total
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatNumber(area.totalKg || 0)} KG
                          </p>
                        </div>

                        {/* Value */}
                        <div className="hidden min-w-[120px] text-right lg:block">
                          <p className="text-[10px] uppercase tracking-wide text-gray-600">
                            Value
                          </p>

                          <p className="mt-1 text-sm font-semibold text-gray-300">
                            {formatCurrency(area.totalValue || 0)}
                          </p>
                        </div>

                        {/* Mobile KG */}
                        <div className="text-right sm:hidden">
                          <p className="text-[10px] text-gray-600">
                            Today
                          </p>

                          <p className="mt-1 text-xs font-semibold text-emerald-400">
                            {formatNumber(area.todayKg || 0)} KG
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-gray-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Collection */}
      <CollectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          fetchAreas(true);
        }}
      />
    </div>
  );
}