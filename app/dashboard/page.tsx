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

interface AreaCollection {
  areaId: string;
  areaName: string;

  totalTeaWeightKg: number;
  totalFactoryWeightKg: number;
  totalDifferenceKg: number;

  collectionCount: number;
  latestCollectionId?: string;
}

interface DashboardResponse {
  success: boolean;
  message?: string;

  date: string;
  fromDate: string;
  toDate: string;

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

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 2,
  });
}

function formatDateForDisplay(date: string) {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

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

  const year =
    parts.find((part) => part.type === "year")?.value ?? "";

  const month =
    parts.find((part) => part.type === "month")?.value ?? "";

  const day =
    parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function getDifferenceStatus(difference: number) {
  if (difference === 0) {
    return {
      label: "Matched",
      className:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }

  if (difference > 0) {
    return {
      label: "Factory More",
      className:
        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };
  }

  return {
    label: "Factory Less",
    className:
      "bg-red-500/10 text-red-400 border-red-500/20",
  };
}

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [selectedDate, setSelectedDate] =
    useState(getTodaySriLanka());

  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =====================================================
     FETCH DASHBOARD
  ===================================================== */

  async function fetchDashboard(
    date: string = selectedDate
  ) {
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
        throw new Error("Invalid dashboard response");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load dashboard"
        );
      }

      setData(result);
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, []);

  const summary = data?.summary;

  const areas = data?.areas || [];

  /* =====================================================
     MAX WEIGHT

     Field + Factory bars use SAME SCALE
  ===================================================== */

  function getMaxWeight() {
    if (!data || data.areas.length === 0) {
      return 1;
    }

    const values = data.areas.flatMap((area) => [
      Number(area.totalTeaWeightKg || 0),
      Number(area.totalFactoryWeightKg || 0),
    ]);

    return Math.max(...values, 1);
  }

  const maxWeight = getMaxWeight();

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="lg:pl-72">
        <Header
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-400">
                  COOROONDOOWATTE TEA
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Factory Overview
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  View cumulative tea weight and factory weight by
                  area.
                </p>
              </div>

              {/* =================================================
                  DATE FILTER
              ================================================= */}

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {/* DATE SELECTOR */}

                <div className="relative w-full sm:w-auto">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white"
                  />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) =>
                      setSelectedDate(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 pl-11 pr-4 text-sm text-white outline-none transition focus:border-emerald-500 sm:w-auto"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                </div>

                {/* REFRESH */}

                <button
                  type="button"
                  onClick={() =>
                    fetchDashboard(selectedDate)
                  }
                  disabled={loading}
                  className="flex h-9 w-fit self-end items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-medium text-slate-400 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50 sm:h-11 sm:self-auto sm:px-4 sm:text-sm"
                >
                  <RefreshCw
                    size={14}
                    className={
                      loading ? "animate-spin" : ""
                    }
                  />

                  Refresh
                </button>
              </div>
            </div>

            {/* =================================================
                SELECTED DATE / PERIOD
            ================================================= */}

            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays
                  size={18}
                  className="text-emerald-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Collection Period
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-white">
                    01 October 2026

                    <span className="mx-2 text-slate-600">
                      →
                    </span>

                    {formatDateForDisplay(
                      data?.toDate || selectedDate
                    )}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Cumulative total up to selected date
              </p>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() =>
                    fetchDashboard(selectedDate)
                  }
                  className="rounded-lg border border-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500/10"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && !data ? (
              <div className="flex min-h-[500px] items-center justify-center">
                <div className="text-center">
                  <Loader2
                    size={36}
                    className="mx-auto animate-spin text-emerald-500"
                  />

                  <p className="mt-4 text-sm text-slate-500">
                    Loading factory data...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* =================================================
                    MAIN TOTALS
                ================================================= */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  {/* FIELD WEIGHT */}

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Total Field Weight
                        </p>

                        <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                          {formatNumber(
                            summary?.totalTeaWeightKg || 0
                          )}{" "}
                          <span className="text-sm font-medium text-slate-500">
                            KG
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Cumulative field collection
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-500/10 p-3">
                        <Leaf
                          size={22}
                          className="text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FACTORY WEIGHT */}

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Total Factory Weight
                        </p>

                        <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                          {formatNumber(
                            summary?.totalFactoryWeightKg || 0
                          )}{" "}
                          <span className="text-sm font-medium text-slate-500">
                            KG
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Cumulative factory scale
                        </p>
                      </div>

                      <div className="rounded-xl bg-blue-500/10 p-3">
                        <Factory
                          size={22}
                          className="text-blue-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DIFFERENCE */}

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Weight Difference
                        </p>

                        <p
                          className={`mt-3 text-2xl font-bold sm:text-3xl ${
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
                          )}{" "}
                          <span className="text-sm font-medium text-slate-500">
                            KG
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Factory weight − field weight
                        </p>
                      </div>

                      <div className="rounded-xl bg-amber-500/10 p-3">
                        <Scale
                          size={22}
                          className="text-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AREAS */}

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Areas
                        </p>

                        <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                          {summary?.collectedAreas || 0}

                          <span className="text-lg text-slate-600">
                            {" "}
                            / {summary?.totalAreas || 0}
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Areas collected
                        </p>
                      </div>

                      <div className="rounded-xl bg-purple-500/10 p-3">
                        <Users
                          size={22}
                          className="text-purple-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    AREA COLLECTIONS
                ================================================= */}

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d]">

                  <div className="border-b border-slate-800 p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-semibold text-white">
                          All Area Collections
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Cumulative from 01/10/2026 to{" "}
                          {formatDateForDisplay(
                            data?.toDate || selectedDate
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        {areas.length} areas
                      </div>
                    </div>
                  </div>

                  {areas.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center px-5">
                      <div className="text-center">
                        <Leaf
                          size={40}
                          className="mx-auto text-slate-700"
                        />

                        <p className="mt-4 text-sm text-slate-500">
                          No collection recorded for this period.
                        </p>

                        <p className="mt-1 text-xs text-slate-700">
                          Select another date to view previous
                          records.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/70">

                      {areas.map((area) => {
                        const status =
                          getDifferenceStatus(
                            area.totalDifferenceKg
                          );

                        const fieldWidth =
                          area.totalTeaWeightKg > 0
                            ? Math.max(
                                3,
                                (area.totalTeaWeightKg /
                                  maxWeight) *
                                  100
                              )
                            : 0;

                        const factoryWidth =
                          area.totalFactoryWeightKg > 0
                            ? Math.max(
                                3,
                                (area.totalFactoryWeightKg /
                                  maxWeight) *
                                  100
                              )
                            : 0;

                        return (
                          <Link
                            key={area.areaId}
                            href={`/dashboard/areas/${encodeURIComponent(
                              area.areaId
                            )}?from=2026-10-01&to=${encodeURIComponent(
                              data?.toDate || selectedDate
                            )}`}
                            className="group block p-5 transition hover:bg-slate-900/30"
                          >

                            {/* AREA HEADER */}

                            <div className="mb-5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">

                                <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-emerald-500/10 px-3 text-sm font-bold text-emerald-400">
                                  {area.areaName}
                                </div>

                                <div>
                                  <p className="font-semibold text-white">
                                    {area.areaName}
                                  </p>

                                  <p className="text-xs text-slate-600">
                                    {area.collectionCount}{" "}
                                    collection
                                    {area.collectionCount !== 1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>
                              </div>

                              <ArrowRight
                                size={18}
                                className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-400"
                              />
                            </div>

                            {/* FIELD WEIGHT BAR */}

                            <div className="mb-5">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

                                  <span className="text-xs font-medium text-slate-400">
                                    Field Weight
                                  </span>
                                </div>

                                <span className="text-xs font-semibold text-white">
                                  {formatNumber(
                                    area.totalTeaWeightKg
                                  )}{" "}
                                  KG
                                </span>
                              </div>

                              <div className="relative h-10 overflow-hidden rounded-xl bg-slate-900">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-xl bg-emerald-500/80 transition-all duration-500 group-hover:bg-emerald-400"
                                  style={{
                                    width: `${fieldWidth}%`,
                                  }}
                                />

                                <div className="relative z-10 flex h-full items-center px-3">
                                  <span className="text-xs font-semibold text-white">
                                    {area.totalTeaWeightKg > 0
                                      ? `${formatNumber(
                                          area.totalTeaWeightKg
                                        )} KG`
                                      : "No field collection"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* FACTORY WEIGHT BAR */}

                            <div className="mb-5">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />

                                  <span className="text-xs font-medium text-slate-400">
                                    Factory Weight
                                  </span>
                                </div>

                                <span className="text-xs font-semibold text-blue-400">
                                  {formatNumber(
                                    area.totalFactoryWeightKg
                                  )}{" "}
                                  KG
                                </span>
                              </div>

                              <div className="relative h-10 overflow-hidden rounded-xl bg-slate-900">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-xl bg-blue-500/70 transition-all duration-500 group-hover:bg-blue-400/80"
                                  style={{
                                    width: `${factoryWidth}%`,
                                  }}
                                />

                                <div className="relative z-10 flex h-full items-center px-3">
                                  <span className="text-xs font-semibold text-white">
                                    {area.totalFactoryWeightKg > 0
                                      ? `${formatNumber(
                                          area.totalFactoryWeightKg
                                        )} KG`
                                      : "No factory weight"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* VALUES */}

                            <div className="grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-4">

                              {/* FIELD */}

                              <div className="flex items-center justify-between sm:block">
                                <span className="text-xs text-slate-500">
                                  Field Total
                                </span>

                                <span className="font-semibold text-white sm:mt-1 sm:block">
                                  {formatNumber(
                                    area.totalTeaWeightKg
                                  )}{" "}
                                  KG
                                </span>
                              </div>

                              {/* FACTORY */}

                              <div className="flex items-center justify-between sm:block">
                                <span className="text-xs text-slate-500">
                                  Factory Total
                                </span>

                                <span className="font-semibold text-blue-400 sm:mt-1 sm:block">
                                  {formatNumber(
                                    area.totalFactoryWeightKg
                                  )}{" "}
                                  KG
                                </span>
                              </div>

                              {/* DIFFERENCE */}

                              <div className="flex items-center justify-between sm:block">
                                <span className="text-xs text-slate-500">
                                  Difference
                                </span>

                                <span
                                  className={`font-semibold sm:mt-1 sm:block ${
                                    area.totalDifferenceKg > 0
                                      ? "text-cyan-400"
                                      : area.totalDifferenceKg < 0
                                        ? "text-red-400"
                                        : "text-emerald-400"
                                  }`}
                                >
                                  {area.totalDifferenceKg > 0
                                    ? "+"
                                    : ""}

                                  {formatNumber(
                                    area.totalDifferenceKg
                                  )}{" "}
                                  KG
                                </span>
                              </div>

                              {/* STATUS */}

                              <div className="flex items-center justify-between sm:block">
                                <span className="text-xs text-slate-500">
                                  Status
                                </span>

                                <span
                                  className={`mt-1 inline-flex rounded-lg border px-3 py-1 text-xs font-medium ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                    </div>
                  )}
                </div>

                {/* =================================================
                    TOTAL SUMMARY
                ================================================= */}

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  {/* FIELD */}

                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
                    <p className="text-xs uppercase tracking-wider text-emerald-500/70">
                      Total Field Weight
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      {formatNumber(
                        summary?.totalTeaWeightKg || 0
                      )}{" "}
                      KG
                    </p>
                  </div>

                  {/* FACTORY */}

                  <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
                    <p className="text-xs uppercase tracking-wider text-blue-400/70">
                      Factory Weight Total
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-400">
                      {formatNumber(
                        summary?.totalFactoryWeightKg || 0
                      )}{" "}
                      KG
                    </p>
                  </div>

                  {/* DIFFERENCE */}

                  <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5">
                    <p className="text-xs uppercase tracking-wider text-amber-400/70">
                      Total Difference
                    </p>

                    <p
                      className={`mt-2 text-2xl font-bold ${
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
                      )}{" "}
                      KG
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}