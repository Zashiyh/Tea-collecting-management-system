"use client";

import {
  MapPin,
  Users,
  Scale,
  Wallet,
  ArrowRight,
} from "lucide-react";

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

interface AreasTableProps {
  areas: Area[];
  onView?: (area: Area) => void;
}

export default function AreasTable({
  areas,
  onView,
}: AreasTableProps) {
  function formatNumber(value = 0) {
    return Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  }

  function formatMoney(value = 0) {
    return `Rs. ${Number(value).toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }

  if (areas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-10 text-center">
        <MapPin
          size={32}
          className="mx-auto text-slate-700"
        />

        <h3 className="mt-4 font-semibold text-white">
          No areas found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Add your first tea collection area.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {areas.map((area) => (
        <div
          key={area.areaId || area._id}
          className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] transition duration-200 hover:-translate-y-1 hover:border-emerald-500/30"
        >
          {/* Header */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MapPin size={21} />
                </div>

                <div>
                  <p className="text-xs font-medium text-emerald-400">
                    {area.areaId}
                  </p>

                  <h3 className="mt-1 font-semibold text-white">
                    {area.name}
                  </h3>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  area.status === "Inactive"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {area.status || "Active"}
              </span>
            </div>

            {area.description && (
              <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
                {area.description}
              </p>
            )}

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-900/50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users size={14} />
                  Suppliers
                </div>

                <p className="mt-1 text-lg font-bold text-white">
                  {area.supplierCount ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Scale size={14} />
                  Total KG
                </div>

                <p className="mt-1 text-lg font-bold text-white">
                  {formatNumber(
                    area.totalKg ?? area.todayKg ?? 0
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Scale size={14} />
                  Today
                </div>

                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {formatNumber(
                    area.todayKg ?? 0
                  )}{" "}
                  KG
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Wallet size={14} />
                  Value
                </div>

                <p className="mt-1 text-sm font-bold text-emerald-400">
                  {formatMoney(
                    area.totalValue ??
                      area.todayValue ??
                      0
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* View Area */}
          <button
            type="button"
            onClick={() => onView?.(area)}
            className="flex w-full items-center justify-between border-t border-slate-800 bg-slate-900/20 px-5 py-3.5 text-sm font-medium text-slate-400 transition hover:bg-emerald-500/5 hover:text-emerald-400"
          >
            <span>View Area</span>

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
      ))}
    </div>
  );
}