
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

  const [area, setArea] = useState<Area | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setError("");

      const response = await fetch(
        `/api/areas/${encodeURIComponent(areaId)}/suppliers`,
        {
          cache: "no-store",
        }
      );

      const text = await response.text();

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
          data.message || "Failed to load suppliers."
        );
      }

      setArea(data.area);
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error(error);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading suppliers...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/areas"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
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
              onClick={loadData}
              className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/30"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

        {/* BACK */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/areas"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Areas
          </Link>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>

        {/* AREA HEADER */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <MapPin className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                    {area?.areaId}
                  </span>

                  {area?.status && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        area.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {area.status}
                    </span>
                  )}
                </div>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {area?.name}
                </h1>

                {area?.description && (
                  <p className="mt-1 text-sm text-slate-400">
                    {area.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Suppliers
                </p>

                <p className="text-xl font-bold">
                  {suppliers.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUPPLIER HEADER */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Area Suppliers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Suppliers registered under {area?.name}
            </p>
          </div>

          <Link
            href={`/suppliers?areaId=${encodeURIComponent(
              area?.areaId || ""
            )}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </Link>
        </div>

        {/* NO SUPPLIERS */}
        {suppliers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-5 py-14 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-700" />

            <h3 className="mt-4 text-lg font-semibold text-slate-300">
              No suppliers found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              There are no suppliers registered under this
              area yet.
            </p>

            <Link
              href={`/suppliers?areaId=${encodeURIComponent(
                area?.areaId || ""
              )}`}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              Add First Supplier
            </Link>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-left">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Supplier
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Phone
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
                    {suppliers.map((supplier) => (
                      <tr
                        key={supplier._id}
                        className="border-b border-slate-900 transition hover:bg-slate-900/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                              <UserRound className="h-5 w-5" />
                            </div>

                            <div>
                              <p className="font-medium text-white">
                                {supplier.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {supplier.supplierId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-500" />
                            {supplier.phone}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            {supplier.village}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              supplier.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/suppliers`}
                              className="rounded-lg border border-slate-800 p-2 text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-400"
                              title="Edit Supplier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/suppliers`}
                              className="rounded-lg border border-slate-800 p-2 text-slate-400 transition hover:border-red-500/30 hover:text-red-400"
                              title="Delete Supplier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="space-y-3 md:hidden">
              {suppliers.map((supplier) => (
                <div
                  key={supplier._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">
                          {supplier.name}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {supplier.supplierId}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                        supplier.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {supplier.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="h-4 w-4 text-slate-600" />
                      <span>{supplier.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="h-4 w-4 text-slate-600" />
                      <span>{supplier.village}</span>
                    </div>

                    {supplier.address && (
                      <div className="flex items-start gap-2 text-slate-400">
                        <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                        <span>{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3">
                    <Link
                      href="/suppliers"
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-sm text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-400"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>

                    <Link
                      href="/suppliers"
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-sm text-slate-400 transition hover:border-red-500/30 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

