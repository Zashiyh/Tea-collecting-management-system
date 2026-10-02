
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Factory,
  Leaf,
  Loader2,
  RefreshCw,
  Scale,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface AreaCollection {
  collectionId: string;
  date: string;
  areaId: string;
  areaName: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes?: string;
}

interface AreaDashboardResponse {
  success: boolean;
  message?: string;

  area: {
    areaId: string;
    areaName: string;
  };

  fromDate: string;
  toDate: string;

  summary: {
    totalCollections: number;
    totalTeaWeightKg: number;
    totalFactoryWeightKg: number;
    totalDifferenceKg: number;
  };

  collections: AreaCollection[];
}

interface PageProps {
  params: Promise<{
    areaId: string;
  }>;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString(
    "en-LK",
    {
      maximumFractionDigits: 2,
    }
  );
}

function formatDateForDisplay(date: string) {
  if (!date) return "";

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "long",
      day: "2-digit",
    }
  ).format(
    new Date(
      `${date}T00:00:00+05:30`
    )
  );
}

function getTodaySriLanka() {
  const parts =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value ?? "";

  return `${year}-${month}-${day}`;
}

export default function AreaDashboardPage({
  params,
}: PageProps) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [areaId, setAreaId] =
    useState("");

  const [area, setArea] =
    useState<
      AreaDashboardResponse["area"] | null
    >(null);

  const [fromDate, setFromDate] =
    useState("2026-10-01");

  const [toDate, setToDate] =
    useState(getTodaySriLanka());

  const [data, setData] =
    useState<AreaDashboardResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     GET AREA ID
  ===================================================== */

  useEffect(() => {
    async function getParams() {
      const resolvedParams =
        await params;

      setAreaId(
        decodeURIComponent(
          resolvedParams.areaId
        )
      );
    }

    getParams();
  }, [params]);

  /* =====================================================
     LOAD AREA DATA
  ===================================================== */

  async function loadArea(
    currentAreaId = areaId,
    currentFromDate = fromDate,
    currentToDate = toDate
  ) {
    if (!currentAreaId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/dashboard/areas/${encodeURIComponent(
            currentAreaId
          )}?from=${encodeURIComponent(
            currentFromDate
          )}&to=${encodeURIComponent(
            currentToDate
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const text =
        await response.text();

      let result;

      try {
        result = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to load area data"
        );
      }

      setData(result);
      setArea(result.area);
    } catch (err) {
      console.error(
        "Area dashboard error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load area data"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD WHEN AREA ID IS READY
  ===================================================== */

  useEffect(() => {
    if (!areaId) {
      return;
    }

    loadArea(
      areaId,
      fromDate,
      toDate
    );
  }, [areaId]);

  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      {/* SIDEBAR */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
      />

      {/* MAIN */}

      <div className="lg:pl-72">
        <Header
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">

            {/* =================================================
                BACK BUTTON
            ================================================= */}

            <div className="mb-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-emerald-500/40 hover:text-white"
              >
                <ArrowLeft
                  size={17}
                />

                Back to Dashboard
              </Link>
            </div>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-400">
                  COOROONDOOWATTE TEA
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {area?.areaName ||
                    "Area Details"}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Daily tea and factory
                  weight collection details.
                </p>
              </div>

              {/* DATE FILTER */}

              <div className="flex flex-col gap-2 sm:flex-row">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    From
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white"
                    />

                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) =>
                        setFromDate(
                          e.target.value
                        )
                      }
                      className="h-11 rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3 text-sm text-white outline-none focus:border-emerald-500"
                      style={{
                        colorScheme:
                          "dark",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    To
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white"
                    />

                    <input
                      type="date"
                      value={toDate}
                      min={fromDate}
                      onChange={(e) =>
                        setToDate(
                          e.target.value
                        )
                      }
                      className="h-11 rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3 text-sm text-white outline-none focus:border-emerald-500"
                      style={{
                        colorScheme:
                          "dark",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      loadArea(
                        areaId,
                        fromDate,
                        toDate
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
            </div>

            {/* PERIOD */}

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
                    {formatDateForDisplay(
                      data?.fromDate ||
                        fromDate
                    )}

                    <span className="mx-2 text-slate-600">
                      →
                    </span>

                    {formatDateForDisplay(
                      data?.toDate ||
                        toDate
                    )}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Area cumulative total
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    loadArea(
                      areaId,
                      fromDate,
                      toDate
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
                    Loading area data...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  {/* COLLECTIONS */}

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Collections
                    </p>

                    <p className="mt-3 text-3xl font-bold text-white">
                      {summary?.totalCollections ||
                        0}
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                      Daily records
                    </p>
                  </div>

                  {/* TEA */}

                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-emerald-500/70">
                          Total Tea Weight
                        </p>

                        <p className="mt-3 text-2xl font-bold text-emerald-400">
                          {formatNumber(
                            summary?.totalTeaWeightKg ||
                              0
                          )}{" "}
                          <span className="text-sm text-slate-500">
                            KG
                          </span>
                        </p>
                      </div>

                      <Leaf
                        size={24}
                        className="text-emerald-400"
                      />
                    </div>
                  </div>

                  {/* FACTORY */}

                  <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-blue-400/70">
                          Factory Weight
                        </p>

                        <p className="mt-3 text-2xl font-bold text-blue-400">
                          {formatNumber(
                            summary?.totalFactoryWeightKg ||
                              0
                          )}{" "}
                          <span className="text-sm text-slate-500">
                            KG
                          </span>
                        </p>
                      </div>

                      <Factory
                        size={24}
                        className="text-blue-400"
                      />
                    </div>
                  </div>

                  {/* DIFFERENCE */}

                  <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-amber-400/70">
                          Difference
                        </p>

                        <p
                          className={`mt-3 text-2xl font-bold ${
                            (summary?.totalDifferenceKg ||
                              0) > 0
                              ? "text-cyan-400"
                              : (summary?.totalDifferenceKg ||
                                    0) < 0
                                ? "text-red-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {(summary?.totalDifferenceKg ||
                            0) > 0
                            ? "+"
                            : ""}

                          {formatNumber(
                            summary?.totalDifferenceKg ||
                              0
                          )}{" "}
                          <span className="text-sm text-slate-500">
                            KG
                          </span>
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          Factory − Tea
                        </p>
                      </div>

                      <Scale
                        size={24}
                        className="text-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* =================================================
                    DAILY COLLECTIONS
                ================================================= */}

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d]">

                  <div className="border-b border-slate-800 p-5">
                    <h2 className="font-semibold text-white">
                      Daily Collections
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {area?.areaName ||
                        "Area"}{" "}
                      daily collection records
                    </p>
                  </div>

                  {!data?.collections
                    ?.length ? (
                    <div className="flex min-h-[300px] items-center justify-center p-6">
                      <div className="text-center">
                        <Leaf
                          size={40}
                          className="mx-auto text-slate-700"
                        />

                        <p className="mt-4 text-sm text-slate-500">
                          No collections found
                          for this period.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* DESKTOP TABLE */}

                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                              <th className="px-5 py-4">
                                Date
                              </th>

                              <th className="px-5 py-4">
                                Collection ID
                              </th>

                              <th className="px-5 py-4 text-right">
                                Tea Weight
                              </th>

                              <th className="px-5 py-4 text-right">
                                Factory Weight
                              </th>

                              <th className="px-5 py-4 text-right">
                                Difference
                              </th>

                              <th className="px-5 py-4">
                                Notes
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {data.collections.map(
                              (collection) => {
                                const difference =
                                  Number(
                                    (
                                      Number(
                                        collection.factoryWeightKg ||
                                          0
                                      ) -
                                      Number(
                                        collection.totalKg ||
                                          0
                                      )
                                    ).toFixed(2)
                                  );

                                return (
                                  <tr
                                    key={
                                      collection.collectionId
                                    }
                                    className="border-b border-slate-800/70 transition hover:bg-slate-900/30"
                                  >
                                    <td className="px-5 py-4 text-sm text-white">
                                      {formatDateForDisplay(
                                        new Date(
                                          collection.date
                                        )
                                          .toLocaleDateString(
                                            "en-CA",
                                            {
                                              timeZone:
                                                "Asia/Colombo",
                                            }
                                          )
                                      )}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-slate-400">
                                      {
                                        collection.collectionId
                                      }
                                    </td>

                                    <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-400">
                                      {formatNumber(
                                        collection.totalKg
                                      )}{" "}
                                      KG
                                    </td>

                                    <td className="px-5 py-4 text-right text-sm font-semibold text-blue-400">
                                      {formatNumber(
                                        collection.factoryWeightKg
                                      )}{" "}
                                      KG
                                    </td>

                                    <td
                                      className={`px-5 py-4 text-right text-sm font-semibold ${
                                        difference >
                                        0
                                          ? "text-cyan-400"
                                          : difference <
                                              0
                                            ? "text-red-400"
                                            : "text-emerald-400"
                                      }`}
                                    >
                                      {difference >
                                      0
                                        ? "+"
                                        : ""}

                                      {formatNumber(
                                        difference
                                      )}{" "}
                                      KG
                                    </td>

                                    <td className="max-w-[250px] px-5 py-4 text-sm text-slate-500">
                                      {collection.notes ||
                                        "—"}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE LIST */}

                      <div className="divide-y divide-slate-800/70 md:hidden">
                        {data.collections.map(
                          (collection) => {
                            const difference =
                              Number(
                                (
                                  Number(
                                    collection.factoryWeightKg ||
                                      0
                                  ) -
                                  Number(
                                    collection.totalKg ||
                                      0
                                  )
                                ).toFixed(2)
                              );

                            return (
                              <div
                                key={
                                  collection.collectionId
                                }
                                className="p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-white">
                                      {formatDateForDisplay(
                                        new Date(
                                          collection.date
                                        )
                                          .toLocaleDateString(
                                            "en-CA",
                                            {
                                              timeZone:
                                                "Asia/Colombo",
                                            }
                                          )
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-600">
                                      {
                                        collection.collectionId
                                      }
                                    </p>
                                  </div>

                                  <span
                                    className={`text-sm font-bold ${
                                      difference >
                                      0
                                        ? "text-cyan-400"
                                        : difference <
                                            0
                                          ? "text-red-400"
                                          : "text-emerald-400"
                                    }`}
                                  >
                                    {difference >
                                    0
                                      ? "+"
                                      : ""}

                                    {formatNumber(
                                      difference
                                    )}{" "}
                                    KG
                                  </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <div className="rounded-xl bg-emerald-500/5 p-3">
                                    <p className="text-xs text-slate-500">
                                      Tea Weight
                                    </p>

                                    <p className="mt-1 font-semibold text-emerald-400">
                                      {formatNumber(
                                        collection.totalKg
                                      )}{" "}
                                      KG
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-blue-500/5 p-3">
                                    <p className="text-xs text-slate-500">
                                      Factory Weight
                                    </p>

                                    <p className="mt-1 font-semibold text-blue-400">
                                      {formatNumber(
                                        collection.factoryWeightKg
                                      )}{" "}
                                      KG
                                    </p>
                                  </div>
                                </div>

                                {collection.notes && (
                                  <div className="mt-3 rounded-xl bg-slate-900/50 p-3">
                                    <p className="text-xs text-slate-500">
                                      Notes
                                    </p>

                                    <p className="mt-1 text-sm text-slate-400">
                                      {
                                        collection.notes
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
