import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import TeaCollection from "@/models/TeaCollection";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get("areaId");

    const filter: Record<string, unknown> = {};

    if (areaId) {
      filter.areaId = areaId;
    }

    const suppliers = await Supplier.find(filter)
      .sort({ name: 1 })
      .lean();

    const supplierIds = suppliers.map(
      (supplier) => supplier.supplierId
    );

    const collectionTotals =
      supplierIds.length > 0
        ? await TeaCollection.aggregate([
            {
              $match: {
                supplierId: {
                  $in: supplierIds,
                },
              },
            },
            {
              $group: {
                _id: "$supplierId",

                totalKg: {
                  $sum: "$weightKg",
                },

                totalValue: {
                  $sum: "$totalAmount",
                },
              },
            },
          ])
        : [];

    const totalsMap = new Map<
      string,
      {
        totalKg: number;
        totalValue: number;
      }
    >();

    for (const total of collectionTotals) {
      totalsMap.set(total._id, {
        totalKg: total.totalKg || 0,
        totalValue: total.totalValue || 0,
      });
    }

    const formattedSuppliers = suppliers.map(
      (supplier) => {
        const totals = totalsMap.get(
          supplier.supplierId
        );

        return {
          ...supplier,

          totalKg: totals?.totalKg || 0,

          totalValue: totals?.totalValue || 0,
        };
      }
    );

    return NextResponse.json({
      success: true,
      suppliers: formattedSuppliers,
    });
  } catch (error) {
    console.error(
      "GET suppliers error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch suppliers",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const areaId = body.areaId?.trim();
    const areaName = body.areaName?.trim();
    const village = body.village?.trim();
    const address =
      body.address?.trim() || "";

    if (
      !name ||
      !phone ||
      !areaId ||
      !areaName ||
      !village
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, phone, area and village are required",
        },
        { status: 400 }
      );
    }

    /*
     * Verify that the selected area actually exists.
     */
    const Area = (
      await import("@/models/Area")
    ).default;

    const area = await Area.findOne({
      areaId,
      status: "Active",
    }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected area was not found",
        },
        { status: 404 }
      );
    }

    /*
     * Always use the actual area name
     * from MongoDB instead of trusting
     * the frontend value.
     */
    const actualAreaName = area.name;

    /*
     * Check duplicate phone number.
     */
    const existingSupplier =
      await Supplier.findOne({
        phone,
      }).lean();

    if (existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A supplier with this phone number already exists",
        },
        { status: 409 }
      );
    }

    /*
     * Generate next supplier ID.
     */
    const lastSupplier =
      await Supplier.findOne()
        .sort({ createdAt: -1 })
        .lean();

    let nextNumber = 1;

    if (lastSupplier?.supplierId) {
      const number = parseInt(
        lastSupplier.supplierId.replace(
          "SUP-",
          ""
        ),
        10
      );

      if (!Number.isNaN(number)) {
        nextNumber = number + 1;
      }
    }

    const supplierId = `SUP-${String(
      nextNumber
    ).padStart(3, "0")}`;

    const supplier =
      await Supplier.create({
        supplierId,
        name,
        phone,
        areaId,
        areaName: actualAreaName,
        village,
        address,
        status: "Active",
      });

    return NextResponse.json(
      {
        success: true,
        supplier: {
          ...supplier.toObject(),
          totalKg: 0,
          totalValue: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST supplier error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create supplier",
      },
      { status: 500 }
    );
  }
}