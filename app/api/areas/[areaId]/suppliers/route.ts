import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

import Area from "@/models/Area";
import Supplier from "@/models/Supplier";

interface RouteContext {
  params: Promise<{
    areaId: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // 🔒 Login required
    await requireAuth();

    await connectDB();

    const { areaId } =
      await context.params;

    const decodedAreaId =
      decodeURIComponent(areaId);

    const area =
      await Area.findOne({
        areaId: decodedAreaId,
      }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message: "Area not found",
        },
        { status: 404 }
      );
    }

    const suppliers =
      await Supplier.find({
        areaId: area.areaId,
      })
        .sort({ name: 1 })
        .lean();

    const formattedSuppliers =
      suppliers.map((supplier) => ({
        _id: supplier._id.toString(),
        supplierId: supplier.supplierId,
        name: supplier.name,
        phone: supplier.phone,
        areaId: supplier.areaId,
        areaName: supplier.areaName,
        village: supplier.village,
        address:
          supplier.address || "",
        status: supplier.status,
      }));

    return NextResponse.json({
      success: true,

      area: {
        areaId: area.areaId,
        name: area.name,
        description:
          area.description || "",
        status: area.status,
      },

      supplierCount:
        formattedSuppliers.length,

      suppliers:
        formattedSuppliers,
    });
  } catch (error) {
    /* =========================================
       UNAUTHORIZED
    ========================================= */

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
          suppliers: [],
        },
        { status: 401 }
      );
    }

    /* =========================================
       SERVER ERROR
    ========================================= */

    console.error(
      "AREA SUPPLIERS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load area suppliers",
        suppliers: [],
      },
      { status: 500 }
    );
  }
}