
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

import Area from "@/models/Area";
import Supplier from "@/models/Supplier";

/* =========================================
   GET ALL AREAS
========================================= */

export async function GET() {
  try {
    // 🔒 Login required
    await requireAuth();

    await connectDB();

    const areas = await Area.find({})
      .sort({ createdAt: -1 })
      .lean();

    const formattedAreas = await Promise.all(
      areas.map(async (area) => {
        const supplierCount =
          await Supplier.countDocuments({
            areaId: area.areaId,
          });

        return {
          _id: area._id.toString(),
          areaId: area.areaId,
          name: area.name,
          description: area.description || "",
          status: area.status,
          supplierCount,
          createdAt: area.createdAt,
          updatedAt: area.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      areas: formattedAreas,
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
          message: "Authentication required.",
          areas: [],
        },
        {
          status: 401,
        }
      );
    }

    /* =========================================
       SERVER ERROR
    ========================================= */

    console.error("GET AREAS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load areas",
        areas: [],
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================
   CREATE AREA
========================================= */

export async function POST(request: Request) {
  try {
    // 🔒 Login required
    await requireAuth();

    await connectDB();

    const body = await request.json();

    /* =========================================
       USER INPUT
    ========================================= */

    const name = String(body.name || "").trim();

    const description = String(
      body.description || ""
    ).trim();

    const status =
      body.status === "Inactive"
        ? "Inactive"
        : "Active";

    /* =========================================
       VALIDATION
    ========================================= */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Area name is required",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================================
       CHECK AREA NAME
    ========================================= */

    const existingName = await Area.findOne({
      name: {
        $regex: `^${name.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },
    });

    if (existingName) {
      return NextResponse.json(
        {
          success: false,
          message: "Area name already exists",
        },
        {
          status: 409,
        }
      );
    }

    /* =========================================
       GENERATE AREA ID AUTOMATICALLY
       
       Example:
       AREA-001
       AREA-002
       AREA-003
    ========================================= */

    const existingAreas = await Area.find({
      areaId: {
        $regex: /^AREA-\d+$/i,
      },
    })
      .select("areaId")
      .lean();

    let highestNumber = 0;

    for (const area of existingAreas) {
      const match =
        String(area.areaId).match(/(\d+)$/);

      if (match) {
        const number = Number(match[1]);

        if (
          Number.isFinite(number) &&
          number > highestNumber
        ) {
          highestNumber = number;
        }
      }
    }

    const nextNumber = highestNumber + 1;

    const areaId = `AREA-${String(
      nextNumber
    ).padStart(3, "0")}`;

    /* =========================================
       CREATE AREA
    ========================================= */

    const area = await Area.create({
      areaId,
      name,
      description,
      status,
    });

    /* =========================================
       SUCCESS RESPONSE
    ========================================= */

    return NextResponse.json(
      {
        success: true,
        message: "Area created successfully",
        area: {
          _id: area._id.toString(),
          areaId: area.areaId,
          name: area.name,
          description: area.description || "",
          status: area.status,
          supplierCount: 0,
        },
      },
      {
        status: 201,
      }
    );
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
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /* =========================================
       DUPLICATE KEY
    ========================================= */

    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An area with the same identifier already exists. Please try again.",
        },
        {
          status: 409,
        }
      );
    }

    /* =========================================
       SERVER ERROR
    ========================================= */

    console.error(
      "CREATE AREA ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create area",
      },
      {
        status: 500,
      }
    );
  }
}

