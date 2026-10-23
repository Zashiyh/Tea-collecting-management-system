
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  LoaderCircle,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type SettlementStatus = "DRAFT" | "FINALIZED" | "PAID";

interface Settlement {
  _id?: string;
  settlementId: string;
  supplierId: string;
  supplierName: string;
  monthKey: string;
  totalKg: number;
  ratePerKg: number;
  grossAmount: number;
  deductions: Array<{
    transactionId?: string;
    type?: string;
    description?: string;
    amount: number;
  }>;
  totalDeductions: number;
  netAmount: number;
  status: SettlementStatus;
  finalizedAt?: string;
  paidAt?: string;
  paymentReference?: string;
  notes?: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusStyle: Record<SettlementStatus, string> = {
  DRAFT: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  FINALIZED: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-2xl border border-emerald-900/40 bg-[#07140d] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-100/55">{title}</p>
          <p className="mt-2 break-words text-xl font-bold text-white sm:text-2xl">
            {value}
          </p>
          <p className="mt-2 text-xs text-emerald-100/40">{subtitle}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/supplier-finance/settlements", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not load payments.");
      }

      setSettlements(Array.isArray(data.settlements) ? data.settlements : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading payments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const monthSettlements = useMemo(
    () => settlements.filter((item) => item.monthKey === monthKey),
    [settlements, monthKey]
  );

  const filteredSettlements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return monthSettlements
      .filter((item) => {
        const matchesSearch =
          !term ||
          item.supplierName?.toLowerCase().includes(term) ||
          item.supplierId?.toLowerCase().includes(term) ||
          item.settlementId?.toLowerCase().includes(term) ||
          item.paymentReference?.toLowerCase().includes(term);

        const matchesStatus =
          statusFilter === "ALL" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        (a.supplierName || "").localeCompare(b.supplierName || "")
      );
  }, [monthSettlements, search, statusFilter]);

  const totals = useMemo(() => {
    const pending = monthSettlements.filter((item) => item.status !== "PAID");
    const paid = monthSettlements.filter((item) => item.status === "PAID");

    return {
      suppliers: monthSettlements.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce(
        (sum, item) => sum + (Number(item.netAmount) || 0),
        0
      ),
      paidAmount: paid.reduce(
        (sum, item) => sum + (Number(item.netAmount) || 0),
        0
      ),
      paidCount: paid.length,
    };
  }, [monthSettlements]);

  const updateSettlement = async (
    item: Settlement,
    action: "FINALIZE" | "PAY"
  ) => {
    const id = item.settlementId;
    if (!id) {
      setError("Settlement ID is missing. Cannot update this payment.");
      return;
    }

    let paymentReference = "";

    if (action === "FINALIZE") {
      const confirmed = window.confirm(
        `Finalize ${item.supplierName}'s settlement for ${item.monthKey}?\n\nNet payment: ${money(item.netAmount)}\n\nCheck the kg, rate and deductions before continuing.`
      );

      if (!confirmed) return;
    }

    if (action === "PAY") {
      const entered = window.prompt(
        `Confirm payment of ${money(item.netAmount)} to ${item.supplierName}.\n\nEnter the bank reference, receipt number or payment reference:`
      );

      if (entered === null) return;

      paymentReference = entered.trim();

      if (!paymentReference) {
        setError("Payment reference is required to mark a settlement as PAID.");
        return;
      }
    }

    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/supplier-finance/settlements/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, paymentReference }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not update settlement.");
      }

      setSuccess(
        action === "FINALIZE"
          ? `${item.supplierName}'s settlement has been finalized.`
          : `Payment recorded for ${item.supplierName}.`
      );

      await loadSettlements();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update this settlement."
      );
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    const rows = [
      [
        "Settlement ID",
        "Month",
        "Supplier ID",
        "Supplier Name",
        "Total KG",
        "Rate Per KG",
        "Gross Amount",
        "Total Deductions",
        "Net Amount",
        "Status",
        "Payment Reference",
        "Paid Date",
      ],
      ...filteredSettlements.map((item) => [
        item.settlementId,
        item.monthKey,
        item.supplierId,
        item.supplierName,
        item.totalKg,
        item.ratePerKg,
        item.grossAmount,
        item.totalDeductions,
        item.netAmount,
        item.status,
        item.paymentReference || "",
        item.paidAt || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supplier-payments-${monthKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:ml-64">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-emerald-400">Finance / Payments</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Supplier Payments
              </h1>
              <p className="mt-2 text-sm text-emerald-100/50">
                Review monthly settlements and record supplier payments.
              </p>
            </div>

            <button
              onClick={() => void loadSettlements()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-800/60 bg-[#07140d] px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-950 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
            >
              <CircleAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Monthly Settlements"
              value={String(totals.suppliers)}
              subtitle="Suppliers with a settlement"
              icon={Wallet}
            />
            <SummaryCard
              title="Pending Payments"
              value={money(totals.pendingAmount)}
              subtitle={`${totals.pendingCount} settlement(s) not yet paid`}
              icon={Clock3}
            />
            <SummaryCard
              title="Payments Completed"
              value={money(totals.paidAmount)}
              subtitle={`${totals.paidCount} settlement(s) paid`}
              icon={CheckCircle2}
            />
            <SummaryCard
              title="Payment Month"
              value={monthKey}
              subtitle="Selected settlement period"
              icon={CalendarDays}
            />
          </div>

          <section className="rounded-2xl border border-emerald-900/40 bg-[#07140d] p-4 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="payment-month"
                    className="mb-2 block text-sm text-emerald-100/65"
                  >
                    Settlement month
                  </label>
                  <input
                    id="payment-month"
                    type="month"
                    value={monthKey}
                    onChange={(event) => setMonthKey(event.target.value)}
                    className="min-h-11 w-full rounded-xl border border-emerald-900/60 bg-[#020a06] px-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="payment-search"
                    className="mb-2 block text-sm text-emerald-100/65"
                  >
                    Search supplier
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-100/35" />
                    <input
                      id="payment-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Name, supplier ID or reference"
                      className="min-h-11 w-full rounded-xl border border-emerald-900/60 bg-[#020a06] pl-10 pr-3 text-sm text-white outline-none placeholder:text-emerald-100/30 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div>
                  <label
                    htmlFor="payment-status"
                    className="mb-2 block text-sm text-emerald-100/65"
                  >
                    Status
                  </label>
                  <select
                    id="payment-status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="min-h-11 w-full rounded-xl border border-emerald-900/60 bg-[#020a06] px-3 text-sm text-white outline-none focus:border-emerald-500 sm:w-40"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="FINALIZED">Finalized</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                <button
                  onClick={exportCsv}
                  disabled={filteredSettlements.length === 0}
                  className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl border border-emerald-800/60 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-emerald-900/40 bg-[#07140d]">
            <div className="flex flex-col gap-2 border-b border-emerald-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">Monthly payment records</h2>
                <p className="mt-1 text-sm text-emerald-100/45">
                  {filteredSettlements.length} record(s) for {monthKey}
                </p>
              </div>
              <span className="text-sm text-emerald-100/50">
                Net payable = earnings − deductions
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-56 items-center justify-center gap-3 text-emerald-100/60">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading payments...
              </div>
            ) : filteredSettlements.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                <Banknote className="h-10 w-10 text-emerald-500/50" />
                <h3 className="mt-4 font-semibold">No settlements found</h3>
                <p className="mt-2 max-w-md text-sm text-emerald-100/45">
                  There are no settlement records matching this month and filter.
                  Generate the supplier&apos;s monthly settlement first.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-[#020a06] text-xs uppercase tracking-wider text-emerald-100/50">
                    <tr>
                      <th className="px-5 py-4">Supplier</th>
                      <th className="px-5 py-4">Tea details</th>
                      <th className="px-5 py-4">Gross</th>
                      <th className="px-5 py-4">Deductions</th>
                      <th className="px-5 py-4">Net payable</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Payment details</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/30">
                    {filteredSettlements.map((item) => (
                      <tr
                        key={item.settlementId}
                        className="align-top transition hover:bg-emerald-950/20"
                      >
                        <td className="px-5 py-5">
                          <p className="font-semibold text-white">
                            {item.supplierName || "Unknown supplier"}
                          </p>
                          <p className="mt-1 text-xs text-emerald-100/45">
                            {item.supplierId}
                          </p>
                          <p className="mt-1 text-xs text-emerald-100/30">
                            {item.settlementId}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-medium">
                            {Number(item.totalKg || 0).toLocaleString()} kg
                          </p>
                          <p className="mt-1 text-xs text-emerald-100/45">
                            {money(item.ratePerKg)} / kg
                          </p>
                        </td>

                        <td className="px-5 py-5 font-medium">
                          {money(item.grossAmount)}
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-medium text-amber-300">
                            −{money(item.totalDeductions)}
                          </p>
                          {item.deductions?.length > 0 && (
                            <p className="mt-1 text-xs text-emerald-100/45">
                              {item.deductions.length} deduction(s)
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-emerald-300">
                            {money(item.netAmount)}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[item.status] || statusStyle.DRAFT}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          {item.status === "PAID" ? (
                            <>
                              <p className="font-medium text-emerald-300">
                                {item.paymentReference || "Reference not set"}
                              </p>
                              <p className="mt-1 text-xs text-emerald-100/45">
                                Paid: {formatDate(item.paidAt)}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-emerald-100/45">
                              {item.status === "FINALIZED"
                                ? "Ready for payment"
                                : "Awaiting finalization"}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          {item.status === "DRAFT" && (
                            <button
                              onClick={() =>
                                void updateSettlement(item, "FINALIZE")
                              }
                              disabled={busyId === item.settlementId}
                              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
                            >
                              {busyId === item.settlementId ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Finalize
                            </button>
                          )}

                          {item.status === "FINALIZED" && (
                            <button
                              onClick={() => void updateSettlement(item, "PAY")}
                              disabled={busyId === item.settlementId}
                              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#021108] hover:bg-emerald-400 disabled:opacity-50"
                            >
                              {busyId === item.settlementId ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Banknote className="h-4 w-4" />
                              )}
                              Mark as paid
                            </button>
                          )}

                          {item.status === "PAID" && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" />
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="text-xs leading-5 text-emerald-100/35">
            Finalize karanna kalin tea weight, monthly rate saha deductions
            check karanna. Payment reference eka actual payment receipt/bank
            reference ekata match wenna one.
          </p>
        </main>
      </div>
    </div>
  );
}
