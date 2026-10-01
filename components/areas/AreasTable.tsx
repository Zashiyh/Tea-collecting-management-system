"use client";

import {
  ArrowRight,
  Leaf,
  MapPin,
  Users,
} from "lucide-react";

export interface Area {
  _id: string;
  areaId: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  supplierCount?: number;
  todayKg?: number;
  todayValue?: number;
}

interface AreasTableProps {
  areas: Area[];
  onView: (area: Area) => void;
}

export default function AreasTable({
  areas,
  onView,
}: AreasTableProps) {
  if (areas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#07140e] p-12 text-center">
        <MapPin
          size={42}
          className="mx-auto mb-4 text-gray-600"
        />

        <h3 className="text-lg font-semibold text-white">
          No collection areas
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Add your first tea leaf collection area.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {areas.map((area) => (
        <div
          key={area._id}
          className="group rounded-2xl border border-white/10 bg-[#07140e] p-5 transition duration-200 hover:border-emerald-500/30 hover:bg-[#091a11]"
        >
          {/* Area header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="shrink-0 rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <MapPin size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-400">
                  {area.areaId}
                </p>

                <h3 className="mt-1 truncate text-lg font-semibold text-white">
                  {area.name}
                </h3>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
              {area.status}
            </span>
          </div>

          {/* Description */}
          {area.description && (
            <p className="mt-4 line-clamp-2 text-sm text-gray-500">
              {area.description}
            </p>
          )}

          {/* Statistics */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Users size={15} />

                <span className="text-xs">
                  Suppliers
                </span>
              </div>

              <p className="mt-1 text-lg font-semibold text-white">
                {area.supplierCount ?? 0}
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Leaf size={15} />

                <span className="text-xs">
                  Today
                </span>
              </div>

              <p className="mt-1 text-lg font-semibold text-white">
                {area.todayKg ?? 0} KG
              </p>
            </div>
          </div>

          {/* View button */}
          <button
            type="button"
            onClick={() => onView(area)}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400"
          >
            View Area

            <ArrowRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        </div>
      ))}
    </div>
  );
}