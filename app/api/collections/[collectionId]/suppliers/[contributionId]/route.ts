import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DailyAreaCollection from "@/models/DailyAreaCollection";
import SupplierTeaCollection from "@/models/SupplierTeaCollection";
import Supplier from "@/models/Supplier";

interface RouteContext {
  params: Promise<{
    collectionId: string;
    contributionId: string;
  }>;
}

/* =========================================================
   PATCH - EDIT SUPPLIER CONTRIBUTION
   ========================================================= */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const {
      collectionId,
      contributionId,
    } = await context.params;

    console.log(
      "PATCH CONTRIBUTION:",
      collectionId,
      contributionId
    );

    const body = await request.json();

    const supplierId = String(
      body.supplierId || ""
    ).trim();

    const weightKg = Number(
      body.weightKg
    );

    const notes = String(
      body.notes || ""
    ).trim();

    /* -------------------------
       Validation
    ------------------------- */

    if (!supplierId) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier is required",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(weightKg) ||
      weightKg <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid tea weight is required",
        },
        { status: 400 }
      );
    }

    /* -------------------------
       Find main collection
    ------------------------- */

    const mainCollection =
      await DailyAreaCollection.findOne({
        collectionId,
      }).lean();

    if (!mainCollection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tea collection not found",
        },
        { status: 404 }
      );
    }

    /* -------------------------
       Find supplier
    ------------------------- */

    const supplier =
      await Supplier.findOne({
        supplierId,
        areaId:
          mainCollection.areaId,
        status: "Active",
      }).lean();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected supplier was not found in this area",
        },
        { status: 404 }
      );
    }

    /* -------------------------
       Find contribution
    ------------------------- */

    const existing =
      await SupplierTeaCollection.findOne({
        contributionId,
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supplier contribution not found",
        },
        { status: 404 }
      );
    }

    /* -------------------------
       Prevent duplicate supplier
       for same area + date
    ------------------------- */

    const duplicate =
      await SupplierTeaCollection.findOne(
        {
          _id: {
            $ne: existing._id,
          },

          areaId:
            mainCollection.areaId,

          date:
            mainCollection.date,

          supplierId,
        }
      ).lean();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This supplier already has a contribution for this area and date",
        },
        { status: 409 }
      );
    }

    /* -------------------------
       Update contribution
    ------------------------- */

    existing.supplierId =
      supplier.supplierId;

    existing.supplierName =
      supplier.name;

    existing.weightKg =
      weightKg;

    existing.notes =
      notes;

    existing.areaId =
      mainCollection.areaId;

    existing.areaName =
      mainCollection.areaName;

    existing.date =
      mainCollection.date;

    await existing.save();

    console.log(
      "CONTRIBUTION UPDATED:",
      existing.contributionId
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Supplier contribution updated successfully",

        contribution: {
          _id: String(
            existing._id
          ),

          contributionId:
            existing.contributionId,

          date:
            existing.date,

          areaId:
            existing.areaId,

          areaName:
            existing.areaName,

          supplierId:
            existing.supplierId,

          supplierName:
            existing.supplierName,

          weightKg:
            existing.weightKg,

          notes:
            existing.notes,

          createdAt:
            existing.createdAt,

          updatedAt:
            existing.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH SUPPLIER CONTRIBUTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update supplier contribution",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE - DELETE SUPPLIER CONTRIBUTION
   ========================================================= */
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const {
      contributionId,
    } = await context.params;

    console.log(
      "DELETE CONTRIBUTION:",
      contributionId
    );

    const deleted =
      await SupplierTeaCollection.findOneAndDelete(
        {
          contributionId,
        }
      );

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supplier contribution not found",
        },
        { status: 404 }
      );
    }

    console.log(
      "CONTRIBUTION DELETED:",
      contributionId
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Supplier contribution deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE SUPPLIER CONTRIBUTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete supplier contribution",
      },
      { status: 500 }
    );
  }
}