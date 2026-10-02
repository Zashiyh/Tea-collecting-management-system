"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

import AreaModal from "@/components/areas/AreaModal";
import AreasTable from "@/components/areas/AreasTable";

interface Area {
  _id?: string;
  areaId: string;
  name: string;
  description?: string;
  status?: "Active" | "Inactive";
  supplierCount?: number;
  todayKg?: number;
  todayValue?: number;
  totalKg?: number;
  totalValue?: number;
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  /* =====================================================
     LOAD AREAS
  ===================================================== */

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/areas", {
        cache: "no-store",
      });

      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        areas?: Area[];
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load areas"
        );
      }

      setAreas(data.areas || []);
    } catch (error) {
      console.error(
        "LOAD AREAS ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load areas"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  /* =====================================================
     AFTER ADD / EDIT / DELETE
  ===================================================== */

  async function handleUpdated() {
    await loadAreas();
  }

  /* =====================================================
     ADD AREA
  ===================================================== */

  function handleAddArea() {
    setShowModal(true);
  }

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  function handleCloseModal() {
    setShowModal(false);
  }

  /* =====================================================
     VIEW AREA
  ===================================================== */

  function handleViewArea(area: Area) {
    console.log(
      "VIEW AREA:",
      area
    );
  }

  return (
    <main className="min-h-screen bg-[#020a06] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              Cooroonduwatte Tea
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Areas
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage tea collection areas
            </p>
          </div>

          <div className="flex items-center gap-2">

            {/* Refresh Button */}

            <button
              type="button"
              onClick={loadAreas}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-4 text-sm font-medium text-slate-300 transition hover:border-emerald-500/30 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            {/* Add Area Button */}

            <button
              type="button"
              onClick={handleAddArea}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              <Plus size={17} />

              Add Area
            </button>
          </div>
        </div>

        {/* =================================================
            AREAS LIST
        ================================================= */}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-12 text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-emerald-400"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading areas...
            </p>
          </div>
        ) : (
          <AreasTable
            areas={areas}
            onView={handleViewArea}
            onUpdated={handleUpdated}
          />
        )}
      </div>

      {/* ===================================================
          ADD AREA MODAL
      =================================================== */}

      <AreaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onCreated={handleUpdated}
      />
    </main>
  );
}