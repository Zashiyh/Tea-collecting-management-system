import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import Area from "@/models/Area";
import TeaCollection from "@/models/TeaCollection";

interface RouteContext {
  params: Promise<{
    supplierId: string;
  }>;
}

/*
 * GET SINGLE SUPPLIER
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { supplierId } = await context.params;

    const supplier = await Supplier.findOne({
      supplierId,
    }).lean();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      supplier,
    });
  } catch (error) {
    console.error(
      "GET single supplier error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch supplier",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * UPDATE SUPPLIER
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { supplierId } = await context.params;

    const body = await request.json();

    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const areaId = body.areaId?.trim();
    const village = body.village?.trim();
    const address = body.address?.trim() || "";

    if (
      !name ||
      !phone ||
      !areaId ||
      !village
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, phone, area and village are required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find existing supplier
     */
    const existingSupplier =
      await Supplier.findOne({
        supplierId,
      });

    if (!existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Validate area
     */
    const area = await Area.findOne({
      areaId,
      status: "Active",
    }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected area was not found or is inactive",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Check duplicate phone
     */
    const duplicatePhone =
      await Supplier.findOne({
        phone,
        supplierId: {
          $ne: supplierId,
        },
      }).lean();

    if (duplicatePhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another supplier already uses this phone number",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Update supplier
     */
    existingSupplier.name = name;
    existingSupplier.phone = phone;
    existingSupplier.areaId = area.areaId;
    existingSupplier.areaName = area.name;
    existingSupplier.village = village;
    existingSupplier.address = address;

    await existingSupplier.save();

    /*
     * Keep historical collection records
     * synchronized with supplier name/area.
     *
     * This does NOT change collection weight,
     * rate or amount.
     */
    await TeaCollection.updateMany(
      {
        supplierId,
      },
      {
        $set: {
          supplierName: name,
          areaId: area.areaId,
          areaName: area.name,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Supplier updated successfully",
      supplier: existingSupplier,
    });
  } catch (error) {
    console.error(
      "PATCH supplier error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update supplier",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * DELETE SUPPLIER
 */
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { supplierId } = await context.params;

    const supplier =
      await Supplier.findOne({
        supplierId,
      });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Check collection history
     */
    const collectionCount =
      await TeaCollection.countDocuments({
        supplierId,
      });

    /*
     * Do not physically delete a supplier
     * if historical collection records exist.
     *
     * Instead mark inactive.
     */
    if (collectionCount > 0) {
      supplier.status = "Inactive";

      await supplier.save();

      return NextResponse.json({
        success: true,
        deleted: false,
        deactivated: true,
        message:
          "Supplier has collection history, so it was marked as inactive instead of being permanently deleted.",
      });
    }

    /*
     * No collection history
     * => permanent delete is safe
     */
    await Supplier.deleteOne({
      supplierId,
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      deactivated: false,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE supplier error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete supplier",
      },
      {
        status: 500,
      }
    );
  }
}