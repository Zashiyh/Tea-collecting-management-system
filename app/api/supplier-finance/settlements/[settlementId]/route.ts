
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import SupplierAccountTransaction from "@/models/SupplierAccountTransaction";

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
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { transactionId } = await context.params;
    const body = await request.json();

    const amount = Number(body.amount);
    const paymentDate = body.paymentDate
      ? new Date(`${body.paymentDate}T12:00:00`)
      : new Date();

    const notes =
      typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Enter a valid payment amount." },
        { status: 400 }
      );
    }

    if (Number.isNaN(paymentDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Enter a valid payment date." },
        { status: 400 }
      );
    }

    const transaction =
      await SupplierAccountTransaction.findOne({ transactionId });

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

    const outstanding = Math.max(
      0,
      Number(
        transaction.outstandingAmount ?? transaction.amount
      )
    );

    const roundedAmount = Number(amount.toFixed(2));

    if (roundedAmount > outstanding + 0.001) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    if (!transaction.payments) {
      transaction.payments = [];
    }

    if (!transaction.installments) {
      transaction.installments = [];
    }

    let remainingPayment = roundedAmount;

    // Allocate the payment to the oldest unpaid installments first.
    if (transaction.deductionMode === "INSTALLMENT") {
      for (const installment of transaction.installments) {
        if (remainingPayment <= 0.001) break;

        const installmentAmount = Number(installment.amount || 0);
        const alreadyPaid = Number(installment.deductedAmount || 0);
        const installmentBalance = Math.max(
          0,
          installmentAmount - alreadyPaid
        );

        if (installmentBalance <= 0.001) {
          installment.deductedAmount = installmentAmount;
          installment.status = "DEDUCTED";
          continue;
        }

        const allocated = Math.min(
          remainingPayment,
          installmentBalance
        );

        installment.deductedAmount = Number(
          (alreadyPaid + allocated).toFixed(2)
        );

        remainingPayment = Number(
          (remainingPayment - allocated).toFixed(2)
        );

        if (
          installment.deductedAmount >=
          installmentAmount - 0.001
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

    const newOutstanding = Math.max(
      0,
      Number((outstanding - roundedAmount).toFixed(2))
    );

    transaction.outstandingAmount = newOutstanding;

    if (newOutstanding <= 0.001) {
      transaction.outstandingAmount = 0;
      transaction.status = "SETTLED";

      // Close any remaining installments when the whole debt is paid.
      for (const installment of transaction.installments) {
        installment.deductedAmount = Number(installment.amount || 0);
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
    if (authResponse) return authResponse;

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
