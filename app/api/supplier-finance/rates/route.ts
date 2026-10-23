
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, requireAuth } from "@/lib/auth";
import MonthlyTeaRate from "@/models/MonthlyTeaRate";
import Supplier from "@/models/Supplier";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DEFAULT_SUPPLIER_ID = "__DEFAULT__";

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

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get("monthKey");

    if (monthKey && !MONTH_PATTERN.test(monthKey)) {
      return NextResponse.json(
        { success: false, message: "monthKey must use YYYY-MM format." },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = {};
    if (monthKey) filter.monthKey = monthKey;

    const rates = await MonthlyTeaRate.find(filter)
      .sort({ monthKey: -1, supplierId: 1 })
      .lean();

    return NextResponse.json({ success: true, rates });
  } catch (error) {
    const response = authError(error);
    if (response) return response;

    console.error("TEA RATE GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load tea rates." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();

    const monthKey =
      typeof body.monthKey === "string" ? body.monthKey.trim() : "";

    const supplierId =
      typeof body.supplierId === "string" && body.supplierId.trim()
        ? body.supplierId.trim()
        : DEFAULT_SUPPLIER_ID;

    const ratePerKg = Number(body.ratePerKg);

    if (!MONTH_PATTERN.test(monthKey)) {
      return NextResponse.json(
        { success: false, message: "A valid monthKey (YYYY-MM) is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(ratePerKg) || ratePerKg <= 0) {
      return NextResponse.json(
        { success: false, message: "ratePerKg must be greater than zero." },
        { status: 400 }
      );
    }

    let supplierName = "Factory default rate";

    if (supplierId !== DEFAULT_SUPPLIER_ID) {
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

      supplierName = supplier.name;
    }

    const notes =
      typeof body.notes === "string" ? body.notes.trim() : "";

    const rate = await MonthlyTeaRate.findOneAndUpdate(
      { monthKey, supplierId },
      {
        $set: {
          monthKey,
          supplierId,
          supplierName,
          ratePerKg,
          notes,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Monthly tea rate saved successfully.",
      rate,
    });
  } catch (error) {
    const response = authError(error);
    if (response) return response;

    console.error("TEA RATE POST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save tea rate." },
      { status: 500 }
    );
  }
}
