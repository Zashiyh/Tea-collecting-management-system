
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Plus,
  RefreshCw,
  Scale,
  Users,
  X,
  CalendarDays,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface TeaRate {
  _id?: string;
  monthKey: string;
  supplierId: string;
  supplierName?: string;
  ratePerKg: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RatesResponse {
  success: boolean;
  message?: string;
  rates?: TeaRate[];
  data?: TeaRate[] | { rates?: TeaRate[] };
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMonth(monthKey: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
    return monthKey;
  }

  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function getApiRates(data: RatesResponse): TeaRate[] {
  if (Array.isArray(data.rates)) {
    return data.rates;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (
    data.data &&
    !Array.isArray(data.data) &&
    Array.isArray(data.data.rates)
  ) {
    return data.data.rates;
  }

  return [];
}

export default function TeaRatesPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [monthKey, setMonthKey] = useState(getCurrentMonth());
  const [supplierMode, setSupplierMode] = useState<"DEFAULT" | "SUPPLIER">(
    "DEFAULT"
  );

  const [supplierId, setSupplierId] = useState("");
  const [ratePerKg, setRatePerKg] = useState("");
  const [notes, setNotes] = useState("");

  const [rates, setRates] = useState<TeaRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRates = useCallback(async () => {
    if (!monthKey) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/supplier-finance/rates?monthKey=${encodeURIComponent(monthKey)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: RatesResponse;

      try {
        data = JSON.parse(text) as RatesResponse;
      } catch {
        throw new Error("Invalid server response. Please check the API.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load tea rates.");
      }

      setRates(getApiRates(data));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tea rates."
      );
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    void loadRates();
  }, [loadRates]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericRate = Number(ratePerKg);
    const selectedSupplierId =
      supplierMode === "DEFAULT" ? "__DEFAULT__" : supplierId.trim();

    if (!monthKey) {
      setError("Please select a month.");
      return;
    }

    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      setError("Enter a valid tea rate greater than zero.");
      return;
    }

    if (supplierMode === "SUPPLIER" && !supplierId.trim()) {
      setError("Enter the supplier ID, for example SUP-001.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/supplier-finance/rates", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monthKey,
          supplierId: selectedSupplierId,
          ratePerKg: numericRate,
          notes: notes.trim(),
        }),
      });

      const text = await response.text();

      let data: { success?: boolean; message?: string };

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response. Please try again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to save tea rate.");
      }

      setSuccess(
        supplierMode === "DEFAULT"
          ? `Default rate for ${formatMonth(monthKey)} saved successfully.`
          : `Rate for supplier ${supplierId.trim()} saved successfully.`
      );

      setRatePerKg("");
      setNotes("");

      await loadRates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save tea rate."
      );
    } finally {
      setSaving(false);
    }
  }

  const defaultRate = rates.find(
    (rate) => rate.supplierId === "__DEFAULT__"
  );

  const supplierRates = rates.filter(
    (rate) => rate.supplierId !== "__DEFAULT__"
  );

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:ml-64">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* PAGE HEADER */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/dashboard"
                className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-400"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-600/10 p-2.5 text-emerald-400">
                  <Scale size={21} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Monthly Tea Rates
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage factory and supplier-specific tea prices
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadRates()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#07140d] px-3.5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* NOTIFICATIONS */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
            >
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* MONTH FILTER */}
          <section className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#07140d] p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label
                htmlFor="rate-month"
                className="mb-1.5 block text-[11px] font-medium text-slate-500"
              >
                Select Month
              </label>

              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"
                />

                <input
                  id="rate-month"
                  type="month"
                  value={monthKey}
                  onChange={(event) => {
                    setMonthKey(event.target.value);
                    setSuccess("");
                    setError("");
                  }}
                  className="h-10 w-full rounded-lg border border-slate-800 bg-[#020a06] pl-9 pr-3 text-sm text-white outline-none transition focus:border-emerald-500 sm:w-[230px]"
                />
              </div>
            </div>

            <div className="text-sm text-slate-500">
              Active month:
              <span className="ml-2 font-semibold text-emerald-400">
                {formatMonth(monthKey)}
              </span>
            </div>
          </section>

          {/* SUMMARY CARDS */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500">Default Rate</p>
                <Coins size={17} className="text-emerald-400" />
              </div>

              <p className="mt-2 text-xl font-bold text-white">
                {defaultRate
                  ? formatCurrency(Number(defaultRate.ratePerKg))
                  : "Not set"}
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Per kilogram · Factory-wide
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  Supplier Overrides
                </p>
                <Users size={17} className="text-cyan-400" />
              </div>

              <p className="mt-2 text-xl font-bold text-white">
                {loading ? "—" : supplierRates.length}
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Special rates for this month
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#07140d] px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  Total Rate Records
                </p>
                <Building2 size={17} className="text-violet-400" />
              </div>

              <p className="mt-2 text-xl font-bold text-white">
                {loading ? "—" : rates.length}
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Saved for {formatMonth(monthKey)}
              </p>
            </div>
          </div>

          {/* RATE FORM */}
          <section className="mb-5 rounded-xl border border-slate-800 bg-[#07140d] p-4 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-lg bg-emerald-600/10 p-2 text-emerald-400">
                <Plus size={19} />
              </div>

              <div>
                <h2 className="text-base font-bold text-white">
                  Set Monthly Tea Rate
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Configure the default price or an individual supplier price.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-500">
                  Rate Type
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSupplierMode("DEFAULT")}
                    className={`rounded-lg border p-3 text-left transition ${
                      supplierMode === "DEFAULT"
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-slate-800 bg-[#020a06] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2
                        size={17}
                        className={
                          supplierMode === "DEFAULT"
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }
                      />
                      <span className="text-sm font-semibold text-white">
                        Factory Default
                      </span>
                    </div>

                    <p className="mt-1.5 pl-6 text-[11px] text-slate-500">
                      Applies when a supplier has no special rate.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSupplierMode("SUPPLIER")}
                    className={`rounded-lg border p-3 text-left transition ${
                      supplierMode === "SUPPLIER"
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-slate-800 bg-[#020a06] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users
                        size={17}
                        className={
                          supplierMode === "SUPPLIER"
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }
                      />
                      <span className="text-sm font-semibold text-white">
                        Supplier Specific
                      </span>
                    </div>

                    <p className="mt-1.5 pl-6 text-[11px] text-slate-500">
                      Overrides the default rate for one supplier.
                    </p>
                  </button>
                </div>
              </div>

              <div
                className={`grid gap-4 ${
                  supplierMode === "SUPPLIER"
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2"
                }`}
              >
                {supplierMode === "SUPPLIER" && (
                  <div>
                    <label
                      htmlFor="supplierId"
                      className="mb-1.5 block text-[11px] font-medium text-slate-500"
                    >
                      Supplier ID
                    </label>

                    <input
                      id="supplierId"
                      type="text"
                      required
                      value={supplierId}
                      onChange={(event) => setSupplierId(event.target.value)}
                      placeholder="e.g. SUP-001"
                      className="h-10 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="ratePerKg"
                    className="mb-1.5 block text-[11px] font-medium text-slate-500"
                  >
                    Rate Per Kilogram (LKR)
                  </label>

                  <input
                    id="ratePerKg"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={ratePerKg}
                    onChange={(event) => setRatePerKg(event.target.value)}
                    placeholder="e.g. 200.00"
                    className="h-10 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="rateNotes"
                  className="mb-1.5 block text-[11px] font-medium text-slate-500"
                >
                  Notes <span className="font-normal">(Optional)</span>
                </label>

                <textarea
                  id="rateNotes"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Reason for the rate or other details..."
                  className="w-full resize-y rounded-lg border border-slate-800 bg-[#020a06] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-5 text-slate-500">
                  Saving an existing month and supplier combination updates
                  that rate.
                </p>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Tea Rate"}
                </button>
              </div>
            </form>
          </section>

          {/* SAVED RATE TABLE */}
          <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#07140d]">
            <div className="flex flex-col gap-2 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-base font-bold text-white">
                  Saved Tea Rates
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Rates configured for {formatMonth(monthKey)}
                </p>
              </div>

              <span className="w-fit rounded-md border border-slate-800 bg-[#020a06] px-2.5 py-1 text-[11px] text-slate-400">
                {rates.length} record{rates.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-500">
                <RefreshCw size={16} className="animate-spin" />
                Loading tea rates...
              </div>
            ) : rates.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Coins size={32} className="mx-auto mb-3 text-slate-600" />

                <h3 className="text-sm font-semibold text-white">
                  No tea rates found
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Add a rate for {formatMonth(monthKey)} using the form above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0a1a11]">
                      <th className="border-r border-slate-800 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        #
                      </th>

                      <th className="border-r border-slate-800 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Month
                      </th>

                      <th className="border-r border-slate-800 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Rate Applies To
                      </th>

                      <th className="border-r border-slate-800 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Supplier ID
                      </th>

                      <th className="border-r border-slate-800 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Rate / KG
                      </th>

                      <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Notes
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rates.map((rate, index) => {
                      const isDefault = rate.supplierId === "__DEFAULT__";

                      return (
                        <tr
                          key={
                            rate._id ||
                            `${rate.monthKey}-${rate.supplierId}`
                          }
                          className="border-b border-slate-800/80 transition hover:bg-[#0a1a11]"
                        >
                          <td className="border-r border-slate-800/80 px-3 py-3 text-xs text-slate-600">
                            {index + 1}
                          </td>

                          <td className="border-r border-slate-800/80 px-3 py-3 text-xs text-slate-300">
                            {formatMonth(rate.monthKey)}
                          </td>

                          <td className="border-r border-slate-800/80 px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${
                                isDefault
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                  : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                              }`}
                            >
                              {isDefault ? (
                                <Building2 size={12} />
                              ) : (
                                <Users size={12} />
                              )}
                              {isDefault ? "Factory Default" : "Supplier"}
                            </span>
                          </td>

                          <td className="border-r border-slate-800/80 px-3 py-3 text-xs text-slate-300">
                            {isDefault ? "All suppliers" : rate.supplierId}
                          </td>

                          <td className="border-r border-slate-800/80 px-3 py-3 text-right text-sm font-semibold text-white">
                            {formatCurrency(Number(rate.ratePerKg))}
                          </td>

                          <td className="max-w-[220px] px-3 py-3 text-xs text-slate-500">
                            <span className="block truncate" title={rate.notes || ""}>
                              {rate.notes || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* INFO */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-800 bg-[#07140d] px-4 py-3 text-xs leading-5 text-slate-500">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-emerald-400" />
            <p>
              Supplier-specific rates take priority over the factory default.
              Updating a rate does not change an already finalized historical
              settlement.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
