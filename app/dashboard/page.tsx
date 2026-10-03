
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

  // SELECTED DATE ONLY
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

  // SELECTED DATE
  today: {
    teaWeightKg: number;
    factoryWeightKg: number;
    differenceKg: number;
    collectionCount: number;
  };

  // CUMULATIVE: 01/10/2026 -> selected date
  summary: {
    totalAreas: number;
    collectedAreas: number;

    totalTeaWeightKg: number;
    totalFactoryWeightKg: number;
    totalDifferenceKg: number;

    totalCollections: number;
  };

  // SELECTED DATE AREA DATA ONLY
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

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [selectedDate, setSelectedDate] =
    useState(getTodaySriLanka());

  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     FETCH DASHBOARD
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
        throw new Error(
          "Invalid dashboard response."
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load dashboard."
        );
      }

      setData(result);
    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

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
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, []);

  /* =======================================================
     DATE CHANGE
  ======================================================= */

  useEffect(() => {
    if (!selectedDate) return;

    fetchDashboard(selectedDate);
  }, [selectedDate]);

  /* =======================================================
     DATA
  ======================================================= */

  const today = data?.today;

  const summary = data?.summary;

  /*
    IMPORTANT:
    areas contains SELECTED DATE ONLY.
  */
  const areas = data?.areas || [];

  /* =======================================================
     MAX AREA WEIGHT
     
     Used ONLY for today's bars.
  ======================================================= */

  const maxWeight =
    areas.length > 0
      ? Math.max(
          ...areas.flatMap((area) => [
            Number(
              area.todayTeaWeightKg || 0
            ),
            Number(
              area.todayFactoryWeightKg || 0
            ),
          ]),
          1
        )
      : 1;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#020a06] text-white">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* ===================================================
          MAIN
      =================================================== */}

      <div className="lg:pl-72">

        <Header
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="p-3 sm:p-5 lg:p-8">

          <div className="mx-auto max-w-[1600px]">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-5 flex flex-col gap-4 sm:mb-6 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <p className="mb-1 text-[10px] font-semibold tracking-widest text-emerald-400 sm:text-xs">
                  COOROONDOOWATTE TEA FACTORY
                </p>

                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                  Factory Overview
                </h1>

                <p className="mt-1 text-[11px] text-slate-500 sm:text-sm">
                  Daily and cumulative tea collection overview.
                </p>

              </div>

              {/* =================================================
                  DATE
              ================================================= */}

              <div className="flex w-full items-center gap-2 sm:w-auto">

                <div className="relative min-w-0 flex-1 sm:flex-none">

                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) =>
                      setSelectedDate(
                        event.target.value
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-2 text-xs text-white outline-none transition focus:border-emerald-500 sm:h-11 sm:w-auto sm:pl-10 sm:pr-4 sm:text-sm"
                    style={{
                      colorScheme: "dark",
                    }}
                  />

                </div>

                {/* REFRESH */}

                <button
                  type="button"
                  onClick={() =>
                    fetchDashboard(
                      selectedDate
                    )
                  }
                  disabled={loading}
                  className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-medium text-slate-400 transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
                >

                  <RefreshCw
                    size={14}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  <span>
                    Refresh
                  </span>

                </button>

              </div>

            </div>

            {/* =================================================
                PERIOD
            ================================================= */}

            <div className="mb-5 flex flex-col gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-4">

              <div className="flex min-w-0 items-center gap-2.5">

                <CalendarDays
                  size={16}
                  className="shrink-0 text-emerald-400"
                />

                <div className="min-w-0">

                  <p className="text-[10px] text-slate-600 sm:text-xs">
                    Collection Period
                  </p>

                  <p className="truncate text-xs font-semibold text-white sm:text-sm">

                    {formatDateForDisplay(
                      data?.fromDate ||
                        "2026-10-01"
                    )}

                    <span className="mx-1.5 text-slate-600">
                      →
                    </span>

                    {formatDateForDisplay(
                      data?.toDate ||
                        selectedDate
                    )}

                  </p>

                </div>

              </div>

              <p className="text-[10px] text-slate-600 sm:text-xs">
                Cumulative total up to selected date
              </p>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 sm:flex-row sm:items-center sm:justify-between sm:p-4 sm:text-sm">

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    fetchDashboard(
                      selectedDate
                    )
                  }
                  className="w-fit rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  Try Again
                </button>

              </div>
            )}

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && !data ? (

              <div className="flex min-h-[400px] items-center justify-center">

                <div className="text-center">

                  <Loader2
                    size={32}
                    className="mx-auto animate-spin text-emerald-500"
                  />

                  <p className="mt-3 text-xs text-slate-500">
                    Loading factory data...
                  </p>

                </div>

              </div>

            ) : (

              <>

                {/* =================================================
                    TOP STAT CARDS
                ================================================= */}

                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">

                  {/* FIELD */}

                  <div className="group rounded-xl border border-slate-800 bg-[#07140d] p-3 transition duration-300 hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-950/20 sm:rounded-2xl sm:p-4">

                    <div className="flex items-center justify-between gap-2">

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-[9px] font-medium text-slate-500 sm:text-xs">
                          Field Weight
                        </p>

                        {/* TODAY */}

                        <p className="mt-1 text-base font-bold leading-tight text-white sm:text-xl">

                          {formatNumber(
                            today?.teaWeightKg ||
                              0
                          )}{" "}

                          <span className="text-[9px] font-medium text-slate-500 sm:text-xs">
                            KG
                          </span>

                        </p>

                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 sm:h-10 sm:w-10">

                        <Leaf
                          size={16}
                          className="sm:h-5 sm:w-5"
                        />

                      </div>

                    </div>

                    {/* CUMULATIVE */}

                    <p className="mt-2 truncate text-[8px] text-slate-600 sm:text-[10px]">

                      Total:{" "}

                      <span className="font-medium text-emerald-400/80">

                        {formatNumber(
                          summary?.totalTeaWeightKg ||
                            0
                        )}{" "}
                        KG

                      </span>

                    </p>

                  </div>

                  {/* FACTORY */}

                  <div className="group rounded-xl border border-slate-800 bg-[#07140d] p-3 transition duration-300 hover:border-blue-800 hover:shadow-lg hover:shadow-blue-950/20 sm:rounded-2xl sm:p-4">

                    <div className="flex items-center justify-between gap-2">

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-[9px] font-medium text-slate-500 sm:text-xs">
                          Factory Weight
                        </p>

                        <p className="mt-1 text-base font-bold leading-tight text-white sm:text-xl">

                          {formatNumber(
                            today?.factoryWeightKg ||
                              0
                          )}{" "}

                          <span className="text-[9px] font-medium text-slate-500 sm:text-xs">
                            KG
                          </span>

                        </p>

                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 sm:h-10 sm:w-10">

                        <Factory
                          size={16}
                          className="sm:h-5 sm:w-5"
                        />

                      </div>

                    </div>

                    <p className="mt-2 truncate text-[8px] text-slate-600 sm:text-[10px]">

                      Total:{" "}

                      <span className="font-medium text-blue-400/80">

                        {formatNumber(
                          summary?.totalFactoryWeightKg ||
                            0
                        )}{" "}
                        KG

                      </span>

                    </p>

                  </div>

                  {/* DIFFERENCE */}

                  <div className="group rounded-xl border border-slate-800 bg-[#07140d] p-3 transition duration-300 hover:border-amber-800 hover:shadow-lg hover:shadow-amber-950/20 sm:rounded-2xl sm:p-4">

                    <div className="flex items-center justify-between gap-2">

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-[9px] font-medium text-slate-500 sm:text-xs">
                          Weight Difference
                        </p>

                        <p
                          className={`mt-1 text-base font-bold leading-tight sm:text-xl ${
                            (
                              today?.differenceKg ||
                              0
                            ) > 0
                              ? "text-cyan-400"
                              : (
                                    today?.differenceKg ||
                                    0
                                  ) < 0
                                ? "text-red-400"
                                : "text-emerald-400"
                          }`}
                        >

                          {(
                            today?.differenceKg ||
                            0
                          ) > 0
                            ? "+"
                            : ""}

                          {formatNumber(
                            today?.differenceKg ||
                              0
                          )}{" "}

                          <span className="text-[9px] font-medium text-slate-500 sm:text-xs">
                            KG
                          </span>

                        </p>

                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 sm:h-10 sm:w-10">

                        <Scale
                          size={16}
                          className="sm:h-5 sm:w-5"
                        />

                      </div>

                    </div>

                    <p className="mt-2 truncate text-[8px] text-slate-600 sm:text-[10px]">

                      Total:{" "}

                      <span
                        className={`font-medium ${
                          (
                            summary?.totalDifferenceKg ||
                            0
                          ) > 0
                            ? "text-cyan-400/80"
                            : (
                                  summary?.totalDifferenceKg ||
                                  0
                                ) < 0
                              ? "text-red-400/80"
                              : "text-emerald-400/80"
                        }`}
                      >

                        {(
                          summary?.totalDifferenceKg ||
                          0
                        ) > 0
                          ? "+"
                          : ""}

                        {formatNumber(
                          summary?.totalDifferenceKg ||
                            0
                        )}{" "}
                        KG

                      </span>

                    </p>

                  </div>

                  {/* AREAS */}

                  <div className="group rounded-xl border border-slate-800 bg-[#07140d] p-3 transition duration-300 hover:border-purple-800 hover:shadow-lg hover:shadow-purple-950/20 sm:rounded-2xl sm:p-4">

                    <div className="flex items-center justify-between gap-2">

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-[9px] font-medium text-slate-500 sm:text-xs">
                          Areas
                        </p>

                        <p className="mt-1 text-base font-bold leading-tight text-white sm:text-xl">

                          {summary?.collectedAreas ||
                            0}

                          <span className="text-xs text-slate-600 sm:text-sm">
                            {" "}
                            /{" "}
                            {summary?.totalAreas ||
                              0}
                          </span>

                        </p>

                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 sm:h-10 sm:w-10">

                        <Users
                          size={16}
                          className="sm:h-5 sm:w-5"
                        />

                      </div>

                    </div>

                    <p className="mt-2 truncate text-[8px] text-slate-600 sm:text-[10px]">

                      Total collections:{" "}

                      <span className="font-medium text-purple-400/80">

                        {formatNumber(
                          summary?.totalCollections ||
                            0
                        )}

                      </span>

                    </p>

                  </div>

                </div>

                {/* =================================================
                    TODAY QUICK SUMMARY
                ================================================= */}

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-3 sm:gap-4">

                  {/* COLLECTION COUNT */}

                  <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3 sm:rounded-2xl sm:p-4">

                    <p className="text-[8px] uppercase tracking-wider text-slate-600 sm:text-[10px]">
                      Selected Day Collections
                    </p>

                    <p className="mt-1 text-base font-bold text-white sm:text-xl">

                      {formatNumber(
                        today?.collectionCount ||
                          0
                      )}

                    </p>

                  </div>

                  {/* FIELD */}

                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 sm:rounded-2xl sm:p-4">

                    <p className="text-[8px] uppercase tracking-wider text-emerald-500/60 sm:text-[10px]">
                      Selected Day Field
                    </p>

                    <p className="mt-1 text-base font-bold text-emerald-400 sm:text-xl">

                      {formatNumber(
                        today?.teaWeightKg ||
                          0
                      )}{" "}

                      <span className="text-[9px] sm:text-xs">
                        KG
                      </span>

                    </p>

                  </div>

                  {/* FACTORY */}

                  <div className="col-span-2 rounded-xl border border-blue-500/10 bg-blue-500/5 p-3 sm:col-span-1 sm:rounded-2xl sm:p-4">

                    <p className="text-[8px] uppercase tracking-wider text-blue-400/60 sm:text-[10px]">
                      Selected Day Factory
                    </p>

                    <p className="mt-1 text-base font-bold text-blue-400 sm:text-xl">

                      {formatNumber(
                        today?.factoryWeightKg ||
                          0
                      )}{" "}

                      <span className="text-[9px] sm:text-xs">
                        KG
                      </span>

                    </p>

                  </div>

                </div>

                {/* =================================================
                    TODAY'S AREA COLLECTIONS
                ================================================= */}

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-[#07140d] sm:mt-6 sm:rounded-2xl">

                  {/* HEADER */}

                  <div className="border-b border-slate-800 p-3 sm:p-5">

                    <div className="flex items-center justify-between gap-3">

                      <div className="min-w-0">

                        <h2 className="text-sm font-semibold text-white sm:text-base">
                          Today&apos;s Area Collections
                        </h2>

                        <p className="mt-1 text-[9px] text-slate-600 sm:text-xs">

                          Collection details for{" "}

                          {formatDateForDisplay(
                            data?.date ||
                              selectedDate
                          )}

                        </p>

                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 text-[9px] text-slate-600 sm:text-xs">

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 sm:h-2 sm:w-2" />

                        {areas.length} areas

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      NO DATA
                  ================================================= */}

                  {areas.length === 0 ? (

                    <div className="flex min-h-[250px] items-center justify-center px-5">

                      <div className="text-center">

                        <Leaf
                          size={34}
                          className="mx-auto text-slate-700"
                        />

                        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                          No collection recorded for this date.
                        </p>

                        <p className="mt-1 text-[10px] text-slate-700 sm:text-xs">
                          Select another date to view its collections.
                        </p>

                      </div>

                    </div>

                  ) : (

                    /* =================================================
                       AREA LIST
                    ================================================= */

                    <div className="divide-y divide-slate-800/70">

                      {areas.map((area) => {

                        /* ===========================================
                           TODAY VALUES ONLY
                        =========================================== */

                        const todayField =
                          Number(
                            area.todayTeaWeightKg ||
                              0
                          );

                        const todayFactory =
                          Number(
                            area.todayFactoryWeightKg ||
                              0
                          );

                        const todayDifference =
                          Number(
                            area.todayDifferenceKg ||
                              0
                          );

                        const todayCollections =
                          Number(
                            area.todayCollectionCount ||
                              0
                          );

                        const status =
                          getDifferenceStatus(
                            todayDifference
                          );

                        /* ===========================================
                           TODAY BAR WIDTHS ONLY
                        =========================================== */

                        const fieldWidth =
                          todayField > 0
                            ? Math.max(
                                3,
                                (todayField /
                                  maxWeight) *
                                  100
                              )
                            : 0;

                        const factoryWidth =
                          todayFactory > 0
                            ? Math.max(
                                3,
                                (todayFactory /
                                  maxWeight) *
                                  100
                              )
                            : 0;

                        return (

                          <Link
                            key={area.areaId}
                            href={`/dashboard/areas/${encodeURIComponent(
                              area.areaId
                            )}?date=${encodeURIComponent(
                              data?.date ||
                                selectedDate
                            )}`}
                            className="group block p-3 transition hover:bg-slate-900/30 sm:p-5"
                          >

                            {/* =======================================
                                AREA HEADER
                            ======================================= */}

                            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">

                              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">

                                <div className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 px-2 text-[10px] font-bold text-emerald-400 sm:h-10 sm:min-w-10 sm:rounded-xl sm:px-3 sm:text-sm">

                                  {area.areaName}

                                </div>

                                <div className="min-w-0">

                                  <p className="truncate text-xs font-semibold text-white sm:text-sm">
                                    {area.areaName}
                                  </p>

                                  <p className="text-[9px] text-slate-600 sm:text-xs">

                                    {todayCollections} collection
                                    {todayCollections !== 1
                                      ? "s"
                                      : ""}

                                  </p>

                                </div>

                              </div>

                              <ArrowRight
                                size={16}
                                className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-400"
                              />

                            </div>

                            {/* =======================================
                                TODAY FIELD WEIGHT BAR
                            ======================================= */}

                            <div className="mb-4 sm:mb-5">

                              <div className="mb-1.5 flex items-center justify-between">

                                <div className="flex items-center gap-1.5">

                                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                                  <span className="text-[9px] font-medium text-slate-500 sm:text-xs">
                                    Field Weight
                                  </span>

                                </div>

                                <span className="text-[9px] font-semibold text-white sm:text-xs">

                                  {formatNumber(
                                    todayField
                                  )}{" "}
                                  KG

                                </span>

                              </div>

                              <div className="relative h-8 overflow-hidden rounded-lg bg-slate-900 sm:h-10 sm:rounded-xl">

                                <div
                                  className="absolute inset-y-0 left-0 rounded-lg bg-emerald-500/80 transition-all duration-500 group-hover:bg-emerald-400 sm:rounded-xl"
                                  style={{
                                    width: `${fieldWidth}%`,
                                  }}
                                />

                                <div className="relative z-10 flex h-full items-center px-2.5 sm:px-3">

                                  <span className="truncate text-[9px] font-semibold text-white sm:text-xs">

                                    {formatNumber(
                                      todayField
                                    )}{" "}
                                    KG

                                  </span>

                                </div>

                              </div>

                            </div>

                            {/* =======================================
                                TODAY FACTORY WEIGHT BAR
                            ======================================= */}

                            <div className="mb-4 sm:mb-5">

                              <div className="mb-1.5 flex items-center justify-between">

                                <div className="flex items-center gap-1.5">

                                  <span className="h-2 w-2 rounded-full bg-blue-400" />

                                  <span className="text-[9px] font-medium text-slate-500 sm:text-xs">
                                    Factory Weight
                                  </span>

                                </div>

                                <span className="text-[9px] font-semibold text-blue-400 sm:text-xs">

                                  {formatNumber(
                                    todayFactory
                                  )}{" "}
                                  KG

                                </span>

                              </div>

                              <div className="relative h-8 overflow-hidden rounded-lg bg-slate-900 sm:h-10 sm:rounded-xl">

                                <div
                                  className="absolute inset-y-0 left-0 rounded-lg bg-blue-500/70 transition-all duration-500 group-hover:bg-blue-400/80 sm:rounded-xl"
                                  style={{
                                    width: `${factoryWidth}%`,
                                  }}
                                />

                                <div className="relative z-10 flex h-full items-center px-2.5 sm:px-3">

                                  <span className="truncate text-[9px] font-semibold text-white sm:text-xs">

                                    {formatNumber(
                                      todayFactory
                                    )}{" "}
                                    KG

                                  </span>

                                </div>

                              </div>

                            </div>

                            {/* =======================================
                                TODAY DETAILS
                            ======================================= */}

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-800 pt-3 sm:grid-cols-4 sm:gap-3 sm:pt-4">

                              {/* FIELD */}

                              <div className="min-w-0">

                                <span className="block text-[8px] text-slate-600 sm:text-xs">
                                  Field Total
                                </span>

                                <span className="mt-0.5 block truncate text-[10px] font-semibold text-white sm:text-xs">

                                  {formatNumber(
                                    todayField
                                  )}{" "}
                                  KG

                                </span>

                              </div>

                              {/* FACTORY */}

                              <div className="min-w-0">

                                <span className="block text-[8px] text-slate-600 sm:text-xs">
                                  Factory Total
                                </span>

                                <span className="mt-0.5 block truncate text-[10px] font-semibold text-blue-400 sm:text-xs">

                                  {formatNumber(
                                    todayFactory
                                  )}{" "}
                                  KG

                                </span>

                              </div>

                              {/* DIFFERENCE */}

                              <div className="min-w-0">

                                <span className="block text-[8px] text-slate-600 sm:text-xs">
                                  Difference
                                </span>

                                <span
                                  className={`mt-0.5 block truncate text-[10px] font-semibold sm:text-xs ${
                                    todayDifference > 0
                                      ? "text-cyan-400"
                                      : todayDifference < 0
                                        ? "text-red-400"
                                        : "text-emerald-400"
                                  }`}
                                >

                                  {todayDifference > 0
                                    ? "+"
                                    : ""}

                                  {formatNumber(
                                    todayDifference
                                  )}{" "}
                                  KG

                                </span>

                              </div>

                              {/* STATUS */}

                              <div className="min-w-0">

                                <span className="hidden text-[8px] text-slate-600 sm:block sm:text-xs">
                                  Status
                                </span>

                                <span
                                  className={`mt-1 inline-flex rounded-md border px-2 py-1 text-[8px] font-medium sm:text-[10px] ${status.className}`}
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
                    CUMULATIVE TOTAL SUMMARY
                ================================================= */}

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4">

                  {/* FIELD */}

                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 sm:rounded-2xl sm:p-5">

                    <p className="text-[9px] uppercase tracking-wider text-emerald-500/70 sm:text-xs">
                      Total Field Weight
                    </p>

                    <p className="mt-1 text-lg font-bold text-emerald-400 sm:text-2xl">

                      {formatNumber(
                        summary?.totalTeaWeightKg ||
                          0
                      )}{" "}

                      <span className="text-[10px] sm:text-sm">
                        KG
                      </span>

                    </p>

                  </div>

                  {/* FACTORY */}

                  <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3 sm:rounded-2xl sm:p-5">

                    <p className="text-[9px] uppercase tracking-wider text-blue-400/70 sm:text-xs">
                      Factory Weight Total
                    </p>

                    <p className="mt-1 text-lg font-bold text-blue-400 sm:text-2xl">

                      {formatNumber(
                        summary?.totalFactoryWeightKg ||
                          0
                      )}{" "}

                      <span className="text-[10px] sm:text-sm">
                        KG
                      </span>

                    </p>

                  </div>

                  {/* DIFFERENCE */}

                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 sm:rounded-2xl sm:p-5">

                    <p className="text-[9px] uppercase tracking-wider text-amber-400/70 sm:text-xs">
                      Total Difference
                    </p>

                    <p
                      className={`mt-1 text-lg font-bold sm:text-2xl ${
                        (
                          summary?.totalDifferenceKg ||
                          0
                        ) > 0
                          ? "text-cyan-400"
                          : (
                                summary?.totalDifferenceKg ||
                                0
                              ) < 0
                            ? "text-red-400"
                            : "text-emerald-400"
                      }`}
                    >

                      {(
                        summary?.totalDifferenceKg ||
                        0
                      ) > 0
                        ? "+"
                        : ""}

                      {formatNumber(
                        summary?.totalDifferenceKg ||
                          0
                      )}{" "}

                      <span className="text-[10px] sm:text-sm">
                        KG
                      </span>

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

