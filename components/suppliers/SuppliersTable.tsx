"use client";

import {
  Edit3,
  MapPin,
  Phone,
  Trash2,
  User,
} from "lucide-react";

export interface Supplier {
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

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export default function SuppliersTable({
  suppliers,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4 font-medium">
                Supplier
              </th>

              <th className="px-5 py-4 font-medium">
                Contact
              </th>

              <th className="px-5 py-4 font-medium">
                Area
              </th>

              <th className="px-5 py-4 font-medium">
                Village
              </th>

              <th className="px-5 py-4 font-medium">
                Total KG
              </th>

              <th className="px-5 py-4 font-medium">
                Total Value
              </th>

              <th className="px-5 py-4 font-medium">
                Status
              </th>

              <th className="px-5 py-4 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40"
              >
                {/* Supplier */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <User size={18} />
                    </div>

                    <div>
                      <p className="font-medium text-white">
                        {supplier.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {supplier.id}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Phone */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={15} />
                    {supplier.phone}
                  </div>
                </td>

                {/* Area */}
                <td className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={15}
                      className="mt-0.5 text-emerald-500"
                    />

                    <div>
                      <p className="text-slate-300">
                        {supplier.areaName}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {supplier.areaId}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Village */}
                <td className="px-5 py-4 text-slate-400">
                  {supplier.village}
                </td>

                {/* KG */}
                <td className="px-5 py-4 text-slate-300">
                  {Number(
                    supplier.totalKg || 0
                  ).toLocaleString()}{" "}
                  KG
                </td>

                {/* Value */}
                <td className="px-5 py-4 font-medium text-emerald-400">
                  Rs.{" "}
                  {Number(
                    supplier.totalValue || 0
                  ).toLocaleString(
                    "en-LK",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      supplier.status ===
                      "Active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {supplier.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(supplier)
                      }
                      title="Edit supplier"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(supplier)
                      }
                      title="Delete supplier"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}