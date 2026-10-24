
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import SupplierAccountTransaction from "@/models/SupplierAccountTransaction";

type RouteContext = {
  params: Promise<{ settlementId: string }>;
};

function getAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { success: false, message: "Administrator access required." },
      { status: 403 }
    );
  }

  return null;
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAdmin();
    await connectDB();

    // The dynamic folder is [settlementId], so use settlementId here.
    const { settlementId } = await context.params;

    if (!settlementId?.trim()) {
      return NextResponse.json(
        { success: false, message: "Settlement ID is required." },
        { status: 400 }
      );
    }

    let body: {
      amount?: unknown;
      paymentDate?: unknown;
      notes?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Enter a valid payment amount." },
        { status: 400 }
      );
    }

    const roundedAmount = Number(amount.toFixed(2));

    let paymentDate: Date;

    if (
      typeof body.paymentDate === "string" &&
      body.paymentDate.trim()
    ) {
      const dateValue = body.paymentDate.trim();

      // Preserve date-only values without timezone shifting.
      paymentDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
        ? new Date(`${dateValue}T12:00:00`)
        : new Date(dateValue);
    } else {
      paymentDate = new Date();
    }

    if (Number.isNaN(paymentDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Enter a valid payment date." },
        { status: 400 }
      );
    }

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim().slice(0, 500)
        : "";

    // The URL parameter is settlementId, but the existing database
    // identifies supplier account transactions by transactionId.
    const transaction =
      await SupplierAccountTransaction.findOne({
        transactionId: settlementId.trim(),
      });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found." },
        { status: 404 }
      );
    }

    if (
      transaction.status === "SETTLED" ||
      transaction.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This transaction cannot accept further payments.",
        },
        { status: 400 }
      );
    }

    const rawOutstanding =
      transaction.outstandingAmount ?? transaction.amount;

    const outstanding = Number(rawOutstanding);

    if (!Number.isFinite(outstanding) || outstanding <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This transaction has no outstanding balance.",
        },
        { status: 400 }
      );
    }

    if (roundedAmount > outstanding + 0.001) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // Older MongoDB records may not contain these arrays.
    if (!Array.isArray(transaction.payments)) {
      transaction.payments = [];
    }

    if (!Array.isArray(transaction.installments)) {
      transaction.installments = [];
    }

    // Allocate payments to the oldest unpaid installments first.
    if (transaction.deductionMode === "INSTALLMENT") {
      let remainingPayment = roundedAmount;

      const orderedInstallments = [...transaction.installments].sort(
        (a, b) => a.monthKey.localeCompare(b.monthKey)
      );

      for (const installment of orderedInstallments) {
        if (remainingPayment <= 0.001) {
          break;
        }

        const installmentAmount = Number(installment.amount);
        const alreadyPaid = Number(installment.deductedAmount ?? 0);

        if (
          !Number.isFinite(installmentAmount) ||
          installmentAmount < 0 ||
          !Number.isFinite(alreadyPaid) ||
          alreadyPaid < 0
        ) {
          throw new Error("Invalid installment data.");
        }

        const installmentBalance = Number(
          Math.max(0, installmentAmount - alreadyPaid).toFixed(2)
        );

        if (installmentBalance <= 0.001) {
          installment.deductedAmount = installmentAmount;
          installment.status = "DEDUCTED";
          continue;
        }

        const allocated = Number(
          Math.min(remainingPayment, installmentBalance).toFixed(2)
        );

        installment.deductedAmount = Number(
          (alreadyPaid + allocated).toFixed(2)
        );

        remainingPayment = Number(
          Math.max(0, remainingPayment - allocated).toFixed(2)
        );

        if (
          installment.deductedAmount >= installmentAmount - 0.001
        ) {
          installment.deductedAmount = installmentAmount;
          installment.status = "DEDUCTED";
          installment.deductedAt = paymentDate;
        } else {
          installment.status = "PENDING";
        }
      }
    }

    const payment = {
      paymentId: `PAY-${randomUUID()}`,
      amount: roundedAmount,
      paymentDate,
      notes,
      createdAt: new Date(),
    };

    transaction.payments.push(payment);

    const newOutstanding = Number(
      Math.max(0, outstanding - roundedAmount).toFixed(2)
    );

    transaction.outstandingAmount = newOutstanding;

    if (newOutstanding <= 0.001) {
      transaction.outstandingAmount = 0;
      transaction.status = "SETTLED";

      // Close any remaining installments once the entire debt is paid.
      for (const installment of transaction.installments) {
        installment.deductedAmount = Number(installment.amount ?? 0);
        installment.status = "DEDUCTED";
        installment.deductedAt =
          installment.deductedAt || paymentDate;
      }
    } else {
      transaction.status = "ACTIVE";
    }

    await transaction.save();

    return NextResponse.json({
      success: true,
      message:
        transaction.status === "SETTLED"
          ? "Payment recorded. Transaction fully settled."
          : "Payment recorded successfully.",
      transaction,
      payment,
    });
  } catch (error) {
    const authResponse = getAuthError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("Record supplier payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record payment.",
      },
      { status: 500 }
    );
  }
}
