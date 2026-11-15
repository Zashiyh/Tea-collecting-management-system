"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

interface Area {
  _id: string;
  areaId: string;
  name: string;
  status: "Active" | "Inactive";
}

interface SupplierFormRow {
  id: number;
  name: string;
  phone: string;
  village: string;
  address: string;
  image: File | null;
  imagePreview: string;
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
  imageUrl?: string;
  imagePublicId?: string;
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  supplier?: SupplierEditData | null;
}

const emptySupplierRow = (): SupplierFormRow => ({
  id: Date.now() + Math.random(),
  name: "",
  phone: "",
  village: "",
  address: "",
  image: null,
  imagePreview: "",
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function SupplierModal({
  isOpen,
  onClose,
  onCreated,
  supplier,
}: SupplierModalProps) {
  const isEditMode = Boolean(supplier);

  /* =========================================================
     AREAS
  ========================================================= */

  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);

  /* =========================================================
     ADD MODE
  ========================================================= */

  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [supplierRows, setSupplierRows] = useState<
    SupplierFormRow[]
  >([emptySupplierRow()]);

  /* =========================================================
     EDIT MODE
  ========================================================= */

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAreaId, setEditAreaId] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [status, setStatus] = useState<
    "Active" | "Inactive"
  >("Active");

  const [editImage, setEditImage] = useState<File | null>(
    null
  );

  const [editImagePreview, setEditImagePreview] =
    useState("");

  const [removeImage, setRemoveImage] = useState(false);

  /* =========================================================
     COMMON
  ========================================================= */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     SELECTED AREA
  ========================================================= */

  const activeAreaId = isEditMode
    ? editAreaId
    : selectedAreaId;

  const selectedArea = useMemo(() => {
    return areas.find(
      (area) => area.areaId === activeAreaId
    );
  }, [areas, activeAreaId]);

  /* =========================================================
     LOAD AREAS
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    fetchAreas();
  }, [isOpen]);

  /* =========================================================
     LOAD FORM DATA
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    if (supplier) {
      setEditName(supplier.name);
      setEditPhone(supplier.phone);
      setEditAreaId(supplier.areaId);
      setEditVillage(supplier.village);
      setEditAddress(supplier.address || "");
      setStatus(supplier.status);

      setEditImage(null);
      setEditImagePreview(supplier.imageUrl || "");
      setRemoveImage(false);

      setSelectedAreaId("");
      setSupplierRows([emptySupplierRow()]);
    } else {
      setEditName("");
      setEditPhone("");
      setEditAreaId("");
      setEditVillage("");
      setEditAddress("");
      setStatus("Active");

      setEditImage(null);
      setEditImagePreview("");
      setRemoveImage(false);

      setSelectedAreaId("");
      setSupplierRows([emptySupplierRow()]);
    }

    setError("");
  }, [isOpen, supplier]);

  /* =========================================================
     FETCH AREAS
  ========================================================= */

  async function fetchAreas() {
    try {
      setAreasLoading(true);
      setError("");

      const response = await fetch("/api/areas", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        areas?: Area[];
      };

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid areas response");
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load areas"
        );
      }

      const activeAreas = (data.areas || []).filter(
        (area) =>
          area.status === "Active" ||
          area.areaId === supplier?.areaId
      );

      setAreas(activeAreas);
    } catch (error) {
      console.error("Fetch areas error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load areas"
      );
    } finally {
      setAreasLoading(false);
    }
  }

  /* =========================================================
     IMAGE VALIDATION
  ========================================================= */

  function validateImage(file: File): boolean {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be less than 5 MB.");
      return false;
    }

    return true;
  }

  /* =========================================================
     UPLOAD IMAGE TO CLOUDINARY
  ========================================================= */

  async function uploadImage(file: File): Promise<{
  imageUrl: string;
  imagePublicId: string;
}> {
  const formData = new FormData();
formData.append("file", file);

  const response = await fetch(
    "/api/suppliers/upload",
    {
      method: "POST",
      body: formData,
    }
  );

    const text = await response.text();

    let data: {
      success?: boolean;
      message?: string;
      imageUrl?: string;
      imagePublicId?: string;
    };

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Invalid image upload response.");
    }

    if (
      !response.ok ||
      !data.success ||
      !data.imageUrl ||
      !data.imagePublicId
    ) {
      throw new Error(
        data.message || "Failed to upload image."
      );
    }

    return {
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId,
    };
  }

  /* =========================================================
     RESET
  ========================================================= */

  function resetForm() {
    setSelectedAreaId("");
    setSupplierRows([emptySupplierRow()]);

    setEditName("");
    setEditPhone("");
    setEditAreaId("");
    setEditVillage("");
    setEditAddress("");

    setEditImage(null);
    setEditImagePreview("");
    setRemoveImage(false);

    setStatus("Active");
    setError("");
  }

  /* =========================================================
     CLOSE
  ========================================================= */

  function handleClose() {
    if (loading) return;

    resetForm();
    onClose();
  }

  /* =========================================================
     ADD SUPPLIER ROW
  ========================================================= */

  function addSupplierRow() {
    setSupplierRows((current) => [
      ...current,
      emptySupplierRow(),
    ]);
  }

  /* =========================================================
     REMOVE SUPPLIER ROW
  ========================================================= */

  function removeSupplierRow(rowId: number) {
    setSupplierRows((current) => {
      if (current.length === 1) return current;

      return current.filter((row) => row.id !== rowId);
    });
  }

  /* =========================================================
     UPDATE SUPPLIER ROW
  ========================================================= */

  function updateSupplierRow(
    rowId: number,
    field: "name" | "phone" | "village" | "address",
    value: string
  ) {
    setSupplierRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? { ...row, [field]: value }
          : row
      )
    );
  }

  /* =========================================================
     SELECT ADD MODE IMAGE
  ========================================================= */

  function handleRowImageChange(
    rowId: number,
    file: File | null
  ) {
    if (!file) return;

    if (!validateImage(file)) return;

    const preview = URL.createObjectURL(file);

    setSupplierRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              image: file,
              imagePreview: preview,
            }
          : row
      )
    );

    setError("");
  }

  /* =========================================================
     REMOVE ADD MODE IMAGE
  ========================================================= */

  function removeRowImage(rowId: number) {
    setSupplierRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              image: null,
              imagePreview: "",
            }
          : row
      )
    );
  }

  /* =========================================================
     SELECT EDIT MODE IMAGE
  ========================================================= */

  function handleEditImageChange(file: File | null) {
    if (!file) return;

    if (!validateImage(file)) return;

    setEditImage(file);
    setEditImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    setError("");
  }

  /* =========================================================
     REMOVE EDIT MODE IMAGE
  ========================================================= */

  function handleRemoveEditImage() {
    setEditImage(null);
    setEditImagePreview("");
    setRemoveImage(true);
  }

  /* =========================================================
     SAVE SINGLE SUPPLIER
  ========================================================= */

  async function createSupplier(row: SupplierFormRow) {
    if (!selectedArea) {
      throw new Error("Selected area is invalid.");
    }

    let imageDetails = {
      imageUrl: "",
      imagePublicId: "",
    };

    if (row.image) {
      imageDetails = await uploadImage(row.image);
    }

    const body = {
      name: row.name.trim(),
      phone: row.phone.trim(),
      areaId: selectedArea.areaId,
      areaName: selectedArea.name,
      village: row.village.trim(),
      address: row.address.trim(),
      ...imageDetails,
    };

    const response = await fetch("/api/suppliers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    let data: {
      success?: boolean;
      message?: string;
    };

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Invalid server response.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || "Failed to create supplier."
      );
    }

    return data;
  }

  /* =========================================================
     UPDATE SINGLE SUPPLIER
  ========================================================= */

  async function updateSupplier() {
    if (!supplier) {
      throw new Error("Supplier data is missing.");
    }

    if (!selectedArea) {
      throw new Error("Selected area is invalid.");
    }

    const body: {
      name: string;
      phone: string;
      areaId: string;
      areaName: string;
      village: string;
      address: string;
      status: "Active" | "Inactive";
      imageUrl?: string;
      imagePublicId?: string;
      removeImage?: boolean;
    } = {
      name: editName.trim(),
      phone: editPhone.trim(),
      areaId: selectedArea.areaId,
      areaName: selectedArea.name,
      village: editVillage.trim(),
      address: editAddress.trim(),
      status,
    };

    if (editImage) {
      const imageDetails = await uploadImage(editImage);

      body.imageUrl = imageDetails.imageUrl;
      body.imagePublicId = imageDetails.imagePublicId;
    } else if (removeImage) {
      body.removeImage = true;
    }

    const response = await fetch(
      `/api/suppliers/${supplier.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const text = await response.text();

    let data: {
      success?: boolean;
      message?: string;
    };

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Invalid server response.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || "Failed to update supplier."
      );
    }

    return data;
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    /* =======================================================
       EDIT MODE
    ======================================================= */

    if (isEditMode) {
      if (!editName.trim()) {
        setError("Supplier name is required.");
        return;
      }

      if (!editPhone.trim()) {
        setError("Phone number is required.");
        return;
      }

      if (!editAreaId) {
        setError("Please select an area.");
        return;
      }

      if (!editVillage.trim()) {
        setError("Village is required.");
        return;
      }

      if (!selectedArea) {
        setError("Selected area is invalid.");
        return;
      }

      try {
        setLoading(true);

        await updateSupplier();

        resetForm();
        onCreated();
      } catch (error) {
        console.error("Supplier update error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to update supplier."
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    /* =======================================================
       ADD MODE
    ======================================================= */

    if (!selectedAreaId) {
      setError("Please select a collection area.");
      return;
    }

    if (!selectedArea) {
      setError("Selected area is invalid.");
      return;
    }

    if (supplierRows.length === 0) {
      setError("Please add at least one supplier.");
      return;
    }

    for (
      let index = 0;
      index < supplierRows.length;
      index++
    ) {
      const row = supplierRows[index];
      const rowNumber = index + 1;

      if (!row.name.trim()) {
        setError(
          `Supplier ${rowNumber}: Name is required.`
        );
        return;
      }

      if (!row.phone.trim()) {
        setError(
          `Supplier ${rowNumber}: Phone number is required.`
        );
        return;
      }

      if (!row.village.trim()) {
        setError(
          `Supplier ${rowNumber}: Village is required.`
        );
        return;
      }
    }

    try {
      setLoading(true);

      let successCount = 0;
      const failedMessages: string[] = [];

      for (
        let index = 0;
        index < supplierRows.length;
        index++
      ) {
        const row = supplierRows[index];

        try {
          await createSupplier(row);
          successCount++;
        } catch (error) {
          failedMessages.push(
            `Supplier ${index + 1}: ${
              error instanceof Error
                ? error.message
                : "Failed to save"
            }`
          );
        }
      }

      if (successCount === supplierRows.length) {
        resetForm();
        onCreated();
        return;
      }

      if (successCount > 0) {
        setError(
          `${successCount} supplier${
            successCount === 1 ? "" : "s"
          } saved successfully. ${
            supplierRows.length - successCount
          } failed. ${failedMessages.join(" | ")}`
        );
      } else {
        setError(
          failedMessages.join(" | ") ||
            "Failed to save suppliers."
        );
      }
    } catch (error) {
      console.error("Supplier save error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save suppliers."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     CLOSED
  ========================================================= */

  if (!isOpen) {
    return null;
  }

  /* =========================================================
     IMAGE UPLOAD UI
  ========================================================= */

  function ImageUpload({
    preview,
    onChange,
    onRemove,
    disabled,
    inputId,
  }: {
    preview: string;
    onChange: (file: File | null) => void;
    onRemove: () => void;
    disabled: boolean;
    inputId: string;
  }) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Profile Image
          <span className="ml-2 text-xs font-normal text-slate-600">
            Optional · Max 5 MB
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-[#020a06] p-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
            {preview ? (
              <img
                src={preview}
                alt="Supplier profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserPlus
                size={28}
                className="text-slate-600"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={inputId}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 ${
                disabled
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              <ImagePlus size={16} />
              {preview ? "Change Image" : "Choose Image"}
            </label>

            <input
              id={inputId}
              type="file"
              accept="image/*"
              disabled={disabled}
              className="hidden"
              onChange={(event) => {
                const file =
                  event.target.files?.[0] || null;

                onChange(file);
                event.target.value = "";
              }}
            />

            {preview && (
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <Trash2 size={15} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* OVERLAY */}

      <button
        type="button"
        aria-label="Close modal"
        onClick={handleClose}
        disabled={loading}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm disabled:cursor-not-allowed"
      />

      {/* MODAL */}

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-slate-800 bg-[#07140d] px-5 py-4 sm:px-6">
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
                  : "Add Suppliers"}
              </h2>

              <p className="text-xs text-slate-500">
                {isEditMode
                  ? `Update ${supplier?.id}`
                  : "Add multiple tea leaf suppliers at once"}
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

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* SCROLL AREA */}

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="space-y-5">
              {/* ERROR */}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{error}</span>
                </div>
              )}

              {/* EDIT MODE */}

              {isEditMode ? (
                <>
                  {/* SUPPLIER ID */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Supplier ID
                    </label>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm font-medium text-emerald-400">
                      {supplier?.id}
                    </div>
                  </div>

                  {/* PROFILE IMAGE */}

                  <ImageUpload
                    inputId="supplier-edit-image"
                    preview={editImagePreview}
                    disabled={loading}
                    onChange={handleEditImageChange}
                    onRemove={handleRemoveEditImage}
                  />

                  {/* NAME */}

                  <div>
                    <label
                      htmlFor="supplier-edit-name"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Supplier Name
                      <span className="ml-1 text-red-400">
                        *
                      </span>
                    </label>

                    <input
                      id="supplier-edit-name"
                      type="text"
                      value={editName}
                      onChange={(event) =>
                        setEditName(event.target.value)
                      }
                      placeholder="Enter supplier name"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* PHONE + VILLAGE */}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="supplier-edit-phone"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Phone Number
                        <span className="ml-1 text-red-400">
                          *
                        </span>
                      </label>

                      <input
                        id="supplier-edit-phone"
                        type="tel"
                        value={editPhone}
                        onChange={(event) =>
                          setEditPhone(event.target.value)
                        }
                        placeholder="07XXXXXXXX"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="supplier-edit-village"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Village
                        <span className="ml-1 text-red-400">
                          *
                        </span>
                      </label>

                      <input
                        id="supplier-edit-village"
                        type="text"
                        value={editVillage}
                        onChange={(event) =>
                          setEditVillage(event.target.value)
                        }
                        placeholder="Enter village"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* AREA */}

                  <div>
                    <label
                      htmlFor="supplier-edit-area"
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
                        id="supplier-edit-area"
                        value={editAreaId}
                        onChange={(event) =>
                          setEditAreaId(event.target.value)
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
                            {area.name} ({area.areaId})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* ADDRESS */}

                  <div>
                    <label
                      htmlFor="supplier-edit-address"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Address
                      <span className="ml-2 text-xs font-normal text-slate-600">
                        Optional
                      </span>
                    </label>

                    <textarea
                      id="supplier-edit-address"
                      value={editAddress}
                      onChange={(event) =>
                        setEditAddress(event.target.value)
                      }
                      placeholder="Enter supplier address"
                      rows={3}
                      disabled={loading}
                      className="w-full resize-none rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  {/* STATUS */}

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
                          event.target.value as
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
                </>
              ) : (
                /* ADD MODE */
                <>
                  {/* AREA SELECT */}

                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                    <label
                      htmlFor="supplier-common-area"
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
                        id="supplier-common-area"
                        value={selectedAreaId}
                        onChange={(event) =>
                          setSelectedAreaId(event.target.value)
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
                            {area.name} ({area.areaId})
                          </option>
                        ))}
                      </select>
                    )}

                    {selectedArea && (
                      <p className="mt-2 text-xs text-emerald-400">
                        All suppliers below will be added to{" "}
                        <span className="font-semibold">
                          {selectedArea.name}
                        </span>
                        .
                      </p>
                    )}
                  </div>

                  {/* SUPPLIER ROWS HEADER */}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Supplier List
                      </h3>

                      <p className="mt-1 text-xs text-slate-600">
                        Add multiple suppliers to the selected area.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addSupplierRow}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Add Supplier Row
                    </button>
                  </div>

                  {/* SUPPLIER ROWS */}

                  <div className="space-y-4">
                    {supplierRows.map((row, index) => (
                      <div
                        key={row.id}
                        className="rounded-2xl border border-slate-800 bg-[#020a06] p-4 sm:p-5"
                      >
                        {/* ROW TOP */}

                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                              {index + 1}
                            </span>

                            <span className="text-sm font-semibold text-white">
                              Supplier {index + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeSupplierRow(row.id)
                            }
                            disabled={
                              loading ||
                              supplierRows.length === 1
                            }
                            title={
                              supplierRows.length === 1
                                ? "At least one supplier is required"
                                : "Remove supplier"
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* PROFILE IMAGE */}

                        <div className="mb-4">
                          <ImageUpload
                            inputId={`supplier-image-${row.id}`}
                            preview={row.imagePreview}
                            disabled={loading}
                            onChange={(file) =>
                              handleRowImageChange(
                                row.id,
                                file
                              )
                            }
                            onRemove={() =>
                              removeRowImage(row.id)
                            }
                          />
                        </div>

                        {/* NAME */}

                        <div className="mb-4">
                          <label
                            htmlFor={`supplier-name-${row.id}`}
                            className="mb-2 block text-sm font-medium text-slate-300"
                          >
                            Supplier Name
                            <span className="ml-1 text-red-400">
                              *
                            </span>
                          </label>

                          <input
                            id={`supplier-name-${row.id}`}
                            type="text"
                            value={row.name}
                            onChange={(event) =>
                              updateSupplierRow(
                                row.id,
                                "name",
                                event.target.value
                              )
                            }
                            placeholder="Enter supplier name"
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                          />
                        </div>

                        {/* PHONE + VILLAGE */}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`supplier-phone-${row.id}`}
                              className="mb-2 block text-sm font-medium text-slate-300"
                            >
                              Phone Number
                              <span className="ml-1 text-red-400">
                                *
                              </span>
                            </label>

                            <input
                              id={`supplier-phone-${row.id}`}
                              type="tel"
                              value={row.phone}
                              onChange={(event) =>
                                updateSupplierRow(
                                  row.id,
                                  "phone",
                                  event.target.value
                                )
                              }
                              placeholder="07XXXXXXXX"
                              disabled={loading}
                              className="w-full rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`supplier-village-${row.id}`}
                              className="mb-2 block text-sm font-medium text-slate-300"
                            >
                              Village
                              <span className="ml-1 text-red-400">
                                *
                              </span>
                            </label>

                            <input
                              id={`supplier-village-${row.id}`}
                              type="text"
                              value={row.village}
                              onChange={(event) =>
                                updateSupplierRow(
                                  row.id,
                                  "village",
                                  event.target.value
                                )
                              }
                              placeholder="Enter village"
                              disabled={loading}
                              className="w-full rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                            />
                          </div>
                        </div>

                        {/* ADDRESS */}

                        <div className="mt-4">
                          <label
                            htmlFor={`supplier-address-${row.id}`}
                            className="mb-2 block text-sm font-medium text-slate-300"
                          >
                            Address
                            <span className="ml-2 text-xs font-normal text-slate-600">
                              Optional
                            </span>
                          </label>

                          <textarea
                            id={`supplier-address-${row.id}`}
                            value={row.address}
                            onChange={(event) =>
                              updateSupplierRow(
                                row.id,
                                "address",
                                event.target.value
                              )
                            }
                            placeholder="Enter supplier address"
                            rows={2}
                            disabled={loading}
                            className="w-full resize-none rounded-xl border border-slate-800 bg-[#07140d] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-60"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* FOOTER */}

          <div className="shrink-0 border-t border-slate-800 bg-[#07140d] p-4 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {/* CANCEL */}

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-800 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              {/* ADD ANOTHER */}

              {!isEditMode && (
                <button
                  type="button"
                  onClick={addSupplierRow}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={17} />
                  Add Another
                </button>
              )}

              {/* SUBMIT */}

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
                      : `Saving ${supplierRows.length} Supplier${
                          supplierRows.length === 1
                            ? ""
                            : "s"
                        }...`}
                  </>
                ) : (
                  <>
                    <Save size={18} />

                    {isEditMode
                      ? "Update Supplier"
                      : `Save ${supplierRows.length} Supplier${
                          supplierRows.length === 1
                            ? ""
                            : "s"
                        }`}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}