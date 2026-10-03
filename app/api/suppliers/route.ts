import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

import Supplier from "@/models/Supplier";
import SupplierTeaCollection from "@/models/SupplierTeaCollection";
import Area from "@/models/Area";

/* =====================================================
   GET SUPPLIERS
===================================================== */

export async function GET(request: Request) {
  try {
    // 🔒 Login required
    await requireAuth();

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const areaId =
      searchParams.get("areaId");

    const filter: Record<
      string,
      unknown
    > = {};

    if (areaId) {
      filter.areaId = areaId;
    }

    const suppliers =
      await Supplier.find(filter)
        .sort({
          name: 1,
        })
        .lean();

    /* =================================================
       GET SUPPLIER TEA TOTALS
    ================================================= */

    const supplierIds =
      suppliers.map(
        (supplier) =>
          supplier.supplierId
      );

    const collectionTotals =
      supplierIds.length > 0
        ? await SupplierTeaCollection.aggregate(
            [
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
                },
              },
            ]
          )
        : [];

    /* =================================================
       CREATE TOTALS MAP
    ================================================= */

    const totalsMap =
      new Map<
        string,
        number
      >();

    for (const total of collectionTotals) {
      totalsMap.set(
        total._id,
        Number(
          total.totalKg || 0
        )
      );
    }

    /* =================================================
       FORMAT SUPPLIERS
    ================================================= */

    const formattedSuppliers =
      suppliers.map(
        (supplier) => {
          const totalKg =
            totalsMap.get(
              supplier.supplierId
            ) || 0;

          return {
            ...supplier,

            _id: String(
              supplier._id
            ),

            totalKg,

            /*
             * Payment/value calculation
             * will be implemented later.
             */
            totalValue: 0,
          };
        }
      );

    return NextResponse.json({
      success: true,

      suppliers:
        formattedSuppliers,
    });
  } catch (error) {
    /* =================================================
       UNAUTHORIZED
    ================================================= */

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /* =================================================
       SERVER ERROR
    ================================================= */

    console.error(
      "GET SUPPLIERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch suppliers",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   CREATE SUPPLIER
===================================================== */

export async function POST(
  request: Request
) {
  try {
    // 🔒 Login required
    await requireAuth();

    await connectDB();

    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    const phone =
      String(
        body.phone || ""
      ).trim();

    const areaId =
      String(
        body.areaId || ""
      ).trim();

    const village =
      String(
        body.village || ""
      ).trim();

    const address =
      String(
        body.address || ""
      ).trim();

    /* =================================================
       VALIDATION
    ================================================= */

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

    /* =================================================
       FIND AREA
    ================================================= */

    const area =
      await Area.findOne({
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
        {
          status: 404,
        }
      );
    }

    /* =================================================
       CHECK DUPLICATE PHONE
    ================================================= */

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
        {
          status: 409,
        }
      );
    }

    /* =================================================
       GENERATE SUPPLIER ID
    ================================================= */

    const lastSupplier =
      await Supplier.findOne()
        .sort({
          createdAt: -1,
        })
        .lean();

    let nextNumber = 1;

    if (
      lastSupplier?.supplierId
    ) {
      const match =
        lastSupplier.supplierId.match(
          /SUP-(\d+)/
        );

      if (match) {
        nextNumber =
          Number(match[1]) + 1;
      }
    }

    const supplierId =
      `SUP-${String(
        nextNumber
      ).padStart(3, "0")}`;

    /* =================================================
       CREATE SUPPLIER
    ================================================= */

    const supplier =
      await Supplier.create({
        supplierId,

        name,

        phone,

        areaId,

        areaName:
          area.name,

        village,

        address,

        status: "Active",
      });

    return NextResponse.json(
      {
        success: true,

        supplier: {
          ...supplier.toObject(),

          _id: String(
            supplier._id
          ),

          totalKg: 0,

          totalValue: 0,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /* =================================================
       UNAUTHORIZED
    ================================================= */

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /* =================================================
       SERVER ERROR
    ================================================= */

    console.error(
      "POST SUPPLIER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to create supplier",
      },
      {
        status: 500,
      }
    );
  }
}