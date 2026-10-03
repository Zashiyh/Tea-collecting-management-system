"use client";

import {
  ArrowLeft,
  MapPin,
  Phone,
  UserRound,
  Users,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Home,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Area {
  areaId: string;
  name: string;
  description?: string;
  status?: "Active" | "Inactive";
}

interface Supplier {
  _id: string;
  supplierId: string;
  name: string;
  phone: string;
  areaId: string;
  areaName: string;
  village: string;
  address?: string;
  status: "Active" | "Inactive";
}

export default function AreaSuppliersPage() {
  const params = useParams();

  const areaId = decodeURIComponent(
    String(params.areaId || "")
  );

  const [area, setArea] =
    useState<Area | null>(null);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadData = async () => {
    try {
      setError("");

      const response = await fetch(
        `/api/areas/${encodeURIComponent(
          areaId
        )}/suppliers`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load suppliers."
        );
      }

      setArea(data.area);
      setSuppliers(
        data.suppliers || []
      );
    } catch (error) {
      console.error(
        "Load area suppliers error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load area suppliers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (areaId) {
      loadData();
    }
  }, [areaId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  /*
   * NOTE:
   * These buttons currently navigate to the main
   * Suppliers page.
   *
   * The actual edit/delete functionality can be
   * connected later if required.
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020a06] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />

            <span className="text-sm">
              Loading suppliers...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020a06] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <Link
            href="/areas"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Areas
          </Link>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <h2 className="text-lg font-semibold text-red-400">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={loadData}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              <RefreshCw className="h-4 w-4" />

              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">

          {/* HEADER / BACK */}

          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Link
              href="/areas"
              className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to Areas
            </Link>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>

          {/* AREA HEADER */}

          <div className="mb-6 rounded-2xl border border-slate-800 bg-[#07140d] p-5 sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              {/* Area Information */}

              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400">
                  <MapPin className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                      {area?.areaId}
                    </span>

                    {area?.status && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          area.status ===
                          "Active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {area.status}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {area?.name}
                  </h1>

                  {area?.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      {area.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Supplier Count */}

              <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Suppliers
                  </p>

                  <p className="text-xl font-bold text-white">
                    {suppliers.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SUPPLIER SECTION HEADER */}

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Area Suppliers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suppliers registered under{" "}
                <span className="text-slate-400">
                  {area?.name}
                </span>
              </p>
            </div>

            <Link
              href={`/suppliers?areaId=${encodeURIComponent(
                area?.areaId || ""
              )}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-500 active:scale-[0.98] sm:w-auto"
            >
              <Plus className="h-4 w-4" />

              Add Supplier
            </Link>
          </div>

          {/* NO SUPPLIERS */}

          {suppliers.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] px-5 py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-700" />

              <h3 className="mt-4 text-lg font-semibold text-slate-300">
                No suppliers found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no suppliers
                registered under this area yet.
              </p>

              <Link
                href={`/suppliers?areaId=${encodeURIComponent(
                  area?.areaId || ""
                )}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />

                Add First Supplier
              </Link>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#061109] text-left">
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Supplier
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Contact
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Village
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {suppliers.map(
                        (supplier) => (
                          <tr
                            key={
                              supplier._id
                            }
                            className="border-b border-slate-800/70 transition hover:bg-emerald-950/10"
                          >
                            {/* Supplier */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400">
                                  <UserRound className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-medium text-white">
                                    {
                                      supplier.name
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-600">
                                    {
                                      supplier.supplierId
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Phone */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Phone className="h-4 w-4 text-slate-600" />

                                {
                                  supplier.phone
                                }
                              </div>
                            </td>

                            {/* Village */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <MapPin className="h-4 w-4 text-slate-600" />

                                {
                                  supplier.village
                                }
                              </div>
                            </td>

                            {/* Status */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  supplier.status ===
                                  "Active"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-slate-500/10 text-slate-500"
                                }`}
                              >
                                {
                                  supplier.status
                                }
                              </span>
                            </td>

                            {/* Actions */}

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href="/suppliers"
                                  className="rounded-lg border border-slate-800 p-2 text-slate-500 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                                  title="Edit Supplier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Link>

                                <Link
                                  href="/suppliers"
                                  className="rounded-lg border border-slate-800 p-2 text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                                  title="Delete Supplier"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-3 md:hidden">
                {suppliers.map(
                  (supplier) => (
                    <div
                      key={
                        supplier._id
                      }
                      className="rounded-2xl border border-slate-800 bg-[#07140d] p-4 transition hover:border-emerald-500/20"
                    >
                      {/* Supplier Header */}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-white">
                              {
                                supplier.name
                              }
                            </h3>

                            <p className="mt-0.5 text-xs text-slate-600">
                              {
                                supplier.supplierId
                              }
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            supplier.status ===
                            "Active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-500/10 text-slate-500"
                          }`}
                        >
                          {
                            supplier.status
                          }
                        </span>
                      </div>

                      {/* Details */}

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Phone className="h-4 w-4 shrink-0 text-slate-600" />

                          <span>
                            {
                              supplier.phone
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-600" />

                          <span>
                            {
                              supplier.village
                            }
                          </span>
                        </div>

                        {supplier.address && (
                          <div className="flex items-start gap-2 text-sm text-slate-400">
                            <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />

                            <span className="leading-5">
                              {
                                supplier.address
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}

                      <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3">
                        <Link
                          href="/suppliers"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#020a06] py-2.5 text-sm font-medium text-slate-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                        >
                          <Pencil className="h-4 w-4" />

                          Edit
                        </Link>

                        <Link
                          href="/suppliers"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#020a06] py-2.5 text-sm font-medium text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />

                          Delete
                        </Link>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}