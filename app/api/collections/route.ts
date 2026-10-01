import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeaCollection from "@/models/TeaCollection";
import Supplier from "@/models/Supplier";
import Area from "@/models/Area";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const areaId = searchParams.get("areaId");
    const supplierId = searchParams.get("supplierId");

    const filter: Record<string, unknown> = {};

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);

      filter.date = {
        $gte: start,
        $lte: end,
      };
    }

    if (areaId) {
      filter.areaId = areaId;
    }

    if (supplierId) {
      filter.supplierId = supplierId;
    }

    const collections = await TeaCollection.find(filter)
      .sort({
        date: -1,
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error("GET collections error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch collections",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      date,
      areaId,
      supplierId,
      weightKg,
      ratePerKg,
      notes,
    } = body;

    if (
      !date ||
      !areaId ||
      !supplierId ||
      weightKg === undefined ||
      ratePerKg === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields are missing",
        },
        { status: 400 }
      );
    }

    const weight = Number(weightKg);
    const rate = Number(ratePerKg);

    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Weight must be greater than zero",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Rate must be greater than zero",
        },
        { status: 400 }
      );
    }

    const area = await Area.findOne({
      areaId,
      status: "Active",
    }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected area was not found",
        },
        { status: 404 }
      );
    }

    const supplier = await Supplier.findOne({
      supplierId,
      areaId,
      status: "Active",
    }).lean();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected supplier does not belong to this area",
        },
        { status: 400 }
      );
    }

    const totalAmount = weight * rate;

    const count = await TeaCollection.countDocuments();

    const collectionId = `COL-${String(
      count + 1
    ).padStart(3, "0")}`;

    const collection = await TeaCollection.create({
      collectionId,
      date: new Date(date),

      areaId: area.areaId,
      areaName: area.name,

      supplierId: supplier.supplierId,
      supplierName: supplier.name,

      weightKg: weight,
      ratePerKg: rate,
      totalAmount,

      notes: notes?.trim() || "",
    });

    return NextResponse.json(
      {
        success: true,
        collection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST collection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create collection",
      },
      { status: 500 }
    );
  }
}