import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";

export async function GET() {
  try {
    await connectDB();

    const areas = await Area.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      areas,
    });
  } catch (error) {
    console.error("GET areas error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch areas",
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
    const description = body.description?.trim() || "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Area name is required",
        },
        { status: 400 }
      );
    }

    const existingArea = await Area.findOne({
      name,
    });

    if (existingArea) {
      return NextResponse.json(
        {
          success: false,
          message: "This area already exists",
        },
        { status: 409 }
      );
    }

    const lastArea = await Area.findOne()
      .sort({ createdAt: -1 })
      .lean();

    let nextNumber = 1;

    if (lastArea?.areaId) {
      const number = parseInt(
        lastArea.areaId.replace("AREA-", ""),
        10
      );

      if (!Number.isNaN(number)) {
        nextNumber = number + 1;
      }
    }

    const areaId = `AREA-${String(nextNumber).padStart(3, "0")}`;

    const area = await Area.create({
      areaId,
      name,
      description,
      status: "Active",
    });

    return NextResponse.json(
      {
        success: true,
        area,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST area error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create area",
      },
      { status: 500 }
    );
  }
}