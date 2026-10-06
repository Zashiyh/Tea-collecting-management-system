
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import Area from "@/models/Area";

interface RouteContext {
  params: Promise<{
    collectionId: string;
  }>;
}

/* =====================================================
   SRI LANKA DAY RANGE
===================================================== */

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

/* =====================================================
   GET MONGODB COLLECTION
===================================================== */

async function getMongoCollection() {
  await connectDB();

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(
      "MongoDB database connection not available"
    );
  }

  return db.collection("dailyareacollections");
}

/* =====================================================
   GET SINGLE COLLECTION
===================================================== */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAuth();

    const dbCollection = await getMongoCollection();

    const { collectionId } = await context.params;

    const cleanCollectionId = decodeURIComponent(
      String(collectionId || "")
    ).trim();

    if (!cleanCollectionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Collection ID is required",
        },
        { status: 400 }
      );
    }

    const document = await dbCollection.findOne({
      collectionId: cleanCollectionId,
    });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          message: "Tea collection not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,

      collection: {
        _id: String(document._id),

        collectionId: document.collectionId,

        date: document.date,

        areaId: document.areaId || "",

        areaName: document.areaName || "",

        totalKg: Number(
          document.totalKg ?? 0
        ),

        factoryWeightKg: Number(
          document.factoryWeightKg ?? 0
        ),

        differenceKg: Number(
          document.differenceKg ?? 0
        ),

        notes: document.notes || "",

        createdAt: document.createdAt,

        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "GET SINGLE COLLECTION ERROR:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load tea collection",
      },
      { status: 500 }
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
    await requireAuth();

    const dbCollection =
      await getMongoCollection();

    const { collectionId } =
      await context.params;

    const cleanCollectionId =
      decodeURIComponent(
        String(collectionId || "")
      ).trim();

    /* =================================================
       COLLECTION ID
    ================================================= */

    if (!cleanCollectionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Collection ID is required",
        },
        { status: 400 }
      );
    }

    /* =================================================
       BODY
    ================================================= */

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    /* =================================================
       GET VALUES FROM BODY
    ================================================= */

    const date = String(
      body.date ?? ""
    ).trim();

    const requestedAreaId =
      String(
        body.areaId ?? ""
      ).trim();

    const requestedAreaName =
      String(
        body.areaName ?? ""
      ).trim();

    /*
      Tea / Field Weight
    */
    const totalKg = Number(
      body.totalKg
    );

    /*
      IMPORTANT:
      Factory Weight comes from EDIT FORM.
    */
    const factoryWeightKg =
      Number(
        body.factoryWeightKg
      );

    const notes = String(
      body.notes ?? ""
    ).trim();

    /* =================================================
       VALIDATION - DATE
    ================================================= */

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collection date is required",
        },
        { status: 400 }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid collection date",
        },
        { status: 400 }
      );
    }

    /* =================================================
       VALIDATION - AREA
    ================================================= */

    if (!requestedAreaId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select an area",
        },
        { status: 400 }
      );
    }

    /* =================================================
       VALIDATION - TEA WEIGHT
    ================================================= */

    if (
      !Number.isFinite(totalKg) ||
      totalKg <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tea / Field Weight must be greater than 0",
        },
        { status: 400 }
      );
    }

    /* =================================================
       VALIDATION - FACTORY WEIGHT
    ================================================= */

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
            "Factory Weight must be 0 or greater",
        },
        { status: 400 }
      );
    }

    /* =================================================
       FIND CURRENT COLLECTION
    ================================================= */

    const current =
      await dbCollection.findOne({
        collectionId:
          cleanCollectionId,
      });

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          message: "Tea collection not found",
        },
        { status: 404 }
      );
    }

    /* =================================================
       FIND AREA BY ID
    ================================================= */

    let area = await Area.findOne({
      areaId: requestedAreaId,
    }).lean();

    /* =================================================
       FALLBACK AREA BY NAME
    ================================================= */

    if (
      !area &&
      requestedAreaName
    ) {
      area =
        await Area.findOne({
          name: {
            $regex:
              `^${requestedAreaName.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}$`,
            $options: "i",
          },
        }).lean();
    }

    /* =================================================
       AREA NOT FOUND
    ================================================= */

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message: "Area not found",
        },
        { status: 404 }
      );
    }

    /* =================================================
       INACTIVE AREA CHECK
       
       Existing inactive area can still be edited.
       A different inactive area cannot be selected.
    ================================================= */

    const currentAreaId =
      String(
        current.areaId ?? ""
      )
        .trim()
        .toLowerCase();

    const selectedAreaId =
      String(
        area.areaId ?? ""
      )
        .trim()
        .toLowerCase();

    const isSameExistingArea =
      currentAreaId ===
      selectedAreaId;

    if (
      area.status === "Inactive" &&
      !isSameExistingArea
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected area is inactive",
        },
        { status: 400 }
      );
    }

    /* =================================================
       DATE RANGE
    ================================================= */

    const {
      start,
      end,
    } =
      getSriLankaDayRange(date);

    if (
      Number.isNaN(
        start.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid collection date",
        },
        { status: 400 }
      );
    }

    /* =================================================
       DUPLICATE CHECK
       
       Same area + same date cannot have
       another collection.
    ================================================= */

    const duplicate =
      await dbCollection.findOne({
        areaId: area.areaId,

        date: {
          $gte: start,
          $lt: end,
        },

        collectionId: {
          $ne:
            cleanCollectionId,
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A collection already exists for this area on this date",
        },
        { status: 409 }
      );
    }

    /* =================================================
       DIFFERENCE
       
       Factory Weight - Tea / Field Weight
    ================================================= */

    const differenceKg =
      Number(
        (
          factoryWeightKg -
          totalKg
        ).toFixed(2)
      );

    /* =================================================
       IMPORTANT DEBUG LOG
    ================================================= */

    console.log(
      "EDIT COLLECTION DATA:",
      {
        collectionId:
          cleanCollectionId,
        date,
        areaId:
          area.areaId,
        areaName:
          area.name,
        totalKg,
        factoryWeightKg,
        differenceKg,
      }
    );

    /* =================================================
       UPDATE MONGODB
    ================================================= */

    const updateResult =
      await dbCollection.updateOne(
        {
          _id:
            current._id,
        },
        {
          $set: {
            date: start,

            areaId:
              String(
                area.areaId
              ).trim(),

            areaName:
              String(
                area.name
              ).trim(),

            /*
              Tea / Field Weight
            */
            totalKg,

            /*
              IMPORTANT:
              SAVE NEW FACTORY WEIGHT
              FROM EDIT FORM.
            */
            factoryWeightKg,

            /*
              AUTO CALCULATED DIFFERENCE
            */
            differenceKg,

            notes,

            updatedAt:
              new Date(),
          },
        }
      );

    /* =================================================
       UPDATE CHECK
    ================================================= */

    if (
      updateResult.matchedCount ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collection could not be updated",
        },
        { status: 500 }
      );
    }

    if (
      updateResult.modifiedCount ===
      0
    ) {
      console.warn(
        "Collection matched but no document was modified."
      );
    }

    /* =================================================
       GET UPDATED DOCUMENT
    ================================================= */

    const updated =
      await dbCollection.findOne({
        _id:
          current._id,
      });

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Updated collection could not be loaded",
        },
        { status: 500 }
      );
    }

    /* =================================================
       SUCCESS RESPONSE
    ================================================= */

    return NextResponse.json({
      success: true,

      message:
        "Collection updated successfully",

      collection: {
        _id: String(
          updated._id
        ),

        collectionId:
          updated.collectionId,

        date:
          updated.date,

        areaId:
          updated.areaId || "",

        areaName:
          updated.areaName || "",

        totalKg:
          Number(
            updated.totalKg ?? 0
          ),

        factoryWeightKg:
          Number(
            updated.factoryWeightKg ??
              0
          ),

        differenceKg:
          Number(
            updated.differenceKg ??
              0
          ),

        notes:
          updated.notes || "",

        createdAt:
          updated.createdAt,

        updatedAt:
          updated.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE COLLECTION ERROR:",
      error
    );

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
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update collection",
      },
      { status: 500 }
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
    await requireAuth();

    const dbCollection =
      await getMongoCollection();

    const { collectionId } =
      await context.params;

    const cleanCollectionId =
      decodeURIComponent(
        String(collectionId || "")
      ).trim();

    if (!cleanCollectionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Collection ID is required",
        },
        { status: 400 }
      );
    }

    const existing =
      await dbCollection.findOne({
        collectionId:
          cleanCollectionId,
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tea collection not found",
        },
        { status: 404 }
      );
    }

    await dbCollection.deleteOne({
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
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete collection",
      },
      { status: 500 }
    );
  }
}
