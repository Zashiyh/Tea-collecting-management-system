"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Search,
} from "lucide-react";

import AreaModal from "@/components/areas/AreaModal";
import AreasTable, {
  Area,
} from "@/components/areas/AreasTable";

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAreas() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/areas", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch areas"
        );
      }

      setAreas(data.areas || []);
    } catch (error) {
      console.error("Fetch areas error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load areas"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAreas();
  }, []);

  const filteredAreas = areas.filter((area) => {
    const searchValue = search.toLowerCase();

    return (
      area.name
        .toLowerCase()
        .includes(searchValue) ||
      area.areaId
        .toLowerCase()
        .includes(searchValue)
    );
  });

  return (
    <main className="min-h-screen bg-[#020b06] p-4 text-white md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Back Button */}
        <Link
          href="/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <MapPin size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Collection Areas
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage tea leaf collection areas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500"
          >
            <Plus size={19} />
            Add Area
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#07140e] p-5">
            <p className="text-sm text-gray-500">
              Total Areas
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {areas.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07140e] p-5">
            <p className="text-sm text-gray-500">
              Active Areas
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {
                areas.filter(
                  (area) => area.status === "Active"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07140e] p-5">
            <p className="text-sm text-gray-500">
              Total Suppliers
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {areas.reduce(
                (total, area) =>
                  total + (area.supplierCount ?? 0),
                0
              )}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search area..."
            className="w-full rounded-xl border border-white/10 bg-[#07140e] py-3 pl-11 pr-4 text-white outline-none placeholder:text-gray-600 focus:border-emerald-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Areas */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#07140e] p-12 text-center text-gray-500">
              Loading areas...
            </div>
          ) : (
            <AreasTable
              areas={filteredAreas}
              onView={(area) => {
                console.log("Selected area:", area);
              }}
            />
          )}
        </div>
      </div>

      {/* Add Area Modal */}
      <AreaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchAreas}
      />
    </main>
  );
}