"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Loader2,
  Save,
  UserPlus,
  X,
} from "lucide-react";

interface Area {
  _id: string;
  areaId: string;
  name: string;
  status: "Active" | "Inactive";
}

export interface SupplierEditData {
  id: string;
  name: string;
  phone: string;
  areaId: string;
  areaName: string;
  village: string;
  address: string;
  totalKg: number;
  totalValue: number;
  status: "Active" | "Inactive";
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  supplier?: SupplierEditData | null;
}

export default function SupplierModal({
  isOpen,
  onClose,
  onCreated,
  supplier,
}: SupplierModalProps) {
  const isEditMode = Boolean(supplier);

  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] =
    useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [areaId, setAreaId] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");

  const [status, setStatus] = useState<
    "Active" | "Inactive"
  >("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedArea = useMemo(() => {
    return areas.find(
      (area) => area.areaId === areaId
    );
  }, [areas, areaId]);

  /*
   * Load areas when modal opens
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    fetchAreas();
  }, [isOpen]);

  /*
   * Load supplier data into form
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (supplier) {
      setName(supplier.name);
      setPhone(supplier.phone);
      setAreaId(supplier.areaId);
      setVillage(supplier.village);
      setAddress(supplier.address || "");
      setStatus(supplier.status);
    } else {
      resetForm();
    }

    setError("");
  }, [isOpen, supplier]);

  async function fetchAreas() {
    try {
      setAreasLoading(true);

      const response = await fetch(
        "/api/areas",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load areas"
        );
      }

      /*
       * Keep active areas plus the current
       * supplier's area when editing.
       */
      const activeAreas = (
        data.areas || []
      ).filter(
        (area: Area) =>
          area.status === "Active" ||
          area.areaId === supplier?.areaId
      );

      setAreas(activeAreas);
    } catch (error) {
      console.error(
        "Fetch areas error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load areas"
      );
    } finally {
      setAreasLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setPhone("");
    setAreaId("");
    setVillage("");
    setAddress("");
    setStatus("Active");
    setError("");
  }

  function handleClose() {
    if (loading) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanVillage = village.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      setError(
        "Supplier name is required."
      );
      return;
    }

    if (!cleanPhone) {
      setError(
        "Phone number is required."
      );
      return;
    }

    if (!areaId) {
      setError(
        "Please select an area."
      );
      return;
    }

    if (!cleanVillage) {
      setError(
        "Village is required."
      );
      return;
    }

    if (!selectedArea) {
      setError(
        "Selected area is invalid."
      );
      return;
    }

    try {
      setLoading(true);

      const url = isEditMode
        ? `/api/suppliers/${supplier?.id}`
        : "/api/suppliers";

      const method = isEditMode
        ? "PATCH"
        : "POST";

      const body: Record<
        string,
        string
      > = {
        name: cleanName,
        phone: cleanPhone,
        areaId: selectedArea.areaId,
        areaName: selectedArea.name,
        village: cleanVillage,
        address: cleanAddress,
      };

      if (isEditMode) {
        body.status = status;
      }

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${
              isEditMode
                ? "update"
                : "create"
            } supplier`
        );
      }

      resetForm();
      onCreated();
    } catch (error) {
      console.error(
        "Supplier save error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save supplier"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={handleClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#07140d] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-[#07140d] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
              {isEditMode ? (
                <Save size={20} />
              ) : (
                <UserPlus size={20} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEditMode
                  ? "Edit Supplier"
                  : "Add Supplier"}
              </h2>

              <p className="text-xs text-slate-500">
                {isEditMode
                  ? `Update ${supplier?.id}`
                  : "Add a new tea leaf supplier"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-6"
        >
          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* Supplier ID */}
          {isEditMode && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Supplier ID
              </label>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm font-medium text-emerald-400">
                {supplier?.id}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="supplier-name"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Supplier Name
              <span className="ml-1 text-red-400">
                *
              </span>
            </label>

            <input
              id="supplier-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Enter supplier name"
              disabled={loading}
              className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Phone + Village */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="supplier-phone"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Phone Number
                <span className="ml-1 text-red-400">
                  *
                </span>
              </label>

              <input
                id="supplier-phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="07XXXXXXXX"
                disabled={loading}
                className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-village"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Village
                <span className="ml-1 text-red-400">
                  *
                </span>
              </label>

              <input
                id="supplier-village"
                type="text"
                value={village}
                onChange={(event) =>
                  setVillage(
                    event.target.value
                  )
                }
                placeholder="Enter village"
                disabled={loading}
                className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Area */}
          <div>
            <label
              htmlFor="supplier-area"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Collection Area
              <span className="ml-1 text-red-400">
                *
              </span>
            </label>

            {areasLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-slate-500">
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Loading areas...
              </div>
            ) : (
              <select
                id="supplier-area"
                value={areaId}
                onChange={(event) =>
                  setAreaId(
                    event.target.value
                  )
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-60"
              >
                <option value="">
                  Select collection area
                </option>

                {areas.map((area) => (
                  <option
                    key={area.areaId}
                    value={area.areaId}
                  >
                    {area.name} (
                    {area.areaId})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="supplier-address"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Address
              <span className="ml-2 text-xs font-normal text-slate-600">
                Optional
              </span>
            </label>

            <textarea
              id="supplier-address"
              value={address}
              onChange={(event) =>
                setAddress(
                  event.target.value
                )
              }
              placeholder="Enter supplier address"
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Status */}
          {isEditMode && (
            <div>
              <label
                htmlFor="supplier-status"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Status
              </label>

              <select
                id="supplier-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as
                      | "Active"
                      | "Inactive"
                  )
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-60"
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-slate-800 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                areasLoading ||
                areas.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  {isEditMode
                    ? "Updating..."
                    : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditMode
                    ? "Update Supplier"
                    : "Save Supplier"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}