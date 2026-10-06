
"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  Factory,
  Leaf,
  Loader2,
  Save,
  Scale,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface Area {
  _id?: string;
  areaId: string;
  name: string;
  status?: "Active" | "Inactive";
}

interface Collection {
  _id?: string;
  collectionId: string;
  date: string;
  areaId?: string;
  areaName?: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes?: string;
}

interface EditCollectionModalProps {
  isOpen: boolean;
  collection: Collection;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
}

/* =========================================================
   HELPERS
========================================================= */

function getSriLankaDate(dateValue: string) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue.slice(0, 10);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EditCollectionModal({
  isOpen,
  collection,
  onClose,
  onUpdated,
}: EditCollectionModalProps) {
  /* =======================================================
     AREAS
  ======================================================= */

  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);

  /* =======================================================
     FORM
  ======================================================= */

  const [date, setDate] = useState("");
  const [areaId, setAreaId] = useState("");
  const [teaWeight, setTeaWeight] = useState("");
  const [factoryWeight, setFactoryWeight] = useState("");
  const [notes, setNotes] = useState("");

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =======================================================
     VALUES
  ======================================================= */

  const teaValue = Number(teaWeight || 0);
  const factoryValue = Number(factoryWeight || 0);

  const difference = Number(
    (factoryValue - teaValue).toFixed(2)
  );

  /* =======================================================
     SELECTED AREA
  ======================================================= */

  const selectedArea = useMemo(() => {
    const cleanId = areaId.trim();

    if (!cleanId) {
      return undefined;
    }

    return areas.find(
      (area) =>
        String(area.areaId).trim().toLowerCase() ===
        cleanId.toLowerCase()
    );
  }, [areas, areaId]);

  /* =======================================================
     LOAD AREAS
  ======================================================= */

  async function fetchAreas(
    currentAreaId: string,
    currentAreaName: string
  ) {
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
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid areas response.");
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load areas."
        );
      }

      const allAreas = Array.isArray(data.areas)
        ? data.areas
        : [];

      const cleanCurrentAreaId =
        String(currentAreaId || "").trim();

      const cleanCurrentAreaName =
        String(currentAreaName || "").trim();

      /* -----------------------------------------------------
         Show active areas + current collection area.
         This also keeps an inactive current area available
         for editing.
      ----------------------------------------------------- */

      const filteredAreas = allAreas.filter((area) => {
        const sameId =
          cleanCurrentAreaId &&
          String(area.areaId).trim().toLowerCase() ===
            cleanCurrentAreaId.toLowerCase();

        const sameName =
          cleanCurrentAreaName &&
          String(area.name).trim().toLowerCase() ===
            cleanCurrentAreaName.toLowerCase();

        return (
          area.status === "Active" ||
          sameId ||
          sameName
        );
      });

      /* -----------------------------------------------------
         First try exact area ID.
      ----------------------------------------------------- */

      let matchedArea = filteredAreas.find(
        (area) =>
          String(area.areaId).trim().toLowerCase() ===
          cleanCurrentAreaId.toLowerCase()
      );

      /* -----------------------------------------------------
         Fallback to area name.
      ----------------------------------------------------- */

      if (!matchedArea && cleanCurrentAreaName) {
        matchedArea = filteredAreas.find(
          (area) =>
            String(area.name).trim().toLowerCase() ===
            cleanCurrentAreaName.toLowerCase()
        );
      }

      /* -----------------------------------------------------
         Final fallback: search all areas.
      ----------------------------------------------------- */

      if (!matchedArea && cleanCurrentAreaName) {
        matchedArea = allAreas.find(
          (area) =>
            String(area.name).trim().toLowerCase() ===
            cleanCurrentAreaName.toLowerCase()
        );

        if (matchedArea) {
          const alreadyIncluded = filteredAreas.some(
            (area) =>
              String(area.areaId).trim().toLowerCase() ===
              String(matchedArea?.areaId)
                .trim()
                .toLowerCase()
          );

          if (!alreadyIncluded) {
            filteredAreas.push(matchedArea);
          }
        }
      }

      setAreas(filteredAreas);

      /* -----------------------------------------------------
         Restore the saved area after areas are loaded.
      ----------------------------------------------------- */

      if (matchedArea) {
        setAreaId(String(matchedArea.areaId).trim());
      } else if (cleanCurrentAreaId) {
        setAreaId(cleanCurrentAreaId);
      } else {
        setAreaId("");
      }
    } catch (error) {
      console.error(
        "EDIT COLLECTION AREAS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load areas."
      );
    } finally {
      setAreasLoading(false);
    }
  }

  /* =======================================================
     OPEN / COLLECTION CHANGE
  ======================================================= */

  useEffect(() => {
    if (!isOpen || !collection) {
      return;
    }

    const initialDate = getSriLankaDate(
      collection.date
    );

    const initialAreaId = String(
      collection.areaId || ""
    ).trim();

    const initialAreaName = String(
      collection.areaName || ""
    ).trim();

    setDate(initialDate);

    /* IMPORTANT:
       Keep existing area immediately.
       fetchAreas() will resolve it again after loading.
    */
    setAreaId(initialAreaId);

    setTeaWeight(
      collection.totalKg !== undefined &&
        collection.totalKg !== null
        ? String(collection.totalKg)
        : ""
    );

    setFactoryWeight(
      collection.factoryWeightKg !== undefined &&
        collection.factoryWeightKg !== null
        ? String(collection.factoryWeightKg)
        : ""
    );

    setNotes(collection.notes || "");
    setError("");

    void fetchAreas(
      initialAreaId,
      initialAreaName
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, collection?.collectionId]);

  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {
    if (loading) {
      return;
    }

    setError("");
    onClose();
  }

  /* =======================================================
     WEIGHT INPUT
  ======================================================= */

  function handleWeightChange(
    value: string,
    setter: (value: string) => void
  ) {
    /* Allows:
       100
       100.5
       1000.25
       .
       0.
    */

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setter(value);
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanDate = date.trim();
    const cleanAreaId = areaId.trim();

    /* -----------------------------------------------------
       DATE
    ----------------------------------------------------- */

    if (!cleanDate) {
      setError("Collection date is required.");
      return;
    }

    /* -----------------------------------------------------
       AREA
    ----------------------------------------------------- */

    let area: Area | undefined;

    if (cleanAreaId) {
      area = areas.find(
        (item) =>
          String(item.areaId).trim().toLowerCase() ===
          cleanAreaId.toLowerCase()
      );
    }

    /* Fallback using original collection area */

    if (!area && collection.areaName) {
      area = areas.find(
        (item) =>
          String(item.name).trim().toLowerCase() ===
          String(collection.areaName)
            .trim()
            .toLowerCase()
      );
    }

    /* Final fallback using collection.areaId */

    if (!area && collection.areaId) {
      area = areas.find(
        (item) =>
          String(item.areaId).trim().toLowerCase() ===
          String(collection.areaId)
            .trim()
            .toLowerCase()
      );
    }

    if (!area) {
      setError(
        "Please select an area."
      );
      return;
    }

    /* -----------------------------------------------------
       TEA WEIGHT
    ----------------------------------------------------- */

    const finalTeaValue = Number(teaWeight);

    if (
      teaWeight.trim() === "" ||
      !Number.isFinite(finalTeaValue) ||
      finalTeaValue <= 0
    ) {
      setError(
        "Please enter a valid tea weight."
      );
      return;
    }

    /* -----------------------------------------------------
       FACTORY WEIGHT
    ----------------------------------------------------- */

    const finalFactoryValue = Number(
      factoryWeight
    );

    if (
      factoryWeight.trim() === "" ||
      !Number.isFinite(finalFactoryValue) ||
      finalFactoryValue < 0
    ) {
      setError(
        "Please enter a valid factory weight."
      );
      return;
    }

    /* -----------------------------------------------------
       DIFFERENCE
       Factory - Tea
    ----------------------------------------------------- */

    const finalDifference = Number(
      (
        finalFactoryValue -
        finalTeaValue
      ).toFixed(2)
    );

    /* -----------------------------------------------------
       UPDATE
    ----------------------------------------------------- */

    try {
      setLoading(true);

      const body = {
        date: cleanDate,
        areaId: String(area.areaId).trim(),
        areaName: String(area.name).trim(),
        totalKg: finalTeaValue,
        factoryWeightKg: finalFactoryValue,
        differenceKg: finalDifference,
        notes: notes.trim(),
      };

      console.log(
        "UPDATING COLLECTION:",
        body
      );

      const response = await fetch(
        `/api/collections/${encodeURIComponent(
          collection.collectionId
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Server returned invalid response (${response.status}).`
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update collection."
        );
      }

      /* Refresh collection list */

      await onUpdated();

      /* Close only after successful update */

      onClose();
    } catch (error) {
      console.error(
        "EDIT COLLECTION ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update collection."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!isOpen) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-collection-title"
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

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] shadow-2xl">
        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-[#07140d] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
              <Save size={20} />
            </div>

            <div>
              <h2
                id="edit-collection-title"
                className="text-lg font-semibold text-white"
              >
                Edit Collection
              </h2>

              <p className="text-xs text-slate-500">
                {collection.collectionId}
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
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-5 p-5 sm:p-6">
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

            {/* DATE */}

            <div>
              <label
                htmlFor="edit-collection-date"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Collection Date
                <span className="ml-1 text-red-400">
                  *
                </span>
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="edit-collection-date"
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-800 bg-[#020a06] pl-10 pr-3 text-sm text-white outline-none transition focus:border-emerald-500 disabled:opacity-60"
                  style={{
                    colorScheme: "dark",
                  }}
                />
              </div>
            </div>

            {/* AREA */}

            <div>
              <label
                htmlFor="edit-collection-area"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Collection Area
                <span className="ml-1 text-red-400">
                  *
                </span>
              </label>

              {areasLoading ? (
                <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-[#020a06] px-4 text-sm text-slate-500">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Loading areas...
                </div>
              ) : (
                <select
                  id="edit-collection-area"
                  value={areaId}
                  onChange={(event) =>
                    setAreaId(
                      event.target.value
                    )
                  }
                  disabled={
                    loading ||
                    areas.length === 0
                  }
                  className="h-11 w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 text-sm text-white outline-none transition focus:border-emerald-500 disabled:opacity-60"
                >
                  <option value="">
                    Select collection area
                  </option>

                  {areas.map((area) => (
                    <option
                      key={`${area.areaId}`}
                      value={area.areaId}
                    >
                      {area.name} (
                      {area.areaId})
                      {area.status ===
                        "Inactive"
                        ? " - Inactive"
                        : ""}
                    </option>
                  ))}
                </select>
              )}

              {!areasLoading &&
                selectedArea && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                    <Leaf size={13} />

                    {selectedArea.name}{" "}
                    ({selectedArea.areaId})
                  </p>
                )}
            </div>

            {/* WEIGHTS */}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* TEA */}

              <div>
                <label
                  htmlFor="edit-tea-weight"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300"
                >
                  <Leaf
                    size={15}
                    className="text-emerald-400"
                  />

                  Tea / Field Weight

                  <span className="text-red-400">
                    *
                  </span>
                </label>

                <div className="relative">
                  <input
                    id="edit-tea-weight"
                    type="text"
                    inputMode="decimal"
                    value={teaWeight}
                    onChange={(event) =>
                      handleWeightChange(
                        event.target.value,
                        setTeaWeight
                      )
                    }
                    placeholder="0"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 pr-12 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-emerald-500 disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    KG
                  </span>
                </div>
              </div>

              {/* FACTORY */}

              <div>
                <label
                  htmlFor="edit-factory-weight"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300"
                >
                  <Factory
                    size={15}
                    className="text-blue-400"
                  />

                  Factory Weight

                  <span className="text-red-400">
                    *
                  </span>
                </label>

                <div className="relative">
                  <input
                    id="edit-factory-weight"
                    type="text"
                    inputMode="decimal"
                    value={factoryWeight}
                    onChange={(event) =>
                      handleWeightChange(
                        event.target.value,
                        setFactoryWeight
                      )
                    }
                    placeholder="0"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-800 bg-[#020a06] px-4 pr-12 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500 disabled:opacity-60"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    KG
                  </span>
                </div>
              </div>
            </div>

            {/* DIFFERENCE */}

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale
                    size={17}
                    className="text-amber-400"
                  />

                  <span className="text-sm font-medium text-slate-300">
                    Difference
                  </span>
                </div>

                <span
                  className={`text-lg font-bold ${
                    difference > 0
                      ? "text-cyan-400"
                      : difference < 0
                        ? "text-red-400"
                        : "text-emerald-400"
                  }`}
                >
                  {difference > 0
                    ? "+"
                    : ""}
                  {formatNumber(
                    difference
                  )}{" "}
                  KG
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600">
                Factory Weight − Tea /
                Field Weight
              </p>
            </div>

            {/* NOTES */}

            <div>
              <label
                htmlFor="edit-collection-notes"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Notes
                <span className="ml-2 text-xs font-normal text-slate-600">
                  Optional
                </span>
              </label>

              <textarea
                id="edit-collection-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={3}
                disabled={loading}
                placeholder="Enter notes"
                className="w-full resize-none rounded-xl border border-slate-800 bg-[#020a06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* FOOTER */}

          <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-800 bg-[#07140d] p-4 sm:flex-row sm:justify-end sm:px-6">
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
                !areaId ||
                !date ||
                teaWeight === "" ||
                factoryWeight === ""
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
