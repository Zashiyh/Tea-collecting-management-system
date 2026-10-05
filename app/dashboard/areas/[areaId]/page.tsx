
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Factory,
  Leaf,
  Loader2,
  RefreshCw,
  Scale,
  Users,
  ArrowRight,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

/* =========================================================
   TYPES
========================================================= */

interface Collection {
  collectionId: string;
  date: string;
  areaId: string;
  areaName: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes: string;
}

interface AreaSummary {
  totalCollections: number;
  totalTeaWeightKg: number;
  totalFactoryWeightKg: number;
  totalDifferenceKg: number;
}

interface AreaResponse {
  success: boolean;
  message?: string;

  area?: {
    areaId: string;
    areaName: string;
  };

  fromDate?: string;
  toDate?: string;

  summary?: AreaSummary;

  collections?: Collection[];
}

/* =========================================================
   HELPERS
========================================================= */

function getTodaySriLanka() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(dateValue: string) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   PAGE
========================================================= */

export default function AreaDashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */

  const [mobileOpen, setMobileOpen] = useState(false);

  /* =======================================================
     AREA ID
  ======================================================= */

  const areaId = decodeURIComponent(
    String(params.areaId || "")
  );

  /* =======================================================
     DATE FROM URL
  ======================================================= */

  const selectedDate =
    searchParams.get("date") ||
    getTodaySriLanka();

  /* =======================================================
     DATE STATES
  ======================================================= */

  const [fromDate, setFromDate] = useState(
    searchParams.get("from") ||
      selectedDate
  );

  const [toDate, setToDate] = useState(
    searchParams.get("to") ||
      selectedDate
  );

  /* =======================================================
     DATA STATES
  ======================================================= */

  const [areaName, setAreaName] = useState("");

  const [collections, setCollections] =
    useState<Collection[]>([]);

  const [summary, setSummary] =
    useState<AreaSummary>({
      totalCollections: 0,
      totalTeaWeightKg: 0,
      totalFactoryWeightKg: 0,
      totalDifferenceKg: 0,
    });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     AUTO DATE REFRESH CONTROL
  ======================================================= */

  const firstDateEffect = useRef(true);

  /* =======================================================
     LOAD AREA COLLECTIONS
  ======================================================= */

  async function fetchAreaCollections(
    customFrom?: string,
    customTo?: string
  ) {
    try {
      setLoading(true);
      setError("");

      const finalFrom =
        customFrom || fromDate;

      const finalTo =
        customTo || toDate;

      if (!finalFrom || !finalTo) {
        throw new Error(
          "Please select a valid date."
        );
      }

      if (finalFrom > finalTo) {
        throw new Error(
          "From date cannot be after To date."
        );
      }

      const query = new URLSearchParams({
        from: finalFrom,
        to: finalTo,
      });

      const response = await fetch(
        `/api/dashboard/areas/${encodeURIComponent(
          areaId
        )}?${query.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const responseText =
        await response.text();

      let data: AreaResponse;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {
              success: false,
              message:
                "Empty server response.",
            };
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}).`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load area collections."
        );
      }

      setAreaName(
        data.area?.areaName || ""
      );

      setCollections(
        data.collections || []
      );

      setSummary(
        data.summary || {
          totalCollections: 0,
          totalTeaWeightKg: 0,
          totalFactoryWeightKg: 0,
          totalDifferenceKg: 0,
        }
      );
    } catch (error) {
      console.error(
        "AREA COLLECTIONS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load area collections."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (!areaId) {
      setError("Area ID is missing.");
      setLoading(false);
      return;
    }

    const urlDate =
      searchParams.get("date");

    const urlFrom =
      searchParams.get("from");

    const urlTo =
      searchParams.get("to");

    const initialFromDate =
      urlFrom ||
      urlDate ||
      getTodaySriLanka();

    const initialToDate =
      urlTo ||
      urlDate ||
      getTodaySriLanka();

    setFromDate(initialFromDate);
    setToDate(initialToDate);

    fetchAreaCollections(
      initialFromDate,
      initialToDate
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId]);

  /* =======================================================
     AUTO REFRESH WHEN DATE CHANGES
  ======================================================= */

  useEffect(() => {
    // Skip the first render.
    // Initial data is already loaded above.
    if (firstDateEffect.current) {
      firstDateEffect.current = false;
      return;
    }

    if (!areaId || !fromDate || !toDate) {
      return;
    }

    // Don't send API request for invalid range.
    if (fromDate > toDate) {
      setError(
        "From date cannot be after To date."
      );
      return;
    }

    fetchAreaCollections(
      fromDate,
      toDate
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  function handleRefresh() {
    if (!fromDate || !toDate) {
      setError(
        "Please select a valid date."
      );
      return;
    }

    if (fromDate > toDate) {
      setError(
        "From date cannot be after To date."
      );
      return;
    }

    fetchAreaCollections(
      fromDate,
      toDate
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#020a06] text-white">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
      />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="lg:ml-64">

        {/* =================================================
            HEADER
        ================================================= */}

        <Header
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="min-h-screen p-3 sm:p-5 lg:p-8">

          <div className="mx-auto max-w-[1500px]">

            {/* =================================================
                BACK
            ================================================= */}

            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-emerald-400 sm:mb-6 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 sm:h-12 sm:w-12">
                    <Leaf size={22} />
                  </div>

                  <div>

                    <p className="text-xs font-medium text-emerald-400">
                      {areaId}
                    </p>

                    <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                      {areaName ||
                        "Area Collections"}
                    </h1>

                    <p className="mt-1 text-[10px] text-slate-500 sm:text-sm">
                      Daily tea collections for this area.
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  DATE FILTER
              ================================================= */}

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

                <div className="flex flex-1 items-center gap-2">

                  {/* FROM */}

                  <div className="relative flex-1 sm:flex-none">

                    <CalendarDays
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      type="date"
                      value={fromDate}
                      onChange={(event) =>
                        setFromDate(
                          event.target.value
                        )
                      }
                      className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-2 text-xs text-white outline-none focus:border-emerald-500 sm:w-[145px] sm:pr-3"
                      style={{
                        colorScheme: "dark",
                      }}
                    />

                  </div>

                  <span className="text-xs text-slate-600">
                    to
                  </span>

                  {/* TO */}

                  <div className="relative flex-1 sm:flex-none">

                    <CalendarDays
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      type="date"
                      value={toDate}
                      onChange={(event) =>
                        setToDate(
                          event.target.value
                        )
                      }
                      className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-2 text-xs text-white outline-none focus:border-emerald-500 sm:w-[145px] sm:pr-3"
                      style={{
                        colorScheme: "dark",
                      }}
                    />

                  </div>

                </div>

                {/* MANUAL REFRESH */}

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 text-xs font-medium text-slate-400 transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <RefreshCw
                    size={14}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh

                </button>

              </div>

            </div>

            {/* =================================================
                DATE INFO
            ================================================= */}

            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3">

              <CalendarDays
                size={15}
                className="shrink-0 text-emerald-400"
              />

              <p className="text-[10px] text-slate-500 sm:text-xs">

                Showing collections from{" "}

                <span className="font-semibold text-white">
                  {formatDate(
                    fromDate
                  )}
                </span>

                {" "}to{" "}

                <span className="font-semibold text-white">
                  {formatDate(
                    toDate
                  )}
                </span>

              </p>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 sm:flex-row sm:items-center sm:justify-between">

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleRefresh()
                  }
                  className="flex w-fit items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                >

                  <RefreshCw size={14} />

                  Try Again

                </button>

              </div>
            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">

              {/* COLLECTIONS */}

              <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3 sm:rounded-2xl sm:p-5">

                <div className="flex items-center gap-2 text-[9px] text-slate-500 sm:text-xs">

                  <CalendarDays size={14} />

                  Collections

                </div>

                <p className="mt-2 text-xl font-bold text-white sm:text-2xl">

                  {summary.totalCollections}

                </p>

              </div>

              {/* TEA */}

              <div className="rounded-xl border border-emerald-500/10 bg-[#07140d] p-3 sm:rounded-2xl sm:p-5">

                <div className="flex items-center gap-2 text-[9px] text-slate-500 sm:text-xs">

                  <Leaf
                    size={14}
                    className="text-emerald-400"
                  />

                  Tea Weight

                </div>

                <p className="mt-2 text-xl font-bold text-emerald-400 sm:text-2xl">

                  {formatNumber(
                    summary.totalTeaWeightKg
                  )}{" "}

                  KG

                </p>

              </div>

              {/* FACTORY */}

              <div className="rounded-xl border border-blue-500/10 bg-[#07140d] p-3 sm:rounded-2xl sm:p-5">

                <div className="flex items-center gap-2 text-[9px] text-slate-500 sm:text-xs">

                  <Factory
                    size={14}
                    className="text-blue-400"
                  />

                  Factory Weight

                </div>

                <p className="mt-2 text-xl font-bold text-blue-400 sm:text-2xl">

                  {formatNumber(
                    summary.totalFactoryWeightKg
                  )}{" "}

                  KG

                </p>

              </div>

              {/* DIFFERENCE */}

              <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3 sm:rounded-2xl sm:p-5">

                <div className="flex items-center gap-2 text-[9px] text-slate-500 sm:text-xs">

                  <Scale size={14} />

                  Factory − Tea

                </div>

                <p
                  className={`mt-2 text-xl font-bold sm:text-2xl ${
                    summary.totalDifferenceKg >
                    0
                      ? "text-cyan-400"
                      : summary.totalDifferenceKg <
                          0
                        ? "text-red-400"
                        : "text-slate-300"
                  }`}
                >

                  {summary.totalDifferenceKg >
                  0
                    ? "+"
                    : ""}

                  {formatNumber(
                    summary.totalDifferenceKg
                  )}{" "}

                  KG

                </p>

              </div>

            </div>

            {/* =================================================
                COLLECTIONS
            ================================================= */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#07140d] sm:rounded-2xl">

              <div className="border-b border-slate-800 p-4 sm:p-5">

                <h2 className="text-sm font-semibold text-white sm:text-base">
                  Collection Dates
                </h2>

                <p className="mt-1 text-[10px] text-slate-600 sm:text-xs">
                  Click a collection to see the suppliers who supplied tea on that date.
                </p>

              </div>

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (

                <div className="flex min-h-[280px] items-center justify-center">

                  <div className="text-center">

                    <Loader2
                      size={30}
                      className="mx-auto animate-spin text-emerald-500"
                    />

                    <p className="mt-3 text-xs text-slate-600">
                      Loading collections...
                    </p>

                  </div>

                </div>

              ) : collections.length === 0 ? (

                /* =================================================
                   EMPTY
                ================================================= */

                <div className="flex min-h-[280px] items-center justify-center p-6 text-center">

                  <div>

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-700">

                      <Leaf size={22} />

                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-500">
                      No collections found
                    </p>

                    <p className="mt-1 text-xs text-slate-700">
                      No tea collection was recorded for this date range.
                    </p>

                  </div>

                </div>

              ) : (

                <>

                  {/* =================================================
                      DESKTOP
                  ================================================= */}

                  <div className="hidden overflow-x-auto md:block">

                    <table className="w-full min-w-[800px]">

                      <thead>

                        <tr className="border-b border-slate-800 text-left">

                          <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            Date
                          </th>

                          <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            Tea Weight
                          </th>

                          <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            Factory Weight
                          </th>

                          <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            Difference
                          </th>

                          <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            Action
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {collections.map(
                          (collection) => {

                            const difference =
                              Number(
                                collection.factoryWeightKg ||
                                  0
                              ) -
                              Number(
                                collection.totalKg ||
                                  0
                              );

                            return (

                              <tr
                                key={
                                  collection.collectionId
                                }
                                className="border-b border-slate-800/70 transition hover:bg-slate-900/30"
                              >

                                <td className="px-5 py-4">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">

                                      <CalendarDays
                                        size={16}
                                      />

                                    </div>

                                    <div>

                                      <p className="text-sm font-medium text-white">

                                        {formatDate(
                                          collection.date
                                        )}

                                      </p>

                                      <p className="mt-0.5 text-[10px] text-slate-600">

                                        {
                                          collection.collectionId
                                        }

                                      </p>

                                    </div>

                                  </div>

                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-emerald-400">

                                  {formatNumber(
                                    collection.totalKg
                                  )}{" "}
                                  KG

                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-blue-400">

                                  {formatNumber(
                                    collection.factoryWeightKg
                                  )}{" "}
                                  KG

                                </td>

                                <td
                                  className={`px-5 py-4 text-sm font-semibold ${
                                    difference > 0
                                      ? "text-cyan-400"
                                      : difference < 0
                                      ? "text-red-400"
                                      : "text-slate-400"
                                  }`}
                                >

                                  {difference > 0
                                    ? "+"
                                    : ""}

                                  {formatNumber(
                                    difference
                                  )}{" "}
                                  KG

                                </td>

                                <td className="px-5 py-4 text-right">

                                  <Link
                                    href={`/collections/${encodeURIComponent(
                                      collection.collectionId
                                    )}`}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-400"
                                  >

                                    <Users
                                      size={14}
                                    />

                                    Suppliers

                                    <ArrowRight
                                      size={14}
                                    />

                                  </Link>

                                </td>

                              </tr>

                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* =================================================
                      MOBILE
                  ================================================= */}

                  <div className="divide-y divide-slate-800 md:hidden">

                    {collections.map(
                      (collection) => {

                        const difference =
                          Number(
                            collection.factoryWeightKg ||
                              0
                          ) -
                          Number(
                            collection.totalKg ||
                              0
                          );

                        return (

                          <Link
                            key={
                              collection.collectionId
                            }
                            href={`/collections/${encodeURIComponent(
                              collection.collectionId
                            )}`}
                            className="block p-4 transition active:bg-slate-900/50 hover:bg-slate-900/30"
                          >

                            {/* DATE */}

                            <div className="flex items-center justify-between gap-3">

                              <div className="flex min-w-0 items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">

                                  <CalendarDays
                                    size={17}
                                  />

                                </div>

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-semibold text-white">

                                    {formatDate(
                                      collection.date
                                    )}

                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-600">

                                    {
                                      collection.collectionId
                                    }

                                  </p>

                                </div>

                              </div>

                              <ArrowRight
                                size={16}
                                className="shrink-0 text-slate-600"
                              />

                            </div>

                            {/* WEIGHTS */}

                            <div className="mt-4 grid grid-cols-3 gap-2">

                              <div className="rounded-lg bg-slate-900/50 p-2.5">

                                <p className="text-[9px] text-slate-600">
                                  Tea
                                </p>

                                <p className="mt-1 text-xs font-semibold text-emerald-400">

                                  {formatNumber(
                                    collection.totalKg
                                  )}{" "}
                                  KG

                                </p>

                              </div>

                              <div className="rounded-lg bg-slate-900/50 p-2.5">

                                <p className="text-[9px] text-slate-600">
                                  Factory
                                </p>

                                <p className="mt-1 text-xs font-semibold text-blue-400">

                                  {formatNumber(
                                    collection.factoryWeightKg
                                  )}{" "}
                                  KG

                                </p>

                              </div>

                              <div className="rounded-lg bg-slate-900/50 p-2.5">

                                <p className="text-[9px] text-slate-600">
                                  Difference
                                </p>

                                <p
                                  className={`mt-1 text-xs font-semibold ${
                                    difference > 0
                                      ? "text-cyan-400"
                                      : difference < 0
                                      ? "text-red-400"
                                      : "text-slate-400"
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

                            {/* SUPPLIER HINT */}

                            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600">

                              <span className="flex items-center gap-1.5">

                                <Users size={13} />

                                View suppliers for this collection

                              </span>

                              <span className="text-emerald-500">
                                View →
                              </span>

                            </div>

                          </Link>

                        );
                      }
                    )}

                  </div>

                </>

              )}

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
