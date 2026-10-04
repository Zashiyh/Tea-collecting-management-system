
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Download,
  Plus,
  RefreshCw,
  Search,
  Users,
  MapPin,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

import SupplierModal, {
  SupplierEditData,
} from "@/components/suppliers/SupplierModal";

import SuppliersTable, {
  Supplier,
} from "@/components/suppliers/SuppliersTable";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface ApiSupplier {
  _id: string;
  supplierId: string;
  name: string;
  phone: string;
  areaId: string;
  areaName: string;
  village: string;
  address?: string;
  status: "Active" | "Inactive";
  totalKg?: number;
  totalValue?: number;
}

interface ApiArea {
  _id?: string;
  areaId: string;
  name: string;
  status?: "Active" | "Inactive";
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [areas, setAreas] = useState<ApiArea[]>([]);

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [areasLoading, setAreasLoading] = useState(true);

  const [error, setError] = useState("");
  const [areasError, setAreasError] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);

  // =========================================
  // MOBILE SIDEBAR
  // =========================================
  const [mobileOpen, setMobileOpen] = useState(false);

  // =========================================
  // FETCH SUPPLIERS
  // =========================================
  async function fetchSuppliers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/suppliers", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch suppliers"
        );
      }

      const formattedSuppliers: Supplier[] = (
        data.suppliers || []
      ).map((supplier: ApiSupplier) => ({
        id: supplier.supplierId,
        name: supplier.name,
        phone: supplier.phone,
        areaId: supplier.areaId,
        areaName: supplier.areaName,
        village: supplier.village,
        address: supplier.address || "",
        totalKg: Number(supplier.totalKg || 0),
        totalValue: Number(supplier.totalValue || 0),
        status: supplier.status,
      }));

      setSuppliers(formattedSuppliers);
    } catch (error) {
      console.error("Fetch suppliers error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load suppliers"
      );

      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // FETCH AREAS
  // =========================================
  async function fetchAreas() {
    try {
      setAreasLoading(true);
      setAreasError("");

      const response = await fetch("/api/areas", {
        method: "GET",
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

      setAreasError(
        error instanceof Error
          ? error.message
          : "Failed to load areas"
      );

      setAreas([]);
    } finally {
      setAreasLoading(false);
    }
  }

  // =========================================
  // INITIAL LOAD
  // =========================================
  useEffect(() => {
    fetchSuppliers();
    fetchAreas();
  }, []);

  // =========================================
  // GET SUPPLIERS BY AREA
  // =========================================
  function getAreaSuppliers(areaId: string) {
    return suppliers.filter(
      (supplier) => supplier.areaId === areaId
    );
  }

  // =========================================
  // ACTIVE AREAS
  // =========================================
  const displayedAreas = useMemo(() => {
    return areas.filter((area) => {
      if (!area.status) return true;

      return area.status === "Active";
    });
  }, [areas]);

  // =========================================
  // SELECTED AREA
  // =========================================
  const selectedArea = useMemo(() => {
    return areas.find(
      (area) => area.areaId === selectedAreaId
    );
  }, [areas, selectedAreaId]);

  // =========================================
  // SELECTED AREA SUPPLIERS
  // =========================================
  const selectedAreaSuppliers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return suppliers.filter((supplier) => {
      if (supplier.areaId !== selectedAreaId) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.id.toLowerCase().includes(query) ||
        supplier.phone.toLowerCase().includes(query) ||
        supplier.village.toLowerCase().includes(query) ||
        supplier.areaName.toLowerCase().includes(query) ||
        supplier.areaId.toLowerCase().includes(query)
      );
    });
  }, [suppliers, selectedAreaId, search]);

  // =========================================
  // OVERALL STATS
  // =========================================
  const totalKg = suppliers.reduce(
    (sum, supplier) =>
      sum + Number(supplier.totalKg || 0),
    0
  );

  const totalValue = suppliers.reduce(
    (sum, supplier) =>
      sum + Number(supplier.totalValue || 0),
    0
  );

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status === "Active"
  ).length;

  // =========================================
  // ADD SUPPLIER
  // =========================================
  function openAddModal() {
    setSelectedSupplier(null);
    setError("");
    setModalOpen(true);
  }

  // =========================================
  // EDIT SUPPLIER
  // =========================================
  function openEditModal(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setError("");
    setModalOpen(true);
  }

  // =========================================
  // CLOSE MODAL
  // =========================================
  function closeModal() {
    if (deleteLoading) {
      return;
    }

    setModalOpen(false);
    setSelectedSupplier(null);
  }

  // =========================================
  // DELETE SUPPLIER
  // =========================================
  async function handleDelete(supplier: Supplier) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}" (${supplier.id})?\n\nIf this supplier has collection history, the system will keep the history and mark the supplier as Inactive instead.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");

      const response = await fetch(
        `/api/suppliers/${supplier.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete supplier"
        );
      }

      await fetchSuppliers();

      if (data.deactivated) {
        window.alert(
          "This supplier has collection history, so it was marked as Inactive instead of being permanently deleted."
        );
      }
    } catch (error) {
      console.error("Delete supplier error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete supplier"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  // =========================================
  // SUPPLIER SAVED
  // =========================================
  async function handleSupplierSaved() {
    setModalOpen(false);
    setSelectedSupplier(null);

    await fetchSuppliers();
  }

  // =========================================
  // EDIT DATA
  // =========================================
  const editSupplierData: SupplierEditData | null =
    selectedSupplier
      ? {
          id: selectedSupplier.id,
          name: selectedSupplier.name,
          phone: selectedSupplier.phone,
          areaId: selectedSupplier.areaId,
          areaName: selectedSupplier.areaName,
          village: selectedSupplier.village,
          address: selectedSupplier.address,
          totalKg: selectedSupplier.totalKg,
          totalValue: selectedSupplier.totalValue,
          status: selectedSupplier.status,
        }
      : null;

  // =========================================
  // OPEN AREA
  // =========================================
  function openArea(areaId: string) {
    setSelectedAreaId(areaId);
    setSearch("");
    setError("");
  }

  // =========================================
  // BACK TO AREAS
  // =========================================
  function backToAreas() {
    setSelectedAreaId("");
    setSearch("");
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#020a06] text-white">

      {/* =========================================
          DASHBOARD SIDEBAR
      ========================================= */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* =========================================
          MAIN CONTENT
      ========================================= */}
      <div className="lg:ml-64">

        {/* =========================================
            DASHBOARD HEADER
        ========================================= */}
        <Header
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">

            {/* =========================================
                PAGE HEADER
            ========================================= */}
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <Link
                  href="/dashboard"
                  className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </Link>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-600/10 p-3 text-emerald-400">
                    <Users size={24} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">
                      Suppliers
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedArea
                        ? `Suppliers registered under ${selectedArea.name}`
                        : "Manage tea leaf suppliers by area"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-500 active:scale-[0.98]"
              >
                <Plus size={18} />
                Add Supplier
              </button>
            </div>

            {/* =========================================
                OVERALL STATS
            ========================================= */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                <p className="text-sm text-slate-500">
                  Total Suppliers
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {suppliers.length}
                </p>

                <p className="mt-1 text-xs text-emerald-400">
                  {activeSuppliers} active
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                <p className="text-sm text-slate-500">
                  Total Tea Leaves
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {totalKg.toLocaleString()} KG
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Recorded collection
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                <p className="text-sm text-slate-500">
                  Total Value
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  Rs.{" "}
                  {totalValue.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Current records
                </p>
              </div>
            </div>

            {/* =========================================
                ERROR
            ========================================= */}
            {error && (
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={fetchSuppliers}
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-red-300 transition hover:bg-red-500/10"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* =========================================
                AREAS VIEW
            ========================================= */}
            {!selectedAreaId ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Supplier Areas
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Select an area to view its suppliers
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      fetchAreas();
                      fetchSuppliers();
                    }}
                    disabled={areasLoading || loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={
                        areasLoading || loading
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Refresh
                  </button>
                </div>

                {areasLoading ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-16 text-center">
                    <RefreshCw
                      size={30}
                      className="mx-auto animate-spin text-emerald-500"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading areas...
                    </p>
                  </div>
                ) : displayedAreas.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-16 text-center">
                    <MapPin
                      size={35}
                      className="mx-auto text-slate-700"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No areas have been added yet.
                    </p>

                    {areasError && (
                      <p className="mt-2 text-xs text-red-400">
                        {areasError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {displayedAreas.map((area) => {
                      const areaSuppliers =
                        getAreaSuppliers(area.areaId);

                      const areaTotalKg =
                        areaSuppliers.reduce(
                          (sum, supplier) =>
                            sum +
                            Number(
                              supplier.totalKg || 0
                            ),
                          0
                        );

                      const areaActiveSuppliers =
                        areaSuppliers.filter(
                          (supplier) =>
                            supplier.status ===
                            "Active"
                        ).length;

                      return (
                        <button
                          key={area.areaId}
                          type="button"
                          onClick={() =>
                            openArea(area.areaId)
                          }
                          className="group rounded-xl border border-slate-800 bg-[#07140d] p-4 text-left transition hover:border-emerald-500/30 hover:bg-[#091a10]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 transition group-hover:bg-emerald-500/15">
                              <MapPin size={19} />
                            </div>

                            <ChevronRight
                              size={18}
                              className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-emerald-400"
                            />
                          </div>

                          <h3 className="mt-3 text-base font-semibold text-white">
                            {area.name}
                          </h3>

                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {area.areaId}
                          </p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-2">
                              <p className="text-[10px] text-slate-500">
                                Suppliers
                              </p>

                              <p className="mt-0.5 text-base font-bold text-white">
                                {areaSuppliers.length}
                              </p>

                              <p className="text-[10px] text-emerald-400">
                                {areaActiveSuppliers} active
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-2">
                              <p className="text-[10px] text-slate-500">
                                Tea Leaves
                              </p>

                              <p className="mt-0.5 text-base font-bold text-white">
                                {areaTotalKg.toLocaleString()}
                              </p>

                              <p className="text-[10px] text-slate-500">
                                KG
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center text-[11px] font-medium text-emerald-400">
                            View Suppliers

                            <ChevronRight
                              size={13}
                              className="ml-0.5 transition group-hover:translate-x-1"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* =========================================
                    SELECTED AREA
                ========================================= */}
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={backToAreas}
                      className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
                    >
                      <ArrowLeft size={16} />
                      Back to Areas
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                        <MapPin size={22} />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-white sm:text-2xl">
                          {selectedArea?.name ||
                            selectedAreaId}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {selectedAreaSuppliers.length}{" "}
                          supplier
                          {selectedAreaSuppliers.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          in this area
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1 sm:min-w-[320px]">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search supplier..."
                        className="w-full rounded-xl border border-slate-800 bg-[#07140d] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={fetchSuppliers}
                      disabled={
                        loading || deleteLoading
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw
                        size={17}
                        className={
                          loading
                            ? "animate-spin"
                            : ""
                        }
                      />

                      Refresh
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#07140d] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                    >
                      <Download size={17} />
                      Export
                    </button>
                  </div>
                </div>

                {/* =========================================
                    AREA SUMMARY
                ========================================= */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-sm text-slate-500">
                      Area Suppliers
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                      {
                        getAreaSuppliers(
                          selectedAreaId
                        ).length
                      }
                    </p>

                    <p className="mt-1 text-xs text-emerald-400">
                      {
                        getAreaSuppliers(
                          selectedAreaId
                        ).filter(
                          (supplier) =>
                            supplier.status ===
                            "Active"
                        ).length
                      }{" "}
                      active
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-sm text-slate-500">
                      Area Tea Leaves
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                      {getAreaSuppliers(
                        selectedAreaId
                      )
                        .reduce(
                          (sum, supplier) =>
                            sum +
                            Number(
                              supplier.totalKg || 0
                            ),
                          0
                        )
                        .toLocaleString()}{" "}
                      KG
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Recorded collection
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
                    <p className="text-sm text-slate-500">
                      Area Value
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      Rs.{" "}
                      {getAreaSuppliers(
                        selectedAreaId
                      )
                        .reduce(
                          (sum, supplier) =>
                            sum +
                            Number(
                              supplier.totalValue ||
                                0
                            ),
                          0
                        )
                        .toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Current records
                    </p>
                  </div>
                </div>

                {/* =========================================
                    SUPPLIER TABLE
                ========================================= */}
                {loading ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-16 text-center">
                    <RefreshCw
                      size={30}
                      className="mx-auto animate-spin text-emerald-500"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading suppliers...
                    </p>
                  </div>
                ) : selectedAreaSuppliers.length ===
                  0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-16 text-center">
                    <Users
                      size={35}
                      className="mx-auto text-slate-700"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      {search
                        ? "No suppliers found for your search."
                        : "No suppliers have been added to this area yet."}
                    </p>

                    {!search && (
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                      >
                        <Plus size={17} />
                        Add First Supplier
                      </button>
                    )}
                  </div>
                ) : (
                  <SuppliersTable
                    suppliers={selectedAreaSuppliers}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* =========================================
          SUPPLIER MODAL
      ========================================= */}
      <SupplierModal
        isOpen={modalOpen}
        supplier={editSupplierData}
        onClose={closeModal}
        onCreated={handleSupplierSaved}
      />
    </div>
  );
}
