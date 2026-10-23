
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import SupplierMonthlySettlement from "@/models/SupplierMonthlySettlement";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ settlementId: string }> }
) {
  try {
    const authResult = await requireAdmin();

    // If requireAdmin returns a NextResponse for unauthorized users,
    // return it without continuing.
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectDB();

    const { settlementId } = await params;
    const body = await request.json().catch(() => ({}));

    const action = String(body.action || "").toUpperCase();
    const paymentReference = String(body.paymentReference || "").trim();

    if (!settlementId) {
      return NextResponse.json(
        { success: false, message: "Settlement ID is required." },
        { status: 400 }
      );
    }

    const settlement = await SupplierMonthlySettlement.findOne({
      settlementId,
    });

    if (!settlement) {
      return NextResponse.json(
        { success: false, message: "Settlement not found." },
        { status: 404 }
      );
    }

    if (action === "FINALIZE") {
      if (settlement.status !== "DRAFT") {
        return NextResponse.json(
          {
            success: false,
            message: `Only DRAFT settlements can be finalized. Current status: ${settlement.status}.`,
          },
          { status: 409 }
        );
      }

      settlement.status = "FINALIZED";
      settlement.finalizedAt = new Date();
      await settlement.save();

      return NextResponse.json({
        success: true,
        message: "Settlement finalized successfully.",
        settlement,
      });
    }

    if (action === "PAY") {
      if (settlement.status !== "FINALIZED") {
        return NextResponse.json(
          {
            success: false,
            message: "Only FINALIZED settlements can be marked as PAID.",
          },
          { status: 409 }
        );
      }

      if (!paymentReference) {
        return NextResponse.json(
          {
            success: false,
            message: "Payment reference is required.",
          },
          { status: 400 }
        );
      }

      settlement.status = "PAID";
      settlement.paidAt = new Date();
      settlement.paymentReference = paymentReference;
      await settlement.save();

      return NextResponse.json({
        success: true,
        message: "Payment recorded successfully.",
        settlement,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action. Use "FINALIZE" or "PAY".',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Settlement payment update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update the settlement.",
      },
      { status: 500 }
    );
  }
}
