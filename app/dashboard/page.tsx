
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

  areas: AreaCollection[];
}

type MonthlyPeriod = "1m" | "2m" | "3m" | "6m" | "12m" | "all";

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
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    };
  }

  if (difference > 0) {
    return {
      label: "Factory More",
      className:
        "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    };
  }

  return {
    label: "Factory Less",
    className:
      "border-red-500/20 bg-red-500/10 text-red-400",
  };
}

const MONTHLY_PERIOD_OPTIONS: {
  value: MonthlyPeriod;
  label: string;
}[] = [
  { value: "1m", label: "After 1 Month" },
  { value: "2m", label: "After 2 Months" },
  { value: "3m", label: "After 3 Months" },
  { value: "6m", label: "After 6 Months" },
  { value: "12m", label: "After 12 Months" },
  { value: "all", label: "All Time" },
];

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Existing daily dashboard state
  const [selectedDate, setSelectedDate] = useState(getTodaySriLanka());
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Separate monthly overview state
  const [selectedMonthlyPeriod, setSelectedMonthlyPeriod] =
    useState<MonthlyPeriod>("1m");

  const [monthlyData, setMonthlyData] =
    useState<DashboardResponse | null>(null);

  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState("");

  /* =======================================================
     FETCH EXISTING DAILY DASHBOARD
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
     FETCH SEPARATE MONTHLY OVERVIEW
  ======================================================= */

  async function fetchMonthlyDashboard(period: MonthlyPeriod) {
    try {
      setMonthlyLoading(true);
      setMonthlyError("");

      const response = await fetch(
        `/api/dashboard?period=${encodeURIComponent(period)}`,
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
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchDashboard(selectedDate);
    // Initial daily dashboard load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     DAILY DATE CHANGE
  ======================================================= */

  useEffect(() => {
    if (!selectedDate) return;

    fetchDashboard(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  /* =======================================================
     MONTHLY PERIOD CHANGE
  ======================================================= */

  useEffect(() => {
    fetchMonthlyDashboard(selectedMonthlyPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonthlyPeriod]);

  /* =======================================================
     DAILY DATA
  ======================================================= */

  const today = data?.today;
  const summary = data?.summary;
  const areas = data?.areas || [];

  /* =======================================================
     MONTHLY DATA
  ======================================================= */

  const monthlySummary = monthlyData?.summary;
  const monthlyAreas = monthlyData?.areas || [];

  const monthlyPeriodLabel =
    MONTHLY_PERIOD_OPTIONS.find(
      (option) => option.value === selectedMonthlyPeriod
    )?.label || "Monthly Overview";

  /* =======================================================
     FIXED BAR SCALE
     1000 KG = 100% FULL
  ======================================================= */

  const maxWeight = 1000;

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

            <div className="mb-5 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:items-center lg:justify-between">
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
                    className="h-10 w-full rounded-lg border border-slate-800 bg-[#07140d] pl-9 pr-2 text-sm text-white outline-none transition focus:border-emerald-500 sm:h-10 sm:w-[170px] sm:pr-3"
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
              <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-slate-800 bg-[#07140d]">
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
                    DAILY MAIN SUMMARY
                ================================================= */}

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-white sm:text-lg">
                        Today&apos;s Overview
                      </h2>

                      <p className="mt-0.5 text-[10px] text-slate-700 sm:text-xs">
                        Selected date performance
                      </p>
                    </div>

                    <span className="rounded-md bg-slate-900 px-2.5 py-1 text-[10px] text-slate-600 sm:text-xs">
                      {formatDateForDisplay(
                        data?.date || selectedDate
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">

                    {/* FIELD */}

                    <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3.5 transition hover:border-emerald-500/20 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Field Weight
                        </span>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Leaf size={15} />
                        </div>
                      </div>

                      <p className="mt-2 text-xl font-bold text-white sm:text-2xl">
                        {formatNumber(today?.teaWeightKg || 0)}
                        <span className="ml-1 text-[10px] font-medium text-slate-600 sm:text-xs">
                          KG
                        </span>
                      </p>

                      <div className="mt-2 border-t border-slate-800 pt-2">
                        <span className="text-[10px] text-slate-700 sm:text-xs">
                          Period total
                        </span>

                        <p className="mt-0.5 text-xs font-medium text-emerald-400/80 sm:text-sm">
                          {formatNumber(
                            summary?.totalTeaWeightKg || 0
                          )}{" "}
                          KG
                        </p>
                      </div>
                    </div>

                    {/* FACTORY */}

                    <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3.5 transition hover:border-blue-500/20 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Factory Weight
                        </span>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                          <Factory size={15} />
                        </div>
                      </div>

                      <p className="mt-2 text-xl font-bold text-white sm:text-2xl">
                        {formatNumber(today?.factoryWeightKg || 0)}
                        <span className="ml-1 text-[10px] font-medium text-slate-600 sm:text-xs">
                          KG
                        </span>
                      </p>

                      <div className="mt-2 border-t border-slate-800 pt-2">
                        <span className="text-[10px] text-slate-700 sm:text-xs">
                          Period total
                        </span>

                        <p className="mt-0.5 text-xs font-medium text-blue-400/80 sm:text-sm">
                          {formatNumber(
                            summary?.totalFactoryWeightKg || 0
                          )}{" "}
                          KG
                        </p>
                      </div>
                    </div>

                    {/* DIFFERENCE */}

                    <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3.5 transition hover:border-cyan-500/20 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Weight Difference
                        </span>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                          <Scale size={15} />
                        </div>
                      </div>

                      <p
                        className={`mt-2 text-xl font-bold sm:text-2xl ${
                          (today?.differenceKg || 0) > 0
                            ? "text-cyan-400"
                            : (today?.differenceKg || 0) < 0
                              ? "text-red-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {(today?.differenceKg || 0) > 0 ? "+" : ""}
                        {formatNumber(today?.differenceKg || 0)}
                        <span className="ml-1 text-[10px] font-medium text-slate-600 sm:text-xs">
                          KG
                        </span>
                      </p>

                      <div className="mt-2 border-t border-slate-800 pt-2">
                        <span className="text-[10px] text-slate-700 sm:text-xs">
                          Period total
                        </span>

                        <p
                          className={`mt-0.5 text-xs font-medium sm:text-sm ${
                            (summary?.totalDifferenceKg || 0) > 0
                              ? "text-cyan-400/80"
                              : (summary?.totalDifferenceKg || 0) < 0
                                ? "text-red-400/80"
                                : "text-emerald-400/80"
                          }`}
                        >
                          {(summary?.totalDifferenceKg || 0) > 0
                            ? "+"
                            : ""}
                          {formatNumber(
                            summary?.totalDifferenceKg || 0
                          )}{" "}
                          KG
                        </p>
                      </div>
                    </div>

                    {/* AREAS */}

                    <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3.5 transition hover:border-purple-500/20 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Areas
                        </span>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                          <Users size={15} />
                        </div>
                      </div>

                      <p className="mt-2 text-xl font-bold text-white sm:text-2xl">
                        {summary?.collectedAreas || 0}
                        <span className="ml-1 text-xs font-medium text-slate-600 sm:text-sm">
                          / {summary?.totalAreas || 0}
                        </span>
                      </p>

                      <div className="mt-2 border-t border-slate-800 pt-2">
                        <span className="text-[10px] text-slate-700 sm:text-xs">
                          Total collections
                        </span>

                        <p className="mt-0.5 text-xs font-medium text-purple-400/80 sm:text-sm">
                          {formatNumber(
                            summary?.totalCollections || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    DAILY AREA COLLECTIONS
                ================================================= */}

                <section className="mt-5">
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-white sm:text-lg">
                        Area Collections
                      </h2>

                      <p className="mt-0.5 text-[10px] text-slate-700 sm:text-xs">
                        Click an area to view its details
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-700 sm:text-xs">
                      {areas.length} area
                      {areas.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#07140d]">

                    {/* TABLE HEADER */}

                    <div className="hidden grid-cols-[minmax(170px,1.2fr)_minmax(180px,1.8fr)_minmax(180px,1.8fr)_120px] items-center border-b border-slate-800 bg-[#0a1910] px-4 py-3 md:grid lg:px-5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Area
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Field Weight
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Factory Weight
                      </span>

                      <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Status
                      </span>
                    </div>

                    {/* NO DATA */}

                    {areas.length === 0 ? (
                      <div className="flex min-h-[240px] items-center justify-center p-6 text-center">
                        <div>
                          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-slate-700">
                            <Leaf size={20} />
                          </div>

                          <p className="mt-3 text-sm font-medium text-slate-500">
                            No collection recorded
                          </p>

                          <p className="mt-1 text-xs text-slate-700">
                            Select another date to view its collections.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/70">
                        {areas.map((area) => {
                          const todayField = Number(
                            area.todayTeaWeightKg || 0
                          );

                          const todayFactory = Number(
                            area.todayFactoryWeightKg || 0
                          );

                          const todayDifference = Number(
                            area.todayDifferenceKg || 0
                          );

                          const todayCollections = Number(
                            area.todayCollectionCount || 0
                          );

                          const status =
                            getDifferenceStatus(todayDifference);

                          const fieldWidth =
                            todayField > 0
                              ? Math.min(
                                  100,
                                  Math.max(
                                    3,
                                    (todayField / maxWeight) * 100
                                  )
                                )
                              : 0;

                          const factoryWidth =
                            todayFactory > 0
                              ? Math.min(
                                  100,
                                  Math.max(
                                    3,
                                    (todayFactory / maxWeight) * 100
                                  )
                                )
                              : 0;

                          return (
                            <Link
                              key={area.areaId}
                              href={`/dashboard/areas/${encodeURIComponent(
                                area.areaId
                              )}?date=${encodeURIComponent(
                                data?.date || selectedDate
                              )}`}
                              className="group block transition hover:bg-slate-900/25"
                            >
                              <div className="p-3.5 sm:p-4 lg:px-5">
                                <div className="grid gap-4 md:grid-cols-[minmax(170px,1.2fr)_minmax(180px,1.8fr)_minmax(180px,1.8fr)_120px] md:items-center">

                                  {/* AREA */}

                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-[10px] font-bold text-emerald-400 sm:h-10 sm:w-10 sm:text-xs">
                                      <Leaf size={15} />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-white sm:text-base">
                                        {area.areaName}
                                      </p>

                                      <p className="mt-0.5 text-[10px] text-slate-700 sm:text-xs">
                                        {todayCollections} collection
                                        {todayCollections !== 1 ? "s" : ""}
                                      </p>
                                    </div>
                                  </div>

                                  {/* MOBILE */}

                                  <div className="md:hidden">
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="text-[10px] font-medium text-slate-600">
                                        Field Weight
                                      </span>

                                      <span className="text-[10px] font-semibold text-emerald-400">
                                        {formatNumber(todayField)} KG
                                      </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                                      <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${fieldWidth}%` }}
                                      />
                                    </div>

                                    <div className="mb-2 mt-3 flex items-center justify-between">
                                      <span className="text-[10px] font-medium text-slate-600">
                                        Factory Weight
                                      </span>

                                      <span className="text-[10px] font-semibold text-blue-400">
                                        {formatNumber(todayFactory)} KG
                                      </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                                      <div
                                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${factoryWidth}%` }}
                                      />
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                      <div>
                                        <span className="text-[10px] text-slate-600">
                                          Difference
                                        </span>

                                        <p
                                          className={`mt-0.5 text-xs font-semibold ${
                                            todayDifference > 0
                                              ? "text-cyan-400"
                                              : todayDifference < 0
                                                ? "text-red-400"
                                                : "text-emerald-400"
                                          }`}
                                        >
                                          {todayDifference > 0 ? "+" : ""}
                                          {formatNumber(todayDifference)} KG
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`rounded-md border px-2 py-1 text-[9px] font-medium ${status.className}`}
                                        >
                                          {status.label}
                                        </span>

                                        <ArrowRight
                                          size={14}
                                          className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-emerald-400"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* DESKTOP FIELD */}

                                  <div className="hidden md:block">
                                    <div className="mb-1.5 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-600">
                                        Field
                                      </span>

                                      <span className="text-xs font-semibold text-emerald-400">
                                        {formatNumber(todayField)} KG
                                      </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                                      <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${fieldWidth}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* DESKTOP FACTORY */}

                                  <div className="hidden md:block">
                                    <div className="mb-1.5 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-600">
                                        Factory
                                      </span>

                                      <span className="text-xs font-semibold text-blue-400">
                                        {formatNumber(todayFactory)} KG
                                      </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                                      <div
                                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${factoryWidth}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* DESKTOP STATUS */}

                                  <div className="hidden items-end justify-end gap-2 md:flex">
                                    <div className="text-right">
                                      <p
                                        className={`text-xs font-semibold ${
                                          todayDifference > 0
                                            ? "text-cyan-400"
                                            : todayDifference < 0
                                              ? "text-red-400"
                                              : "text-emerald-400"
                                        }`}
                                      >
                                        {todayDifference > 0 ? "+" : ""}
                                        {formatNumber(todayDifference)} KG
                                      </p>

                                      <span
                                        className={`mt-1 inline-flex rounded-md border px-2 py-1 text-[9px] font-medium ${status.className}`}
                                      >
                                        {status.label}
                                      </span>
                                    </div>

                                    <ArrowRight
                                      size={14}
                                      className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-emerald-400"
                                    />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    EXISTING PERIOD TOTALS
                ================================================= */}

                <section className="mt-5">
                  <div className="mb-3">
                    <h2 className="text-base font-semibold text-white sm:text-lg">
                      Period Totals
                    </h2>

                    <p className="mt-0.5 text-[10px] text-slate-700 sm:text-xs">
                      Cumulative values from the displayed period
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">

                    {/* FIELD */}

                    <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-500/70">
                          Total Field Weight
                        </span>

                        <Leaf
                          size={15}
                          className="text-emerald-500/70"
                        />
                      </div>

                      <p className="mt-1.5 text-xl font-bold text-emerald-400 sm:text-2xl">
                        {formatNumber(
                          summary?.totalTeaWeightKg || 0
                        )}
                        <span className="ml-1 text-[10px] font-normal text-slate-600 sm:text-xs">
                          KG
                        </span>
                      </p>
                    </div>

                    {/* FACTORY */}

                    <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-400/70">
                          Total Factory Weight
                        </span>

                        <Factory
                          size={15}
                          className="text-blue-400/70"
                        />
                      </div>

                      <p className="mt-1.5 text-xl font-bold text-blue-400 sm:text-2xl">
                        {formatNumber(
                          summary?.totalFactoryWeightKg || 0
                        )}
                        <span className="ml-1 text-[10px] font-normal text-slate-600 sm:text-xs">
                          KG
                        </span>
                      </p>
                    </div>

                    {/* DIFFERENCE */}

                    <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-400/70">
                          Total Difference
                        </span>

                        <Scale
                          size={15}
                          className="text-amber-400/70"
                        />
                      </div>

                      <p
                        className={`mt-1.5 text-xl font-bold sm:text-2xl ${
                          (summary?.totalDifferenceKg || 0) > 0
                            ? "text-cyan-400"
                            : (summary?.totalDifferenceKg || 0) < 0
                              ? "text-red-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {(summary?.totalDifferenceKg || 0) > 0
                          ? "+"
                          : ""}
                        {formatNumber(
                          summary?.totalDifferenceKg || 0
                        )}
                        <span className="ml-1 text-[10px] font-normal text-slate-600 sm:text-xs">
                          KG
                        </span>
                      </p>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    SEPARATE MONTHLY OVERVIEW
                ================================================= */}

                <section className="mt-8 border-t border-slate-800 pt-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                        Collection History
                      </p>

                      <h2 className="text-lg font-bold text-white sm:text-xl">
                        Monthly Overview
                      </h2>

                      <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs">
                        View factory collection totals across different periods.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={16}
                        className="shrink-0 text-slate-500"
                      />

                      <select
                        value={selectedMonthlyPeriod}
                        onChange={(event) =>
                          setSelectedMonthlyPeriod(
                            event.target.value as MonthlyPeriod
                          )
                        }
                        className="h-10 w-full min-w-0 rounded-lg border border-slate-800 bg-[#07140d] px-3 text-sm text-white outline-none transition focus:border-emerald-500 sm:w-[190px]"
                        style={{ colorScheme: "dark" }}
                      >
                        {MONTHLY_PERIOD_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          fetchMonthlyDashboard(
                            selectedMonthlyPeriod
                          )
                        }
                        disabled={monthlyLoading}
                        aria-label="Refresh monthly overview"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-[#07140d] text-slate-400 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50"
                      >
                        <RefreshCw
                          size={15}
                          className={
                            monthlyLoading ? "animate-spin" : ""
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {/* SELECTED PERIOD */}

                  {monthlyData && (
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-600 sm:text-xs">
                      <span className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-400">
                        {monthlyPeriodLabel}
                      </span>

                      <span>
                        {formatDateForDisplay(
                          monthlyData.fromDate
                        )}{" "}
                        –{" "}
                        {formatDateForDisplay(
                          monthlyData.toDate
                        )}
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
                            selectedMonthlyPeriod
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
                    <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-slate-800 bg-[#07140d]">
                      <div className="text-center">
                        <Loader2
                          size={25}
                          className="mx-auto animate-spin text-emerald-500"
                        />

                        <p className="mt-2 text-xs text-slate-600">
                          Loading monthly overview...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* MONTHLY SUMMARY CARDS */}

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">

                        {/* FIELD */}

                        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3.5 sm:p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-emerald-500/70">
                              Field Weight
                            </span>

                            <Leaf
                              size={15}
                              className="text-emerald-500/70"
                            />
                          </div>

                          <p className="mt-1.5 text-xl font-bold text-emerald-400 sm:text-2xl">
                            {formatNumber(
                              monthlySummary?.totalTeaWeightKg || 0
                            )}
                            <span className="ml-1 text-[10px] font-normal text-slate-600 sm:text-xs">
                              KG
                            </span>
                          </p>
                        </div>

                        {/* FACTORY */}

                        <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3.5 sm:p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-400/70">
                              Factory Weight
                            </span>

                            <Factory
                              size={15}
                              className="text-blue-400/70"
                            />
                          </div>

                          <p className="mt-1.5 text-xl font-bold text-blue-400 sm:text-2xl">
                            {formatNumber(
                              monthlySummary?.totalFactoryWeightKg || 0
                            )}
                            <span className="ml-1 text-[10px] font-normal text-slate-600 sm:text-xs">
                              KG
                            </span>
                          </p>
                        </div>

                        {/* DIFFERENCE */}

                        <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5 sm:p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-400/70">
                              Weight Difference
                            </span>

                            <Scale
                              size={15}
                              className="text-amber-400/70"
                            />
                          </div>

                          <p
                            className={`mt-1.5 text-xl font-bold sm:text-2xl ${
                              (monthlySummary?.totalDifferenceKg || 0) > 0
                                ? "text-cyan-400"
                                : (monthlySummary?.totalDifferenceKg || 0) < 0
                                  ? "text-red-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {(monthlySummary?.totalDifferenceKg || 0) > 0
                              ? "+"
                              : ""}
                            {formatNumber(
                              monthlySummary?.totalDifferenceKg || 0
                            )}
                            <span className="ml-1 text-[10px] font-normal text-slate-600 sm:text-xs">
                              KG
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* MONTHLY AREA COLLECTIONS */}

                      <div className="mt-5">
                        <div className="mb-3 flex items-end justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white sm:text-base">
                              Area Collections
                            </h3>

                            <p className="mt-0.5 text-[10px] text-slate-700 sm:text-xs">
                              Area-wise totals for the selected period
                            </p>
                          </div>

                          <span className="text-[10px] text-slate-700 sm:text-xs">
                            {monthlyAreas.length} areas
                          </span>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#07140d]">
                          {monthlyAreas.length === 0 ? (
                            <div className="flex min-h-[150px] items-center justify-center p-6 text-center">
                              <div>
                                <Leaf
                                  size={20}
                                  className="mx-auto text-slate-700"
                                />

                                <p className="mt-3 text-sm text-slate-500">
                                  No area data available
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-800/70">
                              {monthlyAreas.map((area) => {
                                const field = Number(
                                  area.todayTeaWeightKg || 0
                                );

                                const factory = Number(
                                  area.todayFactoryWeightKg || 0
                                );

                                const difference = Number(
                                  area.todayDifferenceKg || 0
                                );

                                const collections = Number(
                                  area.todayCollectionCount || 0
                                );

                                const status =
                                  getDifferenceStatus(difference);

                                const fieldWidth =
                                  field > 0
                                    ? Math.min(
                                        100,
                                        Math.max(
                                          3,
                                          (field / maxWeight) * 100
                                        )
                                      )
                                    : 0;

                                const factoryWidth =
                                  factory > 0
                                    ? Math.min(
                                        100,
                                        Math.max(
                                          3,
                                          (factory / maxWeight) * 100
                                        )
                                      )
                                    : 0;

                                return (
                                  <div
                                    key={area.areaId}
                                    className="p-3.5 sm:p-4 lg:px-5"
                                  >
                                    <div className="grid gap-3 md:grid-cols-[minmax(170px,1.2fr)_minmax(180px,1.8fr)_minmax(180px,1.8fr)_120px] md:items-center">

                                      {/* AREA NAME */}

                                      <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                          <Leaf size={15} />
                                        </div>

                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-white">
                                            {area.areaName}
                                          </p>

                                          <p className="mt-0.5 text-[10px] text-slate-700">
                                            {collections} collection
                                            {collections !== 1 ? "s" : ""}
                                          </p>
                                        </div>
                                      </div>

                                      {/* FIELD */}

                                      <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                          <span className="text-[10px] text-slate-600">
                                            Field Weight
                                          </span>

                                          <span className="text-xs font-semibold text-emerald-400">
                                            {formatNumber(field)} KG
                                          </span>
                                        </div>

                                        <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                                          <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{
                                              width: `${fieldWidth}%`,
                                            }}
                                          />
                                        </div>
                                      </div>

                                      {/* FACTORY */}

                                      <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                          <span className="text-[10px] text-slate-600">
                                            Factory Weight
                                          </span>

                                          <span className="text-xs font-semibold text-blue-400">
                                            {formatNumber(factory)} KG
                                          </span>
                                        </div>

                                        <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                                          <div
                                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                            style={{
                                              width: `${factoryWidth}%`,
                                            }}
                                          />
                                        </div>
                                      </div>

                                      {/* DIFFERENCE */}

                                      <div className="flex items-center justify-between gap-2 md:justify-end">
                                        <div className="text-left md:text-right">
                                          <p
                                            className={`text-xs font-semibold ${
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

                                          <span
                                            className={`mt-1 inline-flex rounded-md border px-2 py-1 text-[9px] font-medium ${status.className}`}
                                          >
                                            {status.label}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* MONTHLY TOTALS */}

                      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        <div className="rounded-lg border border-slate-800 bg-[#07140d] p-3">
                          <p className="text-[10px] text-slate-600">
                            Active Areas
                          </p>

                          <p className="mt-1 text-lg font-bold text-white">
                            {monthlySummary?.collectedAreas || 0}
                            <span className="ml-1 text-xs font-normal text-slate-600">
                              / {monthlySummary?.totalAreas || 0}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-[#07140d] p-3">
                          <p className="text-[10px] text-slate-600">
                            Total Collections
                          </p>

                          <p className="mt-1 text-lg font-bold text-white">
                            {formatNumber(
                              monthlySummary?.totalCollections || 0
                            )}
                          </p>
                        </div>

                        <div className="col-span-2 rounded-lg border border-slate-800 bg-[#07140d] p-3 sm:col-span-1">
                          <p className="text-[10px] text-slate-600">
                            Selected Period
                          </p>

                          <p className="mt-1 text-sm font-semibold text-emerald-400">
                            {monthlyPeriodLabel}
                          </p>
                        </div>
                      </div>
                    </>
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
