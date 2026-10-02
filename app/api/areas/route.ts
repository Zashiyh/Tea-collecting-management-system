import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";

export async function GET() {
  try {
    await connectDB();

    const areas = await Area.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      areas,
    });
  } catch (error) {
    console.error("GET /api/areas ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load areas",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();

    // Validate name
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Area name is required",
        },
        { status: 400 }
      );
    }

    // Check duplicate area
    const existingArea = await Area.findOne({
      name: {
        $regex: `^${name.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },
    });

    if (existingArea) {
      return NextResponse.json(
        {
          success: false,
          message: "An area with this name already exists",
        },
        { status: 409 }
      );
    }

    // Generate AREA-001, AREA-002...
    const lastArea = await Area.findOne({})
      .sort({ createdAt: -1 })
      .select("areaId")
      .lean();

    let nextNumber = 1;

    if (lastArea?.areaId) {
      const match = lastArea.areaId.match(/AREA-(\d+)/);

      if (match) {
        nextNumber = Number(match[1]) + 1;
      }
    }

    const areaId = `AREA-${String(nextNumber).padStart(
      3,
      "0"
    )}`;

    const area = await Area.create({
      areaId,
      name,
      description,
      status: "Active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Area created successfully",
        area,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/areas ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create area",
      },
      { status: 500 }
    );
  }
}