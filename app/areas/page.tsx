"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import AreaModal from "@/components/areas/AreaModal";
import AreasTable from "@/components/areas/AreasTable";

interface Area {
  _id?: string;
  areaId: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  supplierCount?: number;
  todayKg?: number;
  todayValue?: number;
  totalKg?: number;
  totalValue?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AreasResponse {
  success: boolean;
  message?: string;
  areas?: Area[];
}

export default function AreasPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [areas, setAreas] = useState<Area[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  /* =====================================================
     FETCH AREAS
  ===================================================== */

  async function fetchAreas() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/areas", {
        method: "GET",
        cache: "no-store",
      });

      const responseText = await response.text();

      let data: AreasResponse = {
        success: false,
        areas: [],
      };

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {
              success: false,
              areas: [],
            };
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}).`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load areas."
        );
      }

      setAreas(data.areas || []);
    } catch (error) {
      console.error("FETCH AREAS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load areas."
      );

      setAreas([]);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchAreas();
  }, []);

  /* =====================================================
     AFTER CREATE / UPDATE / DELETE
  ===================================================== */

  async function handleUpdated() {
    await fetchAreas();
  }

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredAreas = areas.filter((area) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      area.areaId.toLowerCase().includes(value) ||
      area.name.toLowerCase().includes(value) ||
      (area.description || "")
        .toLowerCase()
        .includes(value)
    );
  });

  /* =====================================================
     COUNTS
  ===================================================== */

  const totalAreas = areas.length;

  const activeAreas = areas.filter(
    (area) => area.status === "Active"
  ).length;

  const inactiveAreas = areas.filter(
    (area) => area.status === "Inactive"
  ).length;

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="lg:pl-72">
        <Header
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="p-3 sm:p-5 lg:p-8">
          <div className="mx-auto max-w-[1600px]">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="mb-5 flex flex-col gap-4 sm:mb-6 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Link
                  href="/dashboard"
                  className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-emerald-400 sm:text-sm"
                >
                  <ArrowLeft size={16} />

                  Back to Dashboard
                </Link>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 sm:h-12 sm:w-12">
                    <MapPin
                      size={21}
                      className="sm:h-6 sm:w-6"
                    />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                      Collection Areas
                    </h1>

                    <p className="mt-1 text-[10px] text-slate-500 sm:text-sm">
                      Manage tea leaf collection areas.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-500 sm:w-auto sm:text-sm"
              >
                <Plus size={17} />

                Add Area
              </button>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={fetchAreas}
                  className="flex w-fit items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  <RefreshCw size={14} />

                  Try Again
                </button>
              </div>
            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="mb-5 grid grid-cols-3 gap-2.5 sm:mb-6 sm:gap-4">
              {/* TOTAL */}

              <div className="rounded-xl border border-slate-800 bg-[#07140d] p-3 sm:rounded-2xl sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-medium text-slate-500 sm:text-xs">
                      Total Areas
                    </p>

                    <p className="mt-1 text-xl font-bold text-white sm:text-2xl">
                      {totalAreas}
                    </p>
                  </div>

                  <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-slate-500/10 text-slate-400 sm:flex">
                    <MapPin size={18} />
                  </div>
                </div>
              </div>

              {/* ACTIVE */}

              <div className="rounded-xl border border-emerald-500/10 bg-[#07140d] p-3 sm:rounded-2xl sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-medium text-slate-500 sm:text-xs">
                      Active Areas
                    </p>

                    <p className="mt-1 text-xl font-bold text-emerald-400 sm:text-2xl">
                      {activeAreas}
                    </p>
                  </div>

                  <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 sm:flex">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
              </div>

              {/* INACTIVE */}

              <div className="rounded-xl border border-red-500/10 bg-[#07140d] p-3 sm:rounded-2xl sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-medium text-slate-500 sm:text-xs">
                      Inactive Areas
                    </p>

                    <p className="mt-1 text-xl font-bold text-red-400 sm:text-2xl">
                      {inactiveAreas}
                    </p>
                  </div>

                  <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 sm:flex">
                    <XCircle size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                AREAS CONTAINER
            ================================================= */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#07140d] sm:rounded-2xl">
              {/* HEADER */}

              <div className="border-b border-slate-800 p-3 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white sm:text-base">
                      All Areas
                    </h2>

                    <p className="mt-1 text-[9px] text-slate-600 sm:text-xs">
                      Add, edit and manage collection areas.
                    </p>
                  </div>

                  {/* SEARCH */}

                  <div className="relative w-full sm:w-72">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search areas..."
                      className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Loader2
                      size={30}
                      className="mx-auto animate-spin text-emerald-500"
                    />

                    <p className="mt-3 text-xs text-slate-600">
                      Loading areas...
                    </p>
                  </div>
                </div>
              ) : (
                <AreasTable
                  areas={filteredAreas}
                  onUpdated={handleUpdated}
                />
              )}
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-700 sm:text-xs">
              <Users size={13} />

              <span>
                Areas are used to organize suppliers and daily
                tea collections.
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* =====================================================
          ADD AREA MODAL
      ===================================================== */}

      <AreaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleUpdated}
      />
    </div>
  );
}