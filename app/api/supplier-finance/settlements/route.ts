
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

import Supplier from "@/models/Supplier";
import SupplierTeaCollection from "@/models/SupplierTeaCollection";
import MonthlyTeaRate from "@/models/MonthlyTeaRate";
import SupplierAccountTransaction from "@/models/SupplierAccountTransaction";
import SupplierMonthlySettlement from "@/models/SupplierMonthlySettlement";

export const runtime = "nodejs";

type InstallmentForCalculation = {
  monthKey: string;
  amount: number;
  deductedAmount?: number;
  status?: string;
};

type TransactionForCalculation = {
  transactionId: string;
  type: "ADVANCE" | "LOAN" | "FERTILIZER";
  supplierId: string;
  outstandingAmount?: number;
  deductionMode: "FULL" | "INSTALLMENT";
  firstDeductionMonth?: string;
  transactionDate?: Date;
  createdAt?: Date;
  installments?: InstallmentForCalculation[];
  fertilizerName?: string;
};

function isValidMonthKey(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  const start = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`
  );

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const end = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+05:30`
  );

  return { start, end };
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unexpected server error";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { success: false, message: "Please log in to continue." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        success: false,
        message: "Administrator access is required.",
      },
      { status: 403 }
    );
  }

  console.error("Supplier settlement API error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Failed to process settlement.",
    },
    { status: 500 }
  );
}

/**
 * GET
 * Retrieve saved settlements.
 *
 * Optional query parameters:
 * ?monthKey=2026-10
 * ?supplierId=SUP-001
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);

    const monthKey = searchParams.get("monthKey");
    const supplierId = searchParams.get("supplierId");

    const filter: Record<string, unknown> = {};

    if (monthKey) {
      if (!isValidMonthKey(monthKey)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid monthKey. Use YYYY-MM.",
          },
          { status: 400 }
        );
      }

      filter.monthKey = monthKey;
    }

    if (supplierId) {
      filter.supplierId = supplierId;
    }

    const settlements = await SupplierMonthlySettlement.find(filter)
      .sort({ monthKey: -1, supplierName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST
 * Calculate and save a DRAFT settlement.
 *
 * This endpoint does not deduct transaction balances.
 * Finalization must apply deductions separately.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();

    const supplierId =
      typeof body.supplierId === "string"
        ? body.supplierId.trim()
        : "";

    const monthKey =
      typeof body.monthKey === "string"
        ? body.monthKey.trim()
        : "";

    if (!supplierId || !isValidMonthKey(monthKey)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "supplierId and a valid monthKey (YYYY-MM) are required.",
        },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findOne({
      supplierId,
      status: "Active",
    }).lean();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Active supplier was not found.",
        },
        { status: 404 }
      );
    }

    // Do not recalculate a finalized or paid settlement.
    const existing = await SupplierMonthlySettlement.findOne({
      supplierId,
      monthKey,
    });

    if (existing && existing.status !== "DRAFT") {
      return NextResponse.json({
        success: true,
        message:
          "This settlement is already finalized and cannot be recalculated.",
        settlement: existing,
        unchanged: true,
      });
    }

    // Prefer the supplier-specific rate; otherwise use the factory default.
    const rateRecord =
      (await MonthlyTeaRate.findOne({
        monthKey,
        supplierId,
      }).lean()) ||
      (await MonthlyTeaRate.findOne({
        monthKey,
        supplierId: "__DEFAULT__",
      }).lean());

    if (!rateRecord) {
      return NextResponse.json(
        {
          success: false,
          message: `No tea rate is configured for ${monthKey}. Set a monthly default rate or a supplier-specific rate first.`,
        },
        { status: 400 }
      );
    }

    const { start, end } = getMonthRange(monthKey);

    const collectionTotals = await SupplierTeaCollection.aggregate<{
      totalKg: number;
    }>([
      {
        $match: {
          supplierId,
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          totalKg: { $sum: "$weightKg" },
        },
      },
    ]);

    const totalKg = Number(collectionTotals[0]?.totalKg ?? 0);
    const ratePerKg = Number(rateRecord.ratePerKg);
    const grossAmount = Number((totalKg * ratePerKg).toFixed(2));

    // Load active debts eligible for deductions in this month.
    const rawTransactions = await SupplierAccountTransaction.find({
      supplierId,
      status: "ACTIVE",
      firstDeductionMonth: { $lte: monthKey },
    })
      .sort({ transactionDate: 1, createdAt: 1 })
      .lean();

    const transactions =
      rawTransactions as unknown as TransactionForCalculation[];

    let remainingGross = grossAmount;
    let totalDeductions = 0;

    const deductions: Array<{
      transactionId: string;
      type: "ADVANCE" | "LOAN" | "FERTILIZER";
      description: string;
      amount: number;
    }> = [];

    for (const transaction of transactions) {
      if (remainingGross <= 0) break;

      const outstanding = Math.max(
        0,
        Number(transaction.outstandingAmount ?? 0)
      );

      if (outstanding <= 0) continue;

      let amountDue = 0;

      if (transaction.deductionMode === "FULL") {
        amountDue = outstanding;
      } else {
        // Include only unpaid installments scheduled for this month or earlier.
        const installments: InstallmentForCalculation[] =
          transaction.installments ?? [];

        amountDue = installments.reduce(
          (sum: number, installment: InstallmentForCalculation) => {
            if (
              installment.monthKey <= monthKey &&
              installment.status !== "DEDUCTED"
            ) {
              const installmentAmount = Math.max(
                0,
                Number(installment.amount ?? 0)
              );

              const alreadyPaid = Math.max(
                0,
                Number(installment.deductedAmount ?? 0)
              );

              const unpaid = Math.max(
                0,
                installmentAmount - alreadyPaid
              );

              return sum + unpaid;
            }

            return sum;
          },
          0
        );
      }

      amountDue = Math.min(
        amountDue,
        outstanding,
        remainingGross
      );

      amountDue = Number(amountDue.toFixed(2));

      if (amountDue <= 0) continue;

      const description =
        transaction.type === "FERTILIZER"
          ? `Fertilizer: ${transaction.fertilizerName || "Fertilizer"}`
          : transaction.type === "ADVANCE"
            ? `Supplier advance (${transaction.transactionId})`
            : `Supplier loan (${transaction.transactionId})`;

      deductions.push({
        transactionId: transaction.transactionId,
        type: transaction.type,
        description,
        amount: amountDue,
      });

      totalDeductions = Number(
        (totalDeductions + amountDue).toFixed(2)
      );

      remainingGross = Number(
        (remainingGross - amountDue).toFixed(2)
      );
    }

    const netAmount = Number(
      Math.max(0, grossAmount - totalDeductions).toFixed(2)
    );

    const settlementData = {
      supplierId,
      supplierName: supplier.name,
      monthKey,
      totalKg: Number(totalKg.toFixed(3)),
      ratePerKg,
      grossAmount,
      deductions,
      totalDeductions,
      netAmount,
      status: "DRAFT" as const,
      finalizedAt: undefined,
      paidAt: undefined,
    };

    let settlement;

    if (existing) {
      // Update DRAFT only. This does not change transaction balances.
      existing.set(settlementData);
      settlement = await existing.save();
    } else {
      settlement = await SupplierMonthlySettlement.create({
        settlementId: `SET-${randomUUID()}`,
        ...settlementData,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Monthly settlement draft calculated successfully.",
        settlement,
        breakdown: {
          totalKg: settlement.totalKg,
          ratePerKg: settlement.ratePerKg,
          grossAmount: settlement.grossAmount,
          totalDeductions: settlement.totalDeductions,
          netAmount: settlement.netAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
