import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import DailyAreaCollection from "@/models/DailyAreaCollection";

interface RouteContext {
  params: Promise<{
    collectionId: string;
  }>;
}

function getSriLankaDayRange(dateString: string) {
  const start = new Date(
    `${dateString}T00:00:00+05:30`
  );

  const end = new Date(
    start.getTime() + 24 * 60 * 60 * 1000
  );

  return {
    start,
    end,
  };
}

/* =========================
   GET SINGLE COLLECTION
========================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { collectionId } =
      await context.params;

    const collection =
      await DailyAreaCollection.findOne({
        collectionId,
      }).lean();

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          message: "Collection not found",
        },
        {
          status: 404,
        }
      );
    }

    const teaWeight = Number(
      collection.totalKg || 0
    );

    const factoryWeight = Number(
      collection.factoryWeightKg || 0
    );

    const differenceKg = Number(
      (
        factoryWeight -
        teaWeight
      ).toFixed(2)
    );

    return NextResponse.json({
      success: true,
      collection: {
        ...collection,
        _id: collection._id.toString(),
        totalKg: teaWeight,
        factoryWeightKg: factoryWeight,
        differenceKg,
        notes: collection.notes || "",
      },
    });
  } catch (error) {
    console.error(
      "GET collection ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load collection",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================
   UPDATE COLLECTION
========================= */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { collectionId } =
      await context.params;

    const body = await request.json();

    const date = String(
      body.date || ""
    ).trim();

    const areaId = String(
      body.areaId || ""
    ).trim();

    const totalKg = Number(
      body.totalKg
    );

    const factoryWeightKg = Number(
      body.factoryWeightKg
    );

    const notes = String(
      body.notes || ""
    ).trim();

    /* =========================
       VALIDATION
    ========================= */

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collection date is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!areaId) {
      return NextResponse.json(
        {
          success: false,
          message: "Area is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(totalKg) ||
      totalKg < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid tea weight is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        factoryWeightKg
      ) ||
      factoryWeightKg < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid factory weight is required",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       FIND COLLECTION
    ========================= */

    const collection =
      await DailyAreaCollection.findOne({
        collectionId,
      });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          message: "Collection not found",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       FIND AREA
    ========================= */

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
            "Active area not found",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       CHECK DUPLICATE
    ========================= */

    const {
      start,
      end,
    } = getSriLankaDayRange(date);

    const duplicate =
      await DailyAreaCollection.findOne({
        areaId,
        date: {
          $gte: start,
          $lt: end,
        },
        collectionId: {
          $ne: collectionId,
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A collection already exists for this area and date.",
        },
        {
          status: 409,
        }
      );
    }

    /* =========================
       DIFFERENCE
       FACTORY - TEA
    ========================= */

    const differenceKg = Number(
      (
        factoryWeightKg -
        totalKg
      ).toFixed(2)
    );

    /* =========================
       UPDATE
    ========================= */

    collection.date = start;

    collection.areaId =
      area.areaId;

    collection.areaName =
      area.name;

    collection.totalKg =
      totalKg;

    collection.factoryWeightKg =
      factoryWeightKg;

    collection.differenceKg =
      differenceKg;

    collection.notes =
      notes;

    await collection.save();

    return NextResponse.json({
      success: true,
      message:
        "Collection updated successfully",
      collection: {
        ...collection.toObject(),
        _id:
          collection._id.toString(),
        differenceKg,
      },
    });
  } catch (error) {
    console.error(
      "PATCH collection ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update collection",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================
   DELETE COLLECTION
========================= */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { collectionId } =
      await context.params;

    const collection =
      await DailyAreaCollection.findOne({
        collectionId,
      });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          message: "Collection not found",
        },
        {
          status: 404,
        }
      );
    }

    await DailyAreaCollection.deleteOne({
      collectionId,
    });

    return NextResponse.json({
      success: true,
      message:
        "Collection deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE collection ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete collection",
      },
      {
        status: 500,
      }
    );
  }
}