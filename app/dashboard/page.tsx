"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Factory,
  Leaf,
  Loader2,
  RefreshCw,
  Scale,
  Users,
} from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

/* =========================================================
   TYPES
========================================================= */

interface AreaCollection {
  areaId: string;
  areaName: string;
  todayTeaWeightKg: number;
  todayFactoryWeightKg: number;
  todayDifferenceKg: number;
  todayCollectionCount: number;
  latestCollectionId?: string;
}

interface DashboardResponse {
  success: boolean;
  message?: string;
  date: string;
  fromDate: string;
  toDate: string;

  today: {
    teaWeightKg: number;
    factoryWeightKg: number;
    differenceKg: number;
    collectionCount: number;
  };

  summary: {
    totalAreas: number;
    collectedAreas: number;
    totalTeaWeightKg: number;
    totalFactoryWeightKg: number;
    totalDifferenceKg: number;
    totalCollections: number;
  };

  monthSummary: {
    month?: number;
    year?: number;
    fromDate: string;
    toDate: string;
    totalTeaWeightKg: number;
    totalFactoryWeightKg: number;
    totalDifferenceKg: number;
    totalCollections: number;
  };

  areas: AreaCollection[];
}

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 2,
  });
}

function formatDateForDisplay(date: string) {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00+05:30`));
}

function getTodaySriLanka() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function getDifferenceStatus(difference: number) {
  if (difference === 0) {
    return {
      label: "Matched",
      className: "text-emerald-400",
    };
  }

  if (difference > 0) {
    return {
      label: "Factory More",
      className: "text-cyan-400",
    };
  }

  return {
    label: "Factory Less",
    className: "text-red-400",
  };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SYSTEM_START_YEAR = 2026;

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Daily dashboard state
  const [selectedDate, setSelectedDate] = useState(getTodaySriLanka());
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Monthly overview state
  const initialMonthlyDate = getTodaySriLanka().split("-").map(Number);

  const [selectedMonth, setSelectedMonth] = useState(initialMonthlyDate[1]);
  const [selectedYear, setSelectedYear] = useState(initialMonthlyDate[0]);

  const [monthlyData, setMonthlyData] =
    useState<DashboardResponse | null>(null);

  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState("");

  /* =======================================================
     FETCH DAILY DASHBOARD
  ======================================================= */

  async function fetchDashboard(date: string) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/dashboard?date=${encodeURIComponent(date)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let result: DashboardResponse;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Invalid dashboard response.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load dashboard."
        );
      }

      setData(result);
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     FETCH MONTHLY OVERVIEW
  ======================================================= */

  async function fetchMonthlyDashboard(month: number, year: number) {
    try {
      setMonthlyLoading(true);
      setMonthlyError("");

      const response = await fetch(
        `/api/dashboard?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let result: DashboardResponse;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Invalid monthly dashboard response.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load monthly overview."
        );
      }

      setMonthlyData(result);
    } catch (error) {
      console.error("Monthly dashboard fetch error:", error);

      setMonthlyError(
        error instanceof Error
          ? error.message
          : "Failed to load monthly overview."
      );
    } finally {
      setMonthlyLoading(false);
    }
  }

  /* =======================================================
     DAILY DATE CHANGE
  ======================================================= */

  useEffect(() => {
    if (!selectedDate) return;

    fetchDashboard(selectedDate);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  /* =======================================================
     MONTH AND YEAR CHANGE
  ======================================================= */

  useEffect(() => {
    fetchMonthlyDashboard(selectedMonth, selectedYear);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  /* =======================================================
     DAILY DATA
  ======================================================= */

  const today = data?.today;
  const summary = data?.summary;
  const areas = data?.areas || [];

  /* =======================================================
     MONTHLY DATA
  ======================================================= */

  const monthlySummary = monthlyData?.monthSummary;

  const monthlyPeriodLabel =
    `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const currentSriLankaYear = Number(
    getTodaySriLanka().slice(0, 4)
  );

  const availableYears = Array.from(
    {
      length: Math.max(
        1,
        currentSriLankaYear - SYSTEM_START_YEAR + 1
      ),
    },
    (_, index) => SYSTEM_START_YEAR + index
  );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-72">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="p-3 sm:p-5 lg:p-8">
          <div className="mx-auto max-w-[1600px]">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400 sm:text-xs">
                  Cooroonduwatte Tea Factory
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Green Leaf Details
                </h1>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">
                  Daily and cumulative tea collection overview.
                </p>
              </div>

              {/* DAILY DATE + REFRESH */}

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <div className="relative min-w-0 flex-1 sm:flex-none">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) =>
                      setSelectedDate(event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-slate-800 bg-[#07140d] pl-9 pr-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:w-[170px] sm:pr-3"
                    style={{ colorScheme: "dark" }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fetchDashboard(selectedDate)}
                  disabled={loading}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#07140d] px-3.5 text-sm font-medium text-slate-400 transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* =================================================
                DAILY ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => fetchDashboard(selectedDate)}
                  className="w-fit rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* =================================================
                DAILY LOADING
            ================================================= */}

            {loading && !data ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <Loader2
                    size={30}
                    className="mx-auto animate-spin text-emerald-500"
                  />

                  <p className="mt-3 text-xs text-slate-600">
                    Loading factory data...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* =================================================
                    TODAY'S OVERVIEW - NORMAL LAYOUT
                ================================================= */}

                <section className="mb-8">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-white sm:text-lg">
                        Today&apos;s Overview
                      </h2>

                      <p className="mt-1 text-xs text-slate-600">
                        Selected date performance
                      </p>
                    </div>

                    <span className="text-xs text-slate-500">
                      {formatDateForDisplay(
                        data?.date || selectedDate
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-5 gap-y-6 border-y border-slate-800 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {/* FIELD WEIGHT */}

                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Leaf
                          size={16}
                          className="text-emerald-400"
                        />

                        <span className="text-xs text-slate-500">
                          Field Weight
                        </span>
                      </div>

                      <p className="text-xl font-bold text-emerald-400 sm:text-2xl">
                        {formatNumber(today?.teaWeightKg || 0)}

                        <span className="ml-1 text-xs font-medium text-slate-500">
                          KG
                        </span>
                      </p>
                    </div>

                    {/* FACTORY WEIGHT */}

                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Factory
                          size={16}
                          className="text-blue-400"
                        />

                        <span className="text-xs text-slate-500">
                          Factory Weight
                        </span>
                      </div>

                      <p className="text-xl font-bold text-blue-400 sm:text-2xl">
                        {formatNumber(today?.factoryWeightKg || 0)}

                        <span className="ml-1 text-xs font-medium text-slate-500">
                          KG
                        </span>
                      </p>
                    </div>

                    {/* DIFFERENCE */}

                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Scale
                          size={16}
                          className="text-amber-400"
                        />

                        <span className="text-xs text-slate-500">
                          Weight Difference
                        </span>
                      </div>

                      <p
                        className={`text-xl font-bold sm:text-2xl ${
                          (today?.differenceKg || 0) > 0
                            ? "text-cyan-400"
                            : (today?.differenceKg || 0) < 0
                              ? "text-red-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {(today?.differenceKg || 0) > 0 ? "+" : ""}
                        {formatNumber(today?.differenceKg || 0)}

                        <span className="ml-1 text-xs font-medium text-slate-500">
                          KG
                        </span>
                      </p>
                    </div>

                    {/* AREAS */}

                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Users
                          size={16}
                          className="text-purple-400"
                        />

                        <span className="text-xs text-slate-500">
                          Areas
                        </span>
                      </div>

                      <p className="text-xl font-bold text-purple-400 sm:text-2xl">
                        {summary?.collectedAreas || 0}

                        <span className="ml-1 text-xs font-medium text-slate-500">
                          / {summary?.totalAreas || 0}
                        </span>
                      </p>

                      <p className="mt-1 text-[10px] text-slate-600">
                        {formatNumber(summary?.totalCollections || 0)}{" "}
                        collections
                      </p>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    AREA COLLECTIONS - NORMAL DETAILS
                ================================================= */}

                <section className="mt-7">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-white sm:text-lg">
                        Area Collections
                      </h2>

                      <p className="mt-1 text-xs text-slate-600">
                        Collection details for the selected date
                      </p>
                    </div>

                    <span className="text-xs text-slate-600">
                      {areas.length} area
                      {areas.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {areas.length === 0 ? (
                    <div className="py-12 text-center">
                      <Leaf
                        size={24}
                        className="mx-auto text-slate-700"
                      />

                      <p className="mt-3 text-sm font-medium text-slate-500">
                        No collection recorded
                      </p>

                      <p className="mt-1 text-xs text-slate-700">
                        Select another date to view its collections.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800 border-y border-slate-800">
                      {areas.map((area) => {
                        const fieldWeight = Number(
                          area.todayTeaWeightKg || 0
                        );

                        const factoryWeight = Number(
                          area.todayFactoryWeightKg || 0
                        );

                        const difference = Number(
                          area.todayDifferenceKg || 0
                        );

                        const collectionCount = Number(
                          area.todayCollectionCount || 0
                        );

                        const status = getDifferenceStatus(difference);

                        return (
                          <Link
                            key={area.areaId}
                            href={`/dashboard/areas/${encodeURIComponent(
                              area.areaId
                            )}?date=${encodeURIComponent(
                              data?.date || selectedDate
                            )}`}
                            className="group block py-4 transition hover:bg-slate-900/20"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              {/* AREA NAME */}

                              <div className="flex min-w-0 items-center gap-3 lg:w-[25%]">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                  <Leaf size={17} />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">
                                    {area.areaName}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-600">
                                    {collectionCount} collection
                                    {collectionCount !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>

                              {/* WEIGHT DETAILS */}

                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:flex lg:flex-1 lg:items-center lg:justify-around">
                                <div>
                                  <p className="text-[10px] text-slate-600">
                                    Field Weight
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-emerald-400">
                                    {formatNumber(fieldWeight)} KG
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] text-slate-600">
                                    Factory Weight
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-blue-400">
                                    {formatNumber(factoryWeight)} KG
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[10px] text-slate-600">
                                    Difference
                                  </p>

                                  <p
                                    className={`mt-1 text-sm font-semibold ${
                                      difference > 0
                                        ? "text-cyan-400"
                                        : difference < 0
                                          ? "text-red-400"
                                          : "text-emerald-400"
                                    }`}
                                  >
                                    {difference > 0 ? "+" : ""}
                                    {formatNumber(difference)} KG
                                  </p>
                                </div>
                              </div>

                              {/* STATUS */}

                              <div className="flex items-center justify-between gap-3 lg:w-[140px] lg:justify-end">
                                <span
                                  className={`text-xs font-medium ${status.className}`}
                                >
                                  {status.label}
                                </span>

                                <ArrowRight
                                  size={15}
                                  className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-emerald-400"
                                />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* =================================================
                    PERIOD TOTALS
                ================================================= */}

                <section className="mt-8">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-white sm:text-lg">
                      Period Totals
                    </h2>

                    <p className="mt-1 text-xs text-slate-600">
                      {data?.monthSummary?.fromDate
                        ? `Calendar-month totals: ${formatDateForDisplay(
                            data.monthSummary.fromDate
                          )} – ${formatDateForDisplay(
                            data.monthSummary.toDate
                          )}`
                        : "Calendar-month totals"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 border-y border-slate-800 py-5 sm:grid-cols-3 sm:gap-6">
                    {/* TOTAL FIELD WEIGHT */}

                    <div>
                      <div className="flex items-center gap-2">
                        <Leaf
                          size={15}
                          className="text-emerald-400"
                        />

                        <span className="text-xs text-slate-500">
                          Total Field Weight
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-bold text-emerald-400 sm:text-2xl">
                        {formatNumber(
                          data?.monthSummary?.totalTeaWeightKg || 0
                        )}

                        <span className="ml-1 text-xs font-medium text-slate-500">
                          KG
                        </span>
                      </p>
                    </div>

                    {/* TOTAL FACTORY WEIGHT */}

                    <div>
                      <div className="flex items-center gap-2">
                        <Factory
                          size={15}
                          className="text-blue-400"
                        />

                        <span className="text-xs text-slate-500">
                          Total Factory Weight
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-bold text-blue-400 sm:text-2xl">
                        {formatNumber(
                          data?.monthSummary?.totalFactoryWeightKg || 0
                        )}

                        <span className="ml-1 text-xs font-medium text-slate-500">
                          KG
                        </span>
                      </p>
                    </div>

                    {/* TOTAL DIFFERENCE */}

                    <div>
                      <div className="flex items-center gap-2">
                        <Scale
                          size={15}
                          className="text-amber-400"
                        />

                        <span className="text-xs text-slate-500">
                          Total Difference
                        </span>
                      </div>

                      <p
                        className={`mt-2 text-xl font-bold sm:text-2xl ${
                          (data?.monthSummary?.totalDifferenceKg || 0) > 0
                            ? "text-cyan-400"
                            : (data?.monthSummary?.totalDifferenceKg || 0) < 0
                              ? "text-red-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {(data?.monthSummary?.totalDifferenceKg || 0) > 0
                          ? "+"
                          : ""}
                        {formatNumber(
                          data?.monthSummary?.totalDifferenceKg || 0
                        )}

                        <span className="ml-1 text-xs font-medium text-slate-500">
                          KG
                        </span>
                      </p>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    MONTHLY OVERVIEW
                ================================================= */}

                <section className="mt-9 border-t border-slate-800 pt-7">

                  {/* MONTHLY HEADER + PERIOD SELECTOR */}

                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                        Collection History
                      </p>

                      <h2 className="text-lg font-bold text-white sm:text-xl">
                        Monthly Overview
                      </h2>

                      <p className="mt-1 text-xs text-slate-600">
                        View collection totals for each month of the year.
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          size={16}
                          className="shrink-0 text-slate-500"
                        />

                        <select
                          aria-label="Select month"
                          value={selectedMonth}
                          onChange={(event) =>
                            setSelectedMonth(Number(event.target.value))
                          }
                          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-800 bg-[#07140d] px-3 text-sm text-white outline-none transition focus:border-emerald-500 sm:w-[155px]"
                          style={{ colorScheme: "dark" }}
                        >
                          {MONTH_NAMES.map((month, index) => (
                            <option key={month} value={index + 1}>
                              {month}
                            </option>
                          ))}
                        </select>
                      </div>

                      <select
                        aria-label="Select year"
                        value={selectedYear}
                        onChange={(event) =>
                          setSelectedYear(Number(event.target.value))
                        }
                        className="h-10 w-full rounded-lg border border-slate-800 bg-[#07140d] px-3 text-sm text-white outline-none transition focus:border-emerald-500 sm:w-[105px]"
                        style={{ colorScheme: "dark" }}
                      >
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          fetchMonthlyDashboard(
                            selectedMonth,
                            selectedYear
                          )
                        }
                        disabled={monthlyLoading}
                        aria-label="Refresh monthly overview"
                        className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#07140d] px-3 text-slate-400 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50 sm:w-10 sm:px-0"
                      >
                        <RefreshCw
                          size={15}
                          className={
                            monthlyLoading ? "animate-spin" : ""
                          }
                        />

                        <span className="text-xs sm:hidden">
                          Refresh
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* SELECTED PERIOD */}

                  {monthlyData && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-400">
                        {monthlyPeriodLabel}
                      </span>

                      <span>
                        {monthlyData.monthSummary?.fromDate
                          ? formatDateForDisplay(
                              monthlyData.monthSummary.fromDate
                            )
                          : ""}
                        {" – "}
                        {monthlyData.monthSummary?.toDate
                          ? formatDateForDisplay(
                              monthlyData.monthSummary.toDate
                            )
                          : ""}
                      </span>
                    </div>
                  )}

                  {/* MONTHLY ERROR */}

                  {monthlyError && (
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
                      <span>{monthlyError}</span>

                      <button
                        type="button"
                        onClick={() =>
                          fetchMonthlyDashboard(
                            selectedMonth,
                            selectedYear
                          )
                        }
                        className="w-fit rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* MONTHLY LOADING */}

                  {monthlyLoading && !monthlyData ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                      <div className="text-center">
                        <Loader2
                          size={28}
                          className="mx-auto animate-spin text-blue-400"
                        />

                        <p className="mt-3 text-xs text-slate-600">
                          Loading factory weight...
                        </p>
                      </div>
                    </div>
                  ) : monthlyError && !monthlyData ? (
                    <div className="flex min-h-[160px] items-center justify-center p-6 text-center">
                      <p className="text-xs text-slate-500">
                        Monthly overview could not be loaded.
                      </p>
                    </div>
                  ) : (
                    /* MONTHLY FACTORY WEIGHT */

                    <div className="border-y border-slate-800 py-6">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                              <Factory size={22} />
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-400">
                                Total Factory Weight
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                {monthlyPeriodLabel}
                              </p>
                            </div>
                          </div>

                          <p className="mt-5 text-3xl font-bold tracking-tight text-blue-400 sm:text-4xl lg:text-5xl">
                            {formatNumber(
                              monthlySummary?.totalFactoryWeightKg || 0
                            )}

                            <span className="ml-2 text-base font-medium text-slate-500 sm:text-lg">
                              KG
                            </span>
                          </p>
                        </div>

                        <div className="hidden h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/10 bg-blue-500/5 text-blue-400/50 sm:flex">
                          <Factory size={38} strokeWidth={1.4} />
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}