
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

import Supplier from "@/models/Supplier";
import SupplierAccountTransaction from "@/models/SupplierAccountTransaction";
import FertilizerProduct from "@/models/FertilizerProduct";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

type TransactionType = "ADVANCE" | "LOAN" | "FERTILIZER";
type DeductionMode = "FULL" | "INSTALLMENT";

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

function addMonths(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    if (supplierId) filter.supplierId = supplierId;

    if (
      type &&
      ["ADVANCE", "LOAN", "FERTILIZER"].includes(type)
    ) {
      filter.type = type;
    }

    if (
      status &&
      ["ACTIVE", "SETTLED", "CANCELLED"].includes(status)
    ) {
      filter.status = status;
    }

    const transactions = await SupplierAccountTransaction.find(filter)
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    const response = authError(error);
    if (response) return response;

    console.error("SUPPLIER TRANSACTION GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load transactions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();

    const supplierId =
      typeof body.supplierId === "string" ? body.supplierId.trim() : "";

    const type = body.type as TransactionType;
    const deductionMode =
      (body.deductionMode || "FULL") as DeductionMode;

    const firstDeductionMonth =
      typeof body.firstDeductionMonth === "string"
        ? body.firstDeductionMonth.trim()
        : "";

    if (!supplierId) {
      return NextResponse.json(
        { success: false, message: "supplierId is required." },
        { status: 400 }
      );
    }

    if (!["ADVANCE", "LOAN", "FERTILIZER"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid transaction type." },
        { status: 400 }
      );
    }

    if (!["FULL", "INSTALLMENT"].includes(deductionMode)) {
      return NextResponse.json(
        { success: false, message: "Invalid deduction mode." },
        { status: 400 }
      );
    }

    if (!MONTH_PATTERN.test(firstDeductionMonth)) {
      return NextResponse.json(
        {
          success: false,
          message: "firstDeductionMonth must use YYYY-MM format.",
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
        { success: false, message: "Active supplier not found." },
        { status: 404 }
      );
    }

    let amount = Number(body.amount);
    let fertilizerProductId: string | undefined;
    let fertilizerName: string | undefined;
    let fertilizerQuantity: number | undefined;
    let fertilizerUnit: string | undefined;
    let fertilizerUnitPrice: number | undefined;

    if (type === "FERTILIZER") {
      fertilizerProductId =
        typeof body.fertilizerProductId === "string"
          ? body.fertilizerProductId.trim()
          : "";

      fertilizerQuantity = Number(body.fertilizerQuantity);

      if (
        !fertilizerProductId ||
        !Number.isFinite(fertilizerQuantity) ||
        fertilizerQuantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "A fertilizer product and valid quantity are required.",
          },
          { status: 400 }
        );
      }

      const product = await FertilizerProduct.findOne({
        productId: fertilizerProductId,
        status: "ACTIVE",
      }).lean();

      if (!product) {
        return NextResponse.json(
          { success: false, message: "Active fertilizer product not found." },
          { status: 404 }
        );
      }

      fertilizerName = product.name;
      fertilizerUnit = product.unit;
      fertilizerUnitPrice = Number(product.currentPrice);
      amount = Number(
        (fertilizerQuantity * fertilizerUnitPrice).toFixed(2)
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    const installmentMonths =
      deductionMode === "INSTALLMENT"
        ? Number(body.installmentMonths)
        : 1;

    if (
      !Number.isInteger(installmentMonths) ||
      installmentMonths < 1 ||
      installmentMonths > 120
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "installmentMonths must be between 1 and 120.",
        },
        { status: 400 }
      );
    }

    if (deductionMode === "INSTALLMENT" && type === "FERTILIZER") {
      // Fertilizer is recorded as a debt. Installments are supported.
    }

    const monthlyInstallmentAmount = Number(
      (amount / installmentMonths).toFixed(2)
    );

    const installments =
      deductionMode === "INSTALLMENT"
        ? Array.from({ length: installmentMonths }, (_, index) => {
            const monthKey = addMonths(firstDeductionMonth, index);

            // Make the final installment absorb rounding differences.
            const scheduledAmount =
              index === installmentMonths - 1
                ? Number(
                    (
                      amount -
                      monthlyInstallmentAmount * (installmentMonths - 1)
                    ).toFixed(2)
                  )
                : monthlyInstallmentAmount;

            return {
              monthKey,
              amount: scheduledAmount,
              deductedAmount: 0,
              status: "PENDING" as const,
            };
          })
        : [];

    const transactionDate = body.transactionDate
      ? new Date(body.transactionDate)
      : new Date();

    if (Number.isNaN(transactionDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid transactionDate." },
        { status: 400 }
      );
    }

    const transaction = await SupplierAccountTransaction.create({
      transactionId: `SAT-${randomUUID()}`,
      supplierId: supplier.supplierId,
      supplierName: supplier.name,
      type,
      amount,
      outstandingAmount: amount,
      transactionDate,
      deductionMode,
      firstDeductionMonth,
      installmentMonths,
      monthlyInstallmentAmount,
      installments,
      fertilizerProductId,
      fertilizerName,
      fertilizerQuantity,
      fertilizerUnit,
      fertilizerUnitPrice,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
      status: "ACTIVE",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Supplier transaction recorded successfully.",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    const response = authError(error);
    if (response) return response;

    console.error("SUPPLIER TRANSACTION POST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record supplier transaction." },
      { status: 500 }
    );
  }
}
