"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Leaf,
  Loader2,
  Scale,
  Users,
  Wallet,
} from "lucide-react";

import Link from "next/link";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";

interface DailyData {
  date: string;
  day: string;
  kg: number;
}

interface RecentCollection {
  id: string;
  supplier: string;
  supplierId: string;
  area: string;
  areaId: string;
  kg: number;
  rate: number;
  amount: number;
  date: string;
}

interface DashboardStats {
  todayKg: number;
  todaySuppliers: number;
  todayValue: number;
  monthlyKg: number;
  totalAreas: number;
  activeAreas: number;
  totalSuppliers: number;
  activeSuppliers: number;
  monthlySuppliers: number;
  monthlyValue: number;
  averageDaily: number;
}

interface DashboardResponse {
  success: boolean;
  message?: string;

  date: {
    today: string;
    year: number;
    month: number;
    day: number;
  };

  stats: DashboardStats;

  dailyData: DailyData[];

  recentCollections: RecentCollection[];
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString(
    "en-LK",
    {
      maximumFractionDigits: 2,
    }
  );
}

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "en-LK",
    {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }
  ).format(new Date(date));
}

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [data, setData] =
    useState<DashboardResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [chartMode, setChartMode] =
    useState<"7days" | "month">(
      "7days"
    );

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/dashboard",
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
    fetchDashboard();
  }, []);

  const stats = data?.stats;

  const dailyData =
    data?.dailyData || [];

  const recentCollections =
    data?.recentCollections || [];

  const maxKg = useMemo(() => {
    const max = Math.max(
      ...dailyData.map(
        (item) => item.kg
      ),
      0
    );

    return max > 0 ? max : 1;
  }, [dailyData]);

  const currentMonthName =
    data?.date
      ? new Intl.DateTimeFormat(
          "en-US",
          {
            month: "long",
            timeZone: "Asia/Colombo",
          }
        ).format(
          new Date(
            `${data.date.year}-${String(
              data.date.month
            ).padStart(2, "0")}-01T00:00:00+05:30`
          )
        )
      : "";

  const monthProgress =
    stats && stats.monthlyKg > 0
      ? Math.min(
          100,
          (stats.monthlyKg /
            Math.max(
              stats.averageDaily * 30,
              stats.monthlyKg
            )) *
            100
        )
      : 0;

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

            {/* Page Heading */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-400">
                  COOROONDOOWATTE TEA
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Factory Overview
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Monitor today's tea leaf
                  collection and factory activity.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-300">
                <CalendarDays
                  size={17}
                  className="text-emerald-400"
                />

                {data?.date
                  ? new Intl.DateTimeFormat(
                      "en-US",
                      {
                        timeZone:
                          "Asia/Colombo",
                        year: "numeric",
                        month: "long",
                        day: "2-digit",
                      }
                    ).format(
                      new Date(
                        `${data.date.today}T00:00:00+05:30`
                      )
                    )
                  : "Loading..."}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={fetchDashboard}
                  className="rounded-lg border border-red-500/20 px-4 py-2 text-red-300 hover:bg-red-500/10"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Loading */}
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
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Today's Collection"
                    value={`${formatNumber(
                      stats?.todayKg || 0
                    )} KG`}
                    subtitle={`${stats?.todaySuppliers || 0} suppliers today`}
                    trend=""
                    icon={Leaf}
                  />

                  <StatCard
                    title="Today's Suppliers"
                    value={String(
                      stats?.todaySuppliers || 0
                    )}
                    subtitle={`${stats?.activeSuppliers || 0} active overall`}
                    trend=""
                    icon={Users}
                  />

                  <StatCard
                    title="Today's Value"
                    value={formatCurrency(
                      stats?.todayValue || 0
                    )}
                    subtitle="Tea leaf value"
                    trend=""
                    icon={Wallet}
                  />

                  <StatCard
                    title="Monthly Collection"
                    value={`${formatNumber(
                      stats?.monthlyKg || 0
                    )} KG`}
                    subtitle={
                      currentMonthName
                        ? currentMonthName
                        : "Current month"
                    }
                    trend=""
                    icon={Scale}
                  />
                </div>

                {/* Chart + Summary */}
                <div className="mt-6 grid gap-6 xl:grid-cols-3">

                  {/* Chart */}
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5 xl:col-span-2">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-semibold text-white">
                          Daily Tea Collection
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Real collection data from MongoDB
                        </p>
                      </div>

                      <select
                        value={chartMode}
                        onChange={(event) =>
                          setChartMode(
                            event.target
                              .value as
                              | "7days"
                              | "month"
                          )
                        }
                        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none"
                      >
                        <option value="7days">
                          Last 7 days
                        </option>

                        <option value="month">
                          This month
                        </option>
                      </select>
                    </div>

                    {chartMode === "7days" ? (
                      dailyData.length > 0 ? (
                        <div className="mt-8 flex h-64 items-end gap-2 sm:gap-4">
                          {dailyData.map(
                            (item) => {
                              const height =
                                item.kg > 0
                                  ? (item.kg /
                                      maxKg) *
                                    100
                                  : 2;

                              return (
                                <div
                                  key={
                                    item.date
                                  }
                                  className="group flex h-full flex-1 flex-col justify-end"
                                >
                                  <div className="relative flex h-full items-end">
                                    <div
                                      className="relative w-full rounded-t-lg bg-emerald-600 transition-all duration-300 group-hover:bg-emerald-500"
                                      style={{
                                        height: `${height}%`,
                                      }}
                                    >
                                      <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] text-white group-hover:block">
                                        {formatNumber(
                                          item.kg
                                        )}{" "}
                                        KG
                                      </div>
                                    </div>
                                  </div>

                                  <span className="mt-3 text-center text-xs text-slate-500">
                                    {item.day}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="flex h-64 items-center justify-center text-sm text-slate-600">
                          No collection data for the last 7 days.
                        </div>
                      )
                    ) : (
                      <div className="mt-8 flex h-64 items-center justify-center">
                        <div className="text-center">
                          <Leaf
                            size={35}
                            className="mx-auto text-slate-700"
                          />

                          <p className="mt-3 text-sm text-slate-500">
                            This month's total
                          </p>

                          <p className="mt-2 text-3xl font-bold text-emerald-400">
                            {formatNumber(
                              stats?.monthlyKg ||
                                0
                            )}{" "}
                            KG
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Monthly Summary */}
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <h2 className="font-semibold text-white">
                      Monthly Summary
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {currentMonthName ||
                        "Current month"}
                    </p>

                    <div className="mt-6 space-y-5">

                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">
                            Total Collection
                          </span>

                          <span className="font-semibold text-white">
                            {formatNumber(
                              stats?.monthlyKg ||
                                0
                            )}{" "}
                            KG
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all"
                            style={{
                              width: `${monthProgress}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <span className="text-sm text-slate-400">
                          Active Suppliers
                        </span>

                        <span className="font-semibold text-white">
                          {stats?.activeSuppliers ||
                            0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <span className="text-sm text-slate-400">
                          Monthly Suppliers
                        </span>

                        <span className="font-semibold text-white">
                          {stats?.monthlySuppliers ||
                            0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <span className="text-sm text-slate-400">
                          Average Daily
                        </span>

                        <span className="font-semibold text-white">
                          {formatNumber(
                            stats?.averageDaily ||
                              0
                          )}{" "}
                          KG
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <span className="text-sm text-slate-400">
                          Total Value
                        </span>

                        <span className="font-semibold text-emerald-400">
                          {formatCurrency(
                            stats?.monthlyValue ||
                              0
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          Active Areas
                        </span>

                        <span className="font-semibold text-white">
                          {stats?.activeAreas ||
                            0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Overview */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-xs text-slate-500">
                      Total Areas
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                      {stats?.totalAreas || 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-xs text-slate-500">
                      Active Areas
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      {stats?.activeAreas || 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-xs text-slate-500">
                      Total Suppliers
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                      {stats?.totalSuppliers ||
                        0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-xs text-slate-500">
                      Active Suppliers
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      {stats?.activeSuppliers ||
                        0}
                    </p>
                  </div>
                </div>

                {/* Recent Collections */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d]">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="font-semibold text-white">
                        Recent Collections
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Latest tea leaf entries from MongoDB
                      </p>
                    </div>

                    <Link
                      href="/collections"
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View all
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    {recentCollections.length ===
                    0 ? (
                      <div className="p-12 text-center">
                        <Leaf
                          size={35}
                          className="mx-auto text-slate-700"
                        />

                        <p className="mt-4 text-sm text-slate-500">
                          No tea collection records yet.
                        </p>

                        <Link
                          href="/collections"
                          className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
                        >
                          Add Collection
                        </Link>
                      </div>
                    ) : (
                      <table className="w-full min-w-[850px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-4 font-medium">
                              Supplier
                            </th>

                            <th className="px-5 py-4 font-medium">
                              Area
                            </th>

                            <th className="px-5 py-4 font-medium">
                              Date
                            </th>

                            <th className="px-5 py-4 font-medium">
                              Weight
                            </th>

                            <th className="px-5 py-4 font-medium">
                              Rate
                            </th>

                            <th className="px-5 py-4 font-medium">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {recentCollections.map(
                            (item) => (
                              <tr
                                key={item.id}
                                className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40"
                              >
                                <td className="px-5 py-4">
                                  <p className="font-medium text-white">
                                    {item.supplier}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-600">
                                    {item.supplierId}
                                  </p>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="text-slate-300">
                                    {item.area}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-600">
                                    {item.areaId}
                                  </p>
                                </td>

                                <td className="px-5 py-4 text-slate-400">
                                  {formatDate(
                                    item.date
                                  )}
                                </td>

                                <td className="px-5 py-4 text-slate-400">
                                  {formatNumber(
                                    item.kg
                                  )}{" "}
                                  KG
                                </td>

                                <td className="px-5 py-4 text-slate-400">
                                  {formatCurrency(
                                    item.rate
                                  )}
                                </td>

                                <td className="px-5 py-4 font-semibold text-emerald-400">
                                  {formatCurrency(
                                    item.amount
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}
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