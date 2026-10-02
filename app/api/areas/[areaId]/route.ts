import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import Supplier from "@/models/Supplier";

interface RouteContext {
  params: Promise<{
    areaId: string;
  }>;
}

/* =========================================================
   GET SINGLE AREA
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { areaId } =
      await context.params;

    const area =
      await Area.findOne({
        areaId,
      }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Area not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      area: {
        ...area,
        _id: String(
          area._id
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET AREA ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch area",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH - EDIT AREA
========================================================= */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { areaId } =
      await context.params;

    const body =
      await request.json();

    const name = String(
      body.name || ""
    ).trim();

    const description =
      String(
        body.description || ""
      ).trim();

    const status =
      body.status ===
      "Inactive"
        ? "Inactive"
        : "Active";

    /* -------------------------
       Validation
    ------------------------- */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Area name is required",
        },
        { status: 400 }
      );
    }

    /* -------------------------
       Find area
    ------------------------- */

    const area =
      await Area.findOne({
        areaId,
      });

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Area not found",
        },
        { status: 404 }
      );
    }

    /* -------------------------
       Check duplicate name
    ------------------------- */

    const duplicate =
      await Area.findOne({
        name,
        _id: {
          $ne: area._id,
        },
      }).lean();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An area with this name already exists",
        },
        { status: 409 }
      );
    }

    /* -------------------------
       Update area
    ------------------------- */

    area.name = name;

    area.description =
      description;

    area.status = status;

    await area.save();

    /* -------------------------
       Update supplier area name
    ------------------------- */

    await Supplier.updateMany(
      {
        areaId,
      },
      {
        $set: {
          areaName: name,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Area updated successfully",

      area: {
        ...area.toObject(),
        _id: String(
          area._id
        ),
      },
    });
  } catch (error) {
    console.error(
      "PATCH AREA ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update area",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE AREA
========================================================= */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { areaId } =
      await context.params;

    console.log(
      "DELETE AREA:",
      areaId
    );

    /* -------------------------
       Find area
    ------------------------- */

    const area =
      await Area.findOne({
        areaId,
      });

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Area not found",
        },
        { status: 404 }
      );
    }

    /* -------------------------
       Find suppliers
    ------------------------- */

    const supplierCount =
      await Supplier.countDocuments({
        areaId,
      });

    console.log(
      "SUPPLIERS IN AREA:",
      supplierCount
    );

    /*
     * IMPORTANT:
     *
     * We DO NOT delete suppliers.
     *
     * If suppliers exist in this area,
     * they will simply be marked Inactive.
     *
     * Their previous records remain safe.
     */
    if (supplierCount > 0) {
      await Supplier.updateMany(
        {
          areaId,
        },
        {
          $set: {
            status: "Inactive",
          },
        }
      );

      console.log(
        `${supplierCount} supplier(s) marked as inactive`
      );
    }

    /* -------------------------
       Delete area
    ------------------------- */

    await Area.deleteOne({
      areaId,
    });

    console.log(
      "AREA DELETED:",
      areaId
    );

    return NextResponse.json(
      {
        success: true,

        message:
          supplierCount > 0
            ? `Area deleted successfully. ${supplierCount} supplier(s) were marked as inactive.`
            : "Area deleted successfully.",

        deletedAreaId:
          areaId,

        inactiveSupplierCount:
          supplierCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "DELETE AREA ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete area",
      },
      { status: 500 }
    );
  }
}