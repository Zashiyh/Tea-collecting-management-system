"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Factory,
  Leaf,
  Loader2,
  RefreshCw,
  Scale,
  Users,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface AreaCollection {
  areaId: string;
  areaName: string;
  teaWeightKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  collectionId?: string;
}

interface DashboardResponse {
  success: boolean;
  message?: string;

  date: string;

  summary: {
    totalAreas: number;
    collectedAreas: number;
    totalTeaWeightKg: number;
    totalFactoryWeightKg: number;
    totalDifferenceKg: number;
    totalSuppliers: number;
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

  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(
    new Date(`${date}T00:00:00+05:30`)
  );
}

function getTodaySriLanka() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDifferenceStatus(
  difference: number
) {
  if (difference === 0) {
    return {
      label: "Matched",
      className:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }

  if (difference > 0) {
    return {
      label: "Factory Less",
      className:
        "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
  }

  return {
    label: "Factory More",
    className:
      "bg-red-500/10 text-red-400 border-red-500/20",
  };
}

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState(getTodaySriLanka());

  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function fetchDashboard(
    date: string = selectedDate
  ) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/dashboard?date=${encodeURIComponent(
          date
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load dashboard"
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
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [selectedDate]);

  const summary = data?.summary;

  const areas = data?.areas || [];

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
      />

      <div className="lg:pl-72">
        <Header
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">

            {/* HEADER */}
            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-400">
                  COOROONDOOWATTE TEA
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Factory Overview
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  View tea weight and factory
                  weight by area.
                </p>
              </div>

              {/* DATE FILTER */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white"
                  />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) =>
                      setSelectedDate(
                        event.target.value
                      )
                    }
                    className="h-11 rounded-xl border border-slate-800 bg-slate-900 pl-11 pr-4 text-sm text-white outline-none transition focus:border-emerald-500"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fetchDashboard(
                      selectedDate
                    )
                  }
                  disabled={loading}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-300 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
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

            {/* SELECTED DATE */}
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3">
              <CalendarDays
                size={18}
                className="text-emerald-400"
              />

              <div>
                <p className="text-xs text-slate-500">
                  Viewing Collection For
                </p>

                <p className="mt-0.5 text-sm font-semibold text-white">
                  {formatDateForDisplay(
                    selectedDate
                  )}
                </p>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() =>
                    fetchDashboard(
                      selectedDate
                    )
                  }
                  className="rounded-lg border border-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500/10"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* LOADING */}
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
                {/* MAIN TOTALS */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  {/* TEA WEIGHT */}
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Total Tea Weight
                        </p>

                        <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                          {formatNumber(
                            summary?.totalTeaWeightKg ||
                              0
                          )}{" "}
                          <span className="text-sm font-medium text-slate-500">
                            KG
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Area collection weight
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
                            summary?.totalFactoryWeightKg ||
                              0
                          )}{" "}
                          <span className="text-sm font-medium text-slate-500">
                            KG
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Factory scale weight
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
                            (summary?.totalDifferenceKg ||
                              0) === 0
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {formatNumber(
                            summary?.totalDifferenceKg ||
                              0
                          )}{" "}
                          <span className="text-sm font-medium text-slate-500">
                            KG
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Tea weight − factory weight
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
                          {summary?.collectedAreas ||
                            0}
                          <span className="text-lg text-slate-600">
                            {" "}
                            /{" "}
                            {summary?.totalAreas ||
                              0}
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

                {/* AREA COLLECTIONS */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d]">

                  <div className="border-b border-slate-800 p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-semibold text-white">
                          All Area Collections
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Tea weight and factory
                          weight for each area
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
                          No collection recorded
                          for this date.
                        </p>

                        <p className="mt-1 text-xs text-slate-700">
                          Select another date to
                          view previous records.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/70">
                      {areas.map((area) => {
                        const status =
                          getDifferenceStatus(
                            area.differenceKg
                          );

                        return (
                          <div
                            key={area.areaId}
                            className="p-5 transition hover:bg-slate-900/30"
                          >
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                              {/* AREA */}
                              <div className="min-w-[200px]">
                                <p className="text-xs uppercase tracking-wider text-slate-600">
                                  Area
                                </p>

                                <h3 className="mt-1 text-lg font-semibold text-white">
                                  {area.areaName}
                                </h3>

                                <p className="mt-1 text-xs text-slate-600">
                                  {area.areaId}
                                </p>
                              </div>

                              {/* WEIGHTS */}
                              <div className="grid flex-1 gap-4 sm:grid-cols-3">

                                <div>
                                  <p className="text-xs text-slate-500">
                                    Tea Weight
                                  </p>

                                  <p className="mt-1 text-lg font-semibold text-emerald-400">
                                    {formatNumber(
                                      area.teaWeightKg
                                    )}{" "}
                                    KG
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-slate-500">
                                    Factory Weight
                                  </p>

                                  <p className="mt-1 text-lg font-semibold text-blue-400">
                                    {formatNumber(
                                      area.factoryWeightKg
                                    )}{" "}
                                    KG
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-slate-500">
                                    Difference
                                  </p>

                                  <p
                                    className={`mt-1 text-lg font-semibold ${
                                      area.differenceKg ===
                                      0
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                    }`}
                                  >
                                    {formatNumber(
                                      area.differenceKg
                                    )}{" "}
                                    KG
                                  </p>
                                </div>
                              </div>

                              {/* STATUS */}
                              <div>
                                <span
                                  className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </div>
                            </div>

                            {/* COMPARISON BAR */}
                            <div className="mt-5">
                              <div className="mb-2 flex justify-between text-[11px] text-slate-600">
                                <span>
                                  Tea Weight
                                </span>

                                <span>
                                  Factory Weight
                                </span>
                              </div>

                              <div className="relative h-2 overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="absolute left-0 top-0 h-full rounded-full bg-emerald-500"
                                  style={{
                                    width:
                                      area.teaWeightKg >
                                      0
                                        ? `${Math.min(
                                            100,
                                            (area.factoryWeightKg /
                                              area.teaWeightKg) *
                                              100
                                          )}%`
                                        : "0%",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* TOTAL SUMMARY */}
                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
                    <p className="text-xs uppercase tracking-wider text-emerald-500/70">
                      Total Tea Weight
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      {formatNumber(
                        summary?.totalTeaWeightKg ||
                          0
                      )}{" "}
                      KG
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
                    <p className="text-xs uppercase tracking-wider text-blue-400/70">
                      Factory Weight Total
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-400">
                      {formatNumber(
                        summary?.totalFactoryWeightKg ||
                          0
                      )}{" "}
                      KG
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5">
                    <p className="text-xs uppercase tracking-wider text-amber-400/70">
                      Total Difference
                    </p>

                    <p className="mt-2 text-2xl font-bold text-amber-400">
                      {formatNumber(
                        summary?.totalDifferenceKg ||
                          0
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