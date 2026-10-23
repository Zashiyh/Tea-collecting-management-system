
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  CalendarDays,
  CircleAlert,
  Clock3,
  HandCoins,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type TransactionType = "ADVANCE" | "LOAN" | "FERTILIZER";
type DeductionMode = "FULL" | "INSTALLMENT";
type TransactionStatus = "ACTIVE" | "SETTLED" | "CANCELLED";

interface Supplier {
  supplierId: string;
  name: string;
  phone?: string;
  status?: string;
}

interface Installment {
  monthKey: string;
  amount: number;
  deductedAmount?: number;
  status?: string;
}

interface Transaction {
  _id?: string;
  transactionId: string;
  supplierId: string;
  supplierName: string;
  type: TransactionType;
  amount: number;
  outstandingAmount?: number;
  transactionDate?: string;
  deductionMode?: DeductionMode;
  firstDeductionMonth?: string;
  installmentMonths?: number;
  monthlyInstallmentAmount?: number;
  status?: TransactionStatus;
  notes?: string;
  fertilizerName?: string;
  fertilizerQuantity?: number;
  fertilizerUnit?: string;
  installments?: Installment[];
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  suppliers?: T[];
  transactions?: T[];
  data?: T[] | {
    suppliers?: Supplier[];
    transactions?: Transaction[];
  };
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMoney(value: number) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(date);
}

function getArray<T>(
  response: ApiResponse<T>,
  key: "suppliers" | "transactions"
): T[] {
  if (Array.isArray(response[key])) {
    return response[key] as T[];
  }

  if (Array.isArray(response.data)) {
    return response.data as T[];
  }

  if (response.data && !Array.isArray(response.data)) {
    const nested = response.data[key];

    if (Array.isArray(nested)) {
      return nested as T[];
    }
  }

  return [];
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error ? error.message : fallback;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#07140d] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p className="mt-2 break-words text-xl font-bold text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function SupplierTransactionsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [supplierId, setSupplierId] = useState("");
  const [type, setType] = useState<TransactionType>("ADVANCE");
  const [amount, setAmount] = useState("");
  const [deductionMode, setDeductionMode] =
    useState<DeductionMode>("FULL");
  const [firstDeductionMonth, setFirstDeductionMonth] =
    useState(getCurrentMonth());
  const [installmentMonths, setInstallmentMonths] = useState("3");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [supplierResponse, transactionResponse] =
        await Promise.all([
          fetch("/api/suppliers", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/supplier-finance/transactions", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      const [supplierText, transactionText] =
        await Promise.all([
          supplierResponse.text(),
          transactionResponse.text(),
        ]);

      let supplierData: ApiResponse<Supplier>;
      let transactionData: ApiResponse<Transaction>;

      try {
        supplierData = JSON.parse(supplierText);
      } catch {
        throw new Error("Invalid response received from suppliers API.");
      }

      try {
        transactionData = JSON.parse(transactionText);
      } catch {
        throw new Error("Invalid response received from transactions API.");
      }

      if (!supplierResponse.ok || supplierData.success === false) {
        throw new Error(
          supplierData.message || "Failed to load suppliers."
        );
      }

      if (!transactionResponse.ok || transactionData.success === false) {
        throw new Error(
          transactionData.message || "Failed to load transactions."
        );
      }

      setSuppliers(getArray(supplierData, "suppliers"));
      setTransactions(getArray(transactionData, "transactions"));
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to load supplier finance data.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        !term ||
        transaction.transactionId?.toLowerCase().includes(term) ||
        transaction.supplierName?.toLowerCase().includes(term) ||
        transaction.supplierId?.toLowerCase().includes(term) ||
        transaction.notes?.toLowerCase().includes(term) ||
        transaction.fertilizerName?.toLowerCase().includes(term);

      const matchesType =
        typeFilter === "ALL" || transaction.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  const activeTransactions = transactions.filter(
    (item) => item.status === "ACTIVE"
  );

  const totalOutstanding = activeTransactions.reduce(
    (total, item) => total + Number(item.outstandingAmount ?? item.amount ?? 0),
    0
  );

  const totalAdvances = activeTransactions
    .filter((item) => item.type === "ADVANCE")
    .reduce(
      (total, item) => total + Number(item.outstandingAmount ?? item.amount ?? 0),
      0
    );

  const totalLoans = activeTransactions
    .filter((item) => item.type === "LOAN")
    .reduce(
      (total, item) => total + Number(item.outstandingAmount ?? item.amount ?? 0),
      0
    );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);
    const numericInstallments = Number(installmentMonths);

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (!firstDeductionMonth) {
      setError("Please select the first deduction month.");
      return;
    }

    if (
      deductionMode === "INSTALLMENT" &&
      (!Number.isInteger(numericInstallments) ||
        numericInstallments < 1 ||
        numericInstallments > 120)
    ) {
      setError("Installments must be between 1 and 120 months.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/supplier-finance/transactions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierId,
          type,
          amount: numericAmount,
          deductionMode,
          firstDeductionMonth,
          installmentMonths:
            deductionMode === "INSTALLMENT"
              ? numericInstallments
              : 1,
          notes: notes.trim(),
        }),
      });

      const text = await response.text();

      let result: {
        success?: boolean;
        message?: string;
      };

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Invalid response received from the server.");
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to save transaction.");
      }

      setSuccess(result.message || "Transaction saved successfully.");
      setAmount("");
      setNotes("");
      setDeductionMode("FULL");
      setInstallmentMonths("3");

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save transaction."));
    } finally {
      setSaving(false);
    }
  }

  function typeLabel(value: TransactionType) {
    switch (value) {
      case "ADVANCE":
        return "Advance";
      case "LOAN":
        return "Loan";
      case "FERTILIZER":
        return "Fertilizer";
    }
  }

  function statusClass(status?: TransactionStatus) {
    switch (status) {
      case "ACTIVE":
        return "border-amber-500/20 bg-amber-500/10 text-amber-400";
      case "SETTLED":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
      case "CANCELLED":
        return "border-red-500/20 bg-red-500/10 text-red-400";
      default:
        return "border-slate-700 bg-slate-800/50 text-slate-400";
    }
  }

  return (
    <div className="min-h-screen bg-[#020a06] text-white">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:ml-64">
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
                Supplier Finance
              </p>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Advances &amp; Loans
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage supplier advances, loans and finance transactions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#07140d] px-4 py-2.5 text-sm text-slate-300 transition hover:border-emerald-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
            >
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
            >
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Outstanding Total"
              value={formatMoney(totalOutstanding)}
              description="Active transaction balances"
              icon={Wallet}
            />

            <SummaryCard
              title="Outstanding Advances"
              value={formatMoney(totalAdvances)}
              description="Active supplier advances"
              icon={ArrowDownLeft}
            />

            <SummaryCard
              title="Outstanding Loans"
              value={formatMoney(totalLoans)}
              description="Active supplier loans"
              icon={HandCoins}
            />

            <SummaryCard
              title="Transactions"
              value={String(transactions.length)}
              description={`${activeTransactions.length} active transactions`}
              icon={Clock3}
            />
          </div>

          <section className="rounded-xl border border-slate-800 bg-[#07140d]">
            <div className="border-b border-slate-800 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <Plus size={18} />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Record Transaction
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Add an advance, loan or fertilizer deduction.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label
                    htmlFor="supplier"
                    className="mb-2 block text-xs font-medium text-slate-400"
                  >
                    Supplier <span className="text-red-400">*</span>
                  </label>

                  <div className="relative">
                    <UserRound
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <select
                      id="supplier"
                      value={supplierId}
                      onChange={(event) => setSupplierId(event.target.value)}
                      required
                      className="h-11 w-full rounded-lg border border-slate-800 bg-[#020a06] pl-9 pr-3 text-sm text-white outline-none transition focus:border-emerald-500"
                    >
                      <option value="">Select supplier</option>

                      {suppliers.map((supplier) => (
                        <option
                          key={supplier.supplierId}
                          value={supplier.supplierId}
                        >
                          {supplier.name} ({supplier.supplierId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!loading && suppliers.length === 0 && (
                    <p className="mt-2 text-xs text-amber-400">
                      No suppliers found. Add a supplier first.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="transaction-type"
                    className="mb-2 block text-xs font-medium text-slate-400"
                  >
                    Transaction Type
                  </label>

                  <select
                    id="transaction-type"
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value as TransactionType)
                    }
                    className="h-11 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                  >
                    <option value="ADVANCE">Supplier Advance</option>
                    <option value="LOAN">Loan</option>
                    <option value="FERTILIZER">Fertilizer</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-xs font-medium text-slate-400"
                  >
                    Amount (LKR) <span className="text-red-400">*</span>
                  </label>

                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                    placeholder="0.00"
                    className="h-11 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deduction-mode"
                    className="mb-2 block text-xs font-medium text-slate-400"
                  >
                    Deduction Method
                  </label>

                  <select
                    id="deduction-mode"
                    value={deductionMode}
                    onChange={(event) =>
                      setDeductionMode(event.target.value as DeductionMode)
                    }
                    className="h-11 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                  >
                    <option value="FULL">Full deduction</option>
                    <option value="INSTALLMENT">Monthly installments</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="first-deduction-month"
                    className="mb-2 block text-xs font-medium text-slate-400"
                  >
                    First Deduction Month
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="first-deduction-month"
                      type="month"
                      value={firstDeductionMonth}
                      onChange={(event) =>
                        setFirstDeductionMonth(event.target.value)
                      }
                      required
                      className="h-11 w-full rounded-lg border border-slate-800 bg-[#020a06] pl-9 pr-3 text-sm text-white outline-none transition focus:border-emerald-500"
                    />
                  </div>
                </div>

                {deductionMode === "INSTALLMENT" && (
                  <div>
                    <label
                      htmlFor="installment-months"
                      className="mb-2 block text-xs font-medium text-slate-400"
                    >
                      Number of Installments
                    </label>

                    <select
                      id="installment-months"
                      value={installmentMonths}
                      onChange={(event) =>
                        setInstallmentMonths(event.target.value)
                      }
                      className="h-11 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map(
                        (months) => (
                          <option key={months} value={months}>
                            {months} months
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2 xl:col-span-3">
                  <label
                    htmlFor="notes"
                    className="mb-2 block text-xs font-medium text-slate-400"
                  >
                    Notes (optional)
                  </label>

                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Reason or additional details..."
                    className="w-full resize-y rounded-lg border border-slate-800 bg-[#020a06] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>
              </div>

              {deductionMode === "INSTALLMENT" && Number(amount) > 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                  <p className="text-slate-400">
                    Estimated monthly installment
                  </p>
                  <p className="mt-1 font-semibold text-emerald-400">
                    {formatMoney(
                      Number(amount) / Math.max(1, Number(installmentMonths))
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    The final installment may be adjusted for rounding by the
                    backend.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  <CircleAlert size={14} className="mr-1 inline" />
                  Check the supplier and deduction schedule before saving.
                </p>

                <button
                  type="submit"
                  disabled={saving || loading || suppliers.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Plus size={17} />
                  )}
                  {saving ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#07140d]">
            <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-white">
                  Transaction History
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Review advances, loans and fertilizer records.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search supplier or ID..."
                    className="h-10 w-full rounded-lg border border-slate-800 bg-[#020a06] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 sm:w-64"
                  />
                </div>

                <select
                  aria-label="Filter by transaction type"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="ALL">All types</option>
                  <option value="ADVANCE">Advances</option>
                  <option value="LOAN">Loans</option>
                  <option value="FERTILIZER">Fertilizer</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-500">
                <LoaderCircle size={18} className="animate-spin" />
                Loading transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Wallet
                  size={32}
                  className="mx-auto mb-3 text-slate-600"
                />
                <p className="font-medium text-white">
                  No transactions found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {search || typeFilter !== "ALL"
                    ? "Try changing your search or filter."
                    : "Transactions will appear here after you add them."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0a1a11]">
                      {[
                        "Transaction",
                        "Supplier",
                        "Type",
                        "Amount",
                        "Outstanding",
                        "Deduction",
                        "Date",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.transactionId}
                        className="border-b border-slate-800/70 transition last:border-0 hover:bg-[#0a1a11]"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">
                            {transaction.transactionId}
                          </p>
                          {transaction.notes && (
                            <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                              {transaction.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p className="whitespace-nowrap text-sm text-slate-200">
                            {transaction.supplierName || "—"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {transaction.supplierId}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="whitespace-nowrap rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-300">
                            {typeLabel(transaction.type)}
                          </span>
                          {transaction.fertilizerName && (
                            <p className="mt-1 text-xs text-slate-500">
                              {transaction.fertilizerName}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-white">
                          {formatMoney(transaction.amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-amber-400">
                          {formatMoney(
                            transaction.outstandingAmount ??
                              transaction.amount
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p className="whitespace-nowrap text-xs text-slate-300">
                            {transaction.deductionMode === "INSTALLMENT"
                              ? `${transaction.installmentMonths || "—"} months`
                              : "Full"}
                          </p>
                          {transaction.firstDeductionMonth && (
                            <p className="mt-1 whitespace-nowrap text-[10px] text-slate-500">
                              From {transaction.firstDeductionMonth}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                          {formatDate(transaction.transactionDate)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClass(
                              transaction.status
                            )}`}
                          >
                            {transaction.status || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredTransactions.length > 0 && (
              <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
                Showing {filteredTransactions.length} of{" "}
                {transactions.length} transactions
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
