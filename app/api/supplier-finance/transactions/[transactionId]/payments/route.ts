
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import SupplierAccountTransaction from "@/models/SupplierAccountTransaction";

type RouteContext = {
  params: Promise<{ transactionId: string }>;
};

function authError(error: unknown) {
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

    const { transactionId } = await context.params;

    if (!transactionId?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction ID is required.",
        },
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
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const paymentAmount = Number(amount.toFixed(2));

    if (
      typeof body.paymentDate !== "string" ||
      !body.paymentDate.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment date is required.",
        },
        { status: 400 }
      );
    }

    const paymentDate = new Date(body.paymentDate);

    if (Number.isNaN(paymentDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment date.",
        },
        { status: 400 }
      );
    }

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : "";

    if (notes.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment notes cannot exceed 500 characters.",
        },
        { status: 400 }
      );
    }

    const transaction =
      await SupplierAccountTransaction.findOne({
        transactionId: transactionId.trim(),
      });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier transaction not found.",
        },
        { status: 404 }
      );
    }

    if (transaction.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payments cannot be added to a cancelled transaction.",
        },
        { status: 400 }
      );
    }

    const outstanding = Number(transaction.outstandingAmount);

    if (!Number.isFinite(outstanding) || outstanding <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This transaction has no outstanding balance.",
        },
        { status: 400 }
      );
    }

    if (paymentAmount > outstanding + 0.001) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // Ensure arrays exist for older MongoDB documents.
    if (!Array.isArray(transaction.payments)) {
      transaction.payments = [];
    }

    if (!Array.isArray(transaction.installments)) {
      transaction.installments = [];
    }

    const newOutstanding = Number(
      Math.max(0, outstanding - paymentAmount).toFixed(2)
    );

    transaction.payments.push({
      paymentId: `SP-${randomUUID()}`,
      amount: paymentAmount,
      paymentDate,
      notes,
      createdAt: new Date(),
    });

    transaction.outstandingAmount = newOutstanding;
    transaction.status =
      newOutstanding <= 0 ? "SETTLED" : "ACTIVE";

    // Allocate manual payments to the oldest unpaid installments.
    if (transaction.deductionMode === "INSTALLMENT") {
      let remainingPayment = paymentAmount;

      const orderedInstallments = [...transaction.installments].sort(
        (a, b) => a.monthKey.localeCompare(b.monthKey)
      );

      for (const installment of orderedInstallments) {
        if (remainingPayment <= 0.001) {
          break;
        }

        const installmentAmount = Number(installment.amount);
        const alreadyDeducted = Number(
          installment.deductedAmount ?? 0
        );

        if (
          !Number.isFinite(installmentAmount) ||
          installmentAmount < 0 ||
          !Number.isFinite(alreadyDeducted) ||
          alreadyDeducted < 0
        ) {
          throw new Error(
            "Invalid installment data. Please check this transaction's installments."
          );
        }

        const installmentOutstanding = Number(
          Math.max(
            0,
            installmentAmount - alreadyDeducted
          ).toFixed(2)
        );

        if (installmentOutstanding <= 0) {
          installment.deductedAmount = installmentAmount;
          installment.status = "DEDUCTED";
          continue;
        }

        const allocated = Number(
          Math.min(
            remainingPayment,
            installmentOutstanding
          ).toFixed(2)
        );

        installment.deductedAmount = Number(
          (alreadyDeducted + allocated).toFixed(2)
        );

        remainingPayment = Number(
          Math.max(0, remainingPayment - allocated).toFixed(2)
        );

        if (
          installment.deductedAmount >=
          installmentAmount - 0.001
        ) {
          installment.deductedAmount = installmentAmount;
          installment.status = "DEDUCTED";
          installment.deductedAt = paymentDate;
        }
      }
    }

    await transaction.save();

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully.",
      transaction,
    });
  } catch (error) {
    const response = authError(error);

    if (response) {
      return response;
    }

    console.error("SUPPLIER PAYMENT POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to record supplier payment.",
      },
      { status: 500 }
    );
  }
}
