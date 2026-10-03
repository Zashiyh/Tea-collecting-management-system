
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import Supplier from "@/models/Supplier";

/* =========================================
   GET ALL AREAS
========================================= */

export async function GET() {
  try {
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
    console.error(
      "GET AREAS ERROR:",
      error
    );

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

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const body = await request.json();

    const areaId = String(
      body.areaId || ""
    ).trim();

    const name = String(
      body.name || ""
    ).trim();

    const description = String(
      body.description || ""
    ).trim();

    const status =
      body.status === "Inactive"
        ? "Inactive"
        : "Active";

    if (!areaId) {
      return NextResponse.json(
        {
          success: false,
          message: "Area ID is required",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Area name is required",
        },
        { status: 400 }
      );
    }

    /* CHECK AREA ID */

    const existingAreaId =
      await Area.findOne({
        areaId,
      });

    if (existingAreaId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Area ID already exists",
        },
        { status: 409 }
      );
    }

    /* CHECK AREA NAME */

    const existingName =
      await Area.findOne({
        name,
      });

    if (existingName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Area name already exists",
        },
        { status: 409 }
      );
    }

    const area = await Area.create({
      areaId,
      name,
      description,
      status,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Area created successfully",
        area: {
          _id: area._id.toString(),
          areaId: area.areaId,
          name: area.name,
          description: area.description,
          status: area.status,
          supplierCount: 0,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
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

