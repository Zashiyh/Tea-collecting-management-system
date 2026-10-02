import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";

interface RouteContext {
  params: Promise<{
    collectionId: string;
  }>;
}

/* =====================================================
   SRI LANKA DAY RANGE
===================================================== */

function getSriLankaDayRange(
  dateString: string
) {
  const start = new Date(
    `${dateString}T00:00:00+05:30`
  );

  const end = new Date(
    start.getTime() +
      24 * 60 * 60 * 1000
  );

  return {
    start,
    end,
  };
}

/* =====================================================
   GET MONGODB COLLECTION
===================================================== */

async function getMongoCollection() {
  await connectDB();

  const db =
    mongoose.connection.db;

  if (!db) {
    throw new Error(
      "MongoDB database connection not available"
    );
  }

  return db.collection(
    "dailyareacollections"
  );
}

/* =====================================================
   GET SINGLE COLLECTION
===================================================== */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const collection =
      await getMongoCollection();

    const { collectionId } =
      await context.params;

    console.log(
      "DETAIL COLLECTION ID:",
      collectionId
    );

    const document =
      await collection.findOne({
        collectionId,
      });

    console.log(
      "DETAIL COLLECTION FOUND:",
      document
    );

    if (!document) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Tea collection not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      collection: {
        _id: String(
          document._id
        ),

        collectionId:
          document.collectionId,

        date:
          document.date,

        areaId:
          document.areaId,

        areaName:
          document.areaName,

        totalKg:
          Number(
            document.totalKg ?? 0
          ),

        factoryWeightKg:
          Number(
            document.factoryWeightKg ??
              0
          ),

        differenceKg:
          Number(
            document.differenceKg ??
              0
          ),

        notes:
          document.notes || "",

        createdAt:
          document.createdAt,

        updatedAt:
          document.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "GET SINGLE COLLECTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load tea collection",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   UPDATE COLLECTION
===================================================== */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const collection =
      await getMongoCollection();

    const { collectionId } =
      await context.params;

    const body =
      await request.json();

    const date =
      String(
        body.date || ""
      ).trim();

    const areaId =
      String(
        body.areaId || ""
      ).trim();

    const totalKg =
      Number(
        body.totalKg
      );

    const notes =
      String(
        body.notes || ""
      ).trim();

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
          message:
            "Please select an area",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        totalKg
      ) ||
      totalKg <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Total tea KG must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    /* ===============================================
       FIND CURRENT COLLECTION
    =============================================== */

    const current =
      await collection.findOne({
        collectionId,
      });

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tea collection not found",
        },
        {
          status: 404,
        }
      );
    }

    /* ===============================================
       FIND AREA
    =============================================== */

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

    /* ===============================================
       DATE
    =============================================== */

    const {
      start,
      end,
    } =
      getSriLankaDayRange(
        date
      );

    /* ===============================================
       CHECK DUPLICATE AREA + DATE
    =============================================== */

    const duplicate =
      await collection.findOne({
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
            "A collection already exists for this area on this date",
        },
        {
          status: 409,
        }
      );
    }

    /* ===============================================
       FACTORY WEIGHT
    =============================================== */

    const factoryWeightKg =
      Number(
        current.factoryWeightKg ??
          0
      );

    const differenceKg =
      totalKg -
      factoryWeightKg;

    /* ===============================================
       UPDATE
    =============================================== */

    await collection.updateOne(
      {
        _id: current._id,
      },

      {
        $set: {
          date: start,

          areaId:
            area.areaId,

          areaName:
            area.name,

          totalKg,

          differenceKg,

          notes,

          updatedAt:
            new Date(),
        },
      }
    );

    const updated =
      await collection.findOne({
        _id: current._id,
      });

    return NextResponse.json({
      success: true,

      message:
        "Collection updated successfully",

      collection: {
        _id: String(
          updated?._id
        ),

        collectionId:
          updated?.collectionId,

        date:
          updated?.date,

        areaId:
          updated?.areaId,

        areaName:
          updated?.areaName,

        totalKg:
          Number(
            updated?.totalKg ??
              0
          ),

        factoryWeightKg:
          Number(
            updated?.factoryWeightKg ??
              0
          ),

        differenceKg:
          Number(
            updated?.differenceKg ??
              0
          ),

        notes:
          updated?.notes || "",
      },
    });
  } catch (error) {
    console.error(
      "UPDATE COLLECTION ERROR:",
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

/* =====================================================
   DELETE COLLECTION
===================================================== */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const collection =
      await getMongoCollection();

    const { collectionId } =
      await context.params;

    const existing =
      await collection.findOne({
        collectionId,
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Tea collection not found",
        },
        {
          status: 404,
        }
      );
    }

    await collection.deleteOne({
      _id: existing._id,
    });

    return NextResponse.json({
      success: true,

      message:
        "Collection deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE COLLECTION ERROR:",
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