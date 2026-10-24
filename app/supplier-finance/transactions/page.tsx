"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ComponentType,
  type SVGProps,
} from "react";

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
  CheckCircle2,
  X,
  Banknote,
  FileText,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import type { LucideIcon } from "lucide-react";

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
  settlementId?: string;
  deductedAt?: string;
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

type SummaryIcon = ComponentType<SVGProps<SVGSVGElement>>;

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getCurrentDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Colombo",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
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

function formatMonth(monthKey?: string) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return "—";
  }

  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
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

function getErrorMessage(error: unknown, fallback: string) {
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
  icon: LucideIcon;
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

function getTransactionProgress(transaction: Transaction) {
  const originalAmount = Math.max(0, Number(transaction.amount || 0));

  const outstanding = Math.min(
    originalAmount,
    Math.max(
      0,
      Number(transaction.outstandingAmount ?? originalAmount)
    )
  );

  const paid = Math.max(0, originalAmount - outstanding);

  const progress =
    originalAmount > 0
      ? Math.min(100, Math.max(0, (paid / originalAmount) * 100))
      : 0;

  const installments = transaction.installments || [];

  const completedInstallments = installments.filter(
    (item) =>
      item.status === "DEDUCTED" ||
      (Number(item.amount || 0) > 0 &&
        Number(item.deductedAmount || 0) >= Number(item.amount || 0))
  ).length;

  const totalInstallments = installments.length;

  const remainingInstallments = installments.filter((item) => {
    const scheduled = Math.max(0, Number(item.amount || 0));
    const deducted = Math.max(0, Number(item.deductedAmount || 0));

    return item.status !== "DEDUCTED" && deducted < scheduled;
  }).length;

  return {
    originalAmount,
    outstanding,
    paid,
    progress,
    completedInstallments,
    totalInstallments,
    remainingInstallments,
  };
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
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [supplierId, setSupplierId] = useState("");
  const [type, setType] = useState<TransactionType>("ADVANCE");
  const [amount, setAmount] = useState("");
  const [deductionMode, setDeductionMode] =
    useState<DeductionMode>("FULL");
  const [firstDeductionMonth, setFirstDeductionMonth] =
    useState(getCurrentMonth());
  const [installmentMonths, setInstallmentMonths] = useState("3");
  const [notes, setNotes] = useState("");

  // Manual payment modal state
  const [paymentTransaction, setPaymentTransaction] =
    useState<Transaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getCurrentDate());
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [supplierResponse, transactionResponse] = await Promise.all([
        fetch("/api/suppliers", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/supplier-finance/transactions", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const [supplierText, transactionText] = await Promise.all([
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

      const matchesStatus =
        statusFilter === "ALL" || transaction.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const activeTransactions = useMemo(
    () => transactions.filter((item) => item.status === "ACTIVE"),
    [transactions]
  );

  const totalOutstanding = activeTransactions.reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        Number(item.outstandingAmount ?? item.amount ?? 0)
      ),
    0
  );

  const totalAdvances = activeTransactions
    .filter((item) => item.type === "ADVANCE")
    .reduce(
      (total, item) =>
        total +
        Math.max(
          0,
          Number(item.outstandingAmount ?? item.amount ?? 0)
        ),
      0
    );

  const totalLoans = activeTransactions
    .filter((item) => item.type === "LOAN")
    .reduce(
      (total, item) =>
        total +
        Math.max(
          0,
          Number(item.outstandingAmount ?? item.amount ?? 0)
        ),
      0
    );

  const totalFertilizer = activeTransactions
    .filter((item) => item.type === "FERTILIZER")
    .reduce(
      (total, item) =>
        total +
        Math.max(
          0,
          Number(item.outstandingAmount ?? item.amount ?? 0)
        ),
      0
    );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  function openPaymentModal(transaction: Transaction) {
    setError("");
    setSuccess("");
    setPaymentTransaction(transaction);
    setPaymentAmount("");
    setPaymentDate(getCurrentDate());
    setPaymentNotes("");
  }

  function closePaymentModal() {
    if (paymentSaving) return;

    setPaymentTransaction(null);
    setPaymentAmount("");
    setPaymentDate(getCurrentDate());
    setPaymentNotes("");
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentTransaction) return;

    setError("");
    setSuccess("");

    const numericPaymentAmount = Number(paymentAmount);
    const outstanding = Math.max(
      0,
      Number(
        paymentTransaction.outstandingAmount ?? paymentTransaction.amount
      )
    );

    if (
      !Number.isFinite(numericPaymentAmount) ||
      numericPaymentAmount <= 0
    ) {
      setError("Enter a valid payment amount greater than zero.");
      return;
    }

    if (numericPaymentAmount > outstanding + 0.001) {
      setError(
        `Payment cannot exceed the outstanding balance of ${formatMoney(
          outstanding
        )}.`
      );
      return;
    }

    if (!paymentDate) {
      setError("Please select the payment date.");
      return;
    }

    setPaymentSaving(true);

    try {
      const response = await fetch(
        `/api/supplier-finance/transactions/${encodeURIComponent(
          paymentTransaction.transactionId
        )}/payments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(numericPaymentAmount.toFixed(2)),
            paymentDate,
            notes: paymentNotes.trim(),
          }),
        }
      );

      const text = await response.text();

      let result: {
        success?: boolean;
        message?: string;
      };

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          "The server returned an invalid response. Check the payment API route."
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to record payment.");
      }

      setPaymentTransaction(null);
      setPaymentAmount("");
      setPaymentDate(getCurrentDate());
      setPaymentNotes("");

      setSuccess(
        result.message || "Payment recorded successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to record supplier payment.")
      );
    } finally {
      setPaymentSaving(false);
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

  const selectedPaymentOutstanding = paymentTransaction
    ? Math.max(
        0,
        Number(
          paymentTransaction.outstandingAmount ??
            paymentTransaction.amount ??
            0
        )
      )
    : 0;

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
                Manage supplier advances, loans, fertilizer debts and
                installment progress.
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
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="ml-auto shrink-0 text-red-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
            >
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                aria-label="Dismiss success message"
                className="ml-auto shrink-0 text-emerald-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Outstanding Total"
              value={formatMoney(totalOutstanding)}
              description="Remaining active balances"
              icon={Wallet}
            />

            <SummaryCard
              title="Outstanding Advances"
              value={formatMoney(totalAdvances)}
              description="Unpaid supplier advances"
              icon={ArrowDownLeft}
            />

            <SummaryCard
              title="Outstanding Loans"
              value={formatMoney(totalLoans)}
              description="Unpaid supplier loans"
              icon={HandCoins}
            />

            <SummaryCard
              title="Fertilizer Balance"
              value={formatMoney(totalFertilizer)}
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
                    Add an advance, loan or fertilizer amount.
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
                    placeholder={
                      type === "FERTILIZER"
                        ? "Fertilizer details or additional notes..."
                        : "Reason or additional details..."
                    }
                    className="w-full resize-y rounded-lg border border-slate-800 bg-[#020a06] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>
              </div>

              {deductionMode === "INSTALLMENT" && Number(amount) > 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">Total amount</p>
                      <p className="mt-1 font-semibold text-white">
                        {formatMoney(Number(amount))}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Estimated monthly installment
                      </p>
                      <p className="mt-1 font-semibold text-emerald-400">
                        {formatMoney(
                          Number(
                            (
                              Number(amount) /
                              Math.max(1, Number(installmentMonths))
                            ).toFixed(2)
                          )
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Installment period
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {installmentMonths} months
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Final installment may be adjusted for rounding.
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
                  Check outstanding balances and installment progress.
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
                    className="h-10 w-full rounded-lg border border-slate-800 bg-[#020a06] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 sm:w-56"
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

                <select
                  aria-label="Filter by transaction status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SETTLED">Settled</option>
                  <option value="CANCELLED">Cancelled</option>
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
                <Wallet size={32} className="mx-auto mb-3 text-slate-600" />
                <p className="font-medium text-white">No transactions found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {search || typeFilter !== "ALL" || statusFilter !== "ALL"
                    ? "Try changing your search or filters."
                    : "Transactions will appear here after you add them."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0a1a11]">
                      {[
                        "Transaction",
                        "Supplier",
                        "Type",
                        "Original Amount",
                        "Paid / Deducted",
                        "Outstanding",
                        "Installment Progress",
                        "Next Due",
                        "Status",
                        "Actions",
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
                    {filteredTransactions.map((transaction) => {
                      const progress = getTransactionProgress(transaction);
                      const installments = transaction.installments || [];

                      const nextInstallment = installments.find((item) => {
                        const scheduled = Number(item.amount || 0);
                        const deducted = Number(item.deductedAmount || 0);

                        return (
                          item.status !== "DEDUCTED" &&
                          deducted < scheduled
                        );
                      });

                      return (
                        <Fragment key={transaction.transactionId}>
                          <tr className="border-b border-slate-800/70 transition hover:bg-[#0a1a11]">
                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-white">
                                {transaction.transactionId}
                              </p>
                              {transaction.notes && (
                                <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                                  {transaction.notes}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <p className="whitespace-nowrap text-sm text-slate-200">
                                {transaction.supplierName || "—"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {transaction.supplierId}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <span className="whitespace-nowrap rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-300">
                                {typeLabel(transaction.type)}
                              </span>
                              {transaction.fertilizerName && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {transaction.fertilizerName}
                                </p>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-white">
                              {formatMoney(progress.originalAmount)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-emerald-400">
                              {formatMoney(progress.paid)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-amber-400">
                              {formatMoney(progress.outstanding)}
                            </td>

                            <td className="min-w-56 px-4 py-4">
                              {transaction.deductionMode === "INSTALLMENT" ? (
                                <div>
                                  <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="text-slate-300">
                                      {progress.completedInstallments} /{" "}
                                      {progress.totalInstallments} paid
                                    </span>
                                    <span className="font-medium text-emerald-400">
                                      {Math.round(progress.progress)}%
                                    </span>
                                  </div>

                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                      className="h-full rounded-full bg-emerald-500 transition-all"
                                      style={{
                                        width: `${progress.progress}%`,
                                      }}
                                    />
                                  </div>

                                  <p className="mt-2 text-[10px] text-slate-500">
                                    {formatMoney(
                                      Number(
                                        transaction.monthlyInstallmentAmount || 0
                                      )
                                    )}{" "}
                                    / month
                                  </p>

                                  <p className="mt-1 text-[10px] text-slate-500">
                                    {progress.remainingInstallments} installment
                                    {progress.remainingInstallments === 1
                                      ? ""
                                      : "s"}{" "}
                                    remaining
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs text-slate-300">
                                    Full deduction
                                  </p>
                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                      className="h-full rounded-full bg-emerald-500"
                                      style={{
                                        width: `${progress.progress}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    {Math.round(progress.progress)}% recovered
                                  </p>
                                </div>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              {transaction.deductionMode === "INSTALLMENT" &&
                              nextInstallment ? (
                                <>
                                  <p className="text-xs text-slate-300">
                                    {formatMonth(nextInstallment.monthKey)}
                                  </p>
                                  <p className="mt-1 text-xs text-amber-400">
                                    {formatMoney(
                                      Math.max(
                                        0,
                                        Number(nextInstallment.amount || 0) -
                                          Number(
                                            nextInstallment.deductedAmount || 0
                                          )
                                      )
                                    )}
                                  </p>
                                </>
                              ) : transaction.status === "SETTLED" ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                  <CheckCircle2 size={14} />
                                  Completed
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  {transaction.firstDeductionMonth
                                    ? `From ${formatMonth(
                                        transaction.firstDeductionMonth
                                      )}`
                                    : "—"}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClass(
                                  transaction.status
                                )}`}
                              >
                                {transaction.status || "UNKNOWN"}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              {transaction.status === "ACTIVE" &&
                              progress.outstanding > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPaymentModal(transaction)
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                                >
                                  <Plus size={14} />
                                  Record Payment
                                </button>
                              ) : transaction.status === "SETTLED" ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                  <CheckCircle2 size={14} />
                                  Paid in full
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  Not available
                                </span>
                              )}
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
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

      {/* Record Payment Modal */}
      {paymentTransaction && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePaymentModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-payment-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#07140d] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                  <Banknote size={22} />
                </div>

                <div>
                  <h2
                    id="record-payment-title"
                    className="text-lg font-semibold text-white"
                  >
                    Record Payment
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Record a payment against this supplier transaction.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={paymentSaving}
                aria-label="Close payment form"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handlePaymentSubmit}
              className="space-y-5 p-5"
            >
              <div className="rounded-xl border border-slate-800 bg-[#020a06] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      Transaction ID
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-white">
                      {paymentTransaction.transactionId}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {paymentTransaction.supplierName} ·{" "}
                      {typeLabel(paymentTransaction.type)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClass(
                      paymentTransaction.status
                    )}`}
                  >
                    {paymentTransaction.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      Original amount
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {formatMoney(
                        Number(paymentTransaction.amount || 0)
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Outstanding balance
                    </p>
                    <p className="mt-1 text-sm font-semibold text-amber-400">
                      {formatMoney(selectedPaymentOutstanding)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="payment-amount"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Payment Amount (LKR){" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  id="payment-amount"
                  type="number"
                  min="0.01"
                  max={selectedPaymentOutstanding}
                  step="0.01"
                  required
                  autoFocus
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(event.target.value)
                  }
                  placeholder="Enter payment amount"
                  className="h-12 w-full rounded-lg border border-slate-800 bg-[#020a06] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                />

                {Number(paymentAmount) > 0 &&
                  Number(paymentAmount) <= selectedPaymentOutstanding && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500">
                        Balance after payment
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {formatMoney(
                          Math.max(
                            0,
                            selectedPaymentOutstanding -
                              Number(paymentAmount)
                          )
                        )}
                      </span>
                    </div>
                  )}

                {Number(paymentAmount) > selectedPaymentOutstanding && (
                  <p className="mt-2 text-xs text-red-400">
                    Payment exceeds the outstanding balance.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="payment-date"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Payment Date <span className="text-red-400">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="payment-date"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(event) =>
                      setPaymentDate(event.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-slate-800 bg-[#020a06] pl-9 pr-3 text-sm text-white outline-none transition focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="payment-notes"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Payment Notes (optional)
                </label>

                <div className="relative">
                  <FileText
                    size={16}
                    className="pointer-events-none absolute left-3 top-3 text-slate-500"
                  />

                  <textarea
                    id="payment-notes"
                    rows={3}
                    maxLength={500}
                    value={paymentNotes}
                    onChange={(event) =>
                      setPaymentNotes(event.target.value)
                    }
                    placeholder="Payment reference or additional notes..."
                    className="w-full resize-y rounded-lg border border-slate-800 bg-[#020a06] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-slate-600">
                  {paymentNotes.length}/500
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="flex items-start gap-2 text-xs leading-5 text-amber-300">
                  <CircleAlert size={16} className="mt-0.5 shrink-0" />
                  Saving this payment will update the outstanding balance.
                  Verify the amount and date before confirming.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={paymentSaving}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    paymentSaving ||
                    !paymentAmount ||
                    Number(paymentAmount) <= 0 ||
                    Number(paymentAmount) > selectedPaymentOutstanding ||
                    !paymentDate ||
                    selectedPaymentOutstanding <= 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentSaving ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {paymentSaving ? "Saving Payment..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}