import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";

function getSriLankaDayRange(dateString: string) {
  const start = new Date(
    `${dateString}T00:00:00+05:30`
  );

  const end = new Date(
    start.getTime() + 24 * 60 * 60 * 1000
  );

  return { start, end };
}

async function getMongoCollection() {
  await connectDB();

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database connection not available");
  }

  return db.collection("dailyareacollections");
}

async function generateCollectionId(
  collection: ReturnType<
    NonNullable<typeof mongoose.connection.db>["collection"]
  >
) {
  const last = await collection
    .find({})
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  let nextNumber = 1;

  if (
    last &&
    typeof last.collectionId === "string"
  ) {
    const match =
      last.collectionId.match(
        /AREA-COL-(\d+)/
      );

    if (match) {
      nextNumber =
        Number(match[1]) + 1;
    }
  }

  return `AREA-COL-${String(
    nextNumber
  ).padStart(3, "0")}`;
}

/* =====================================
   GET
===================================== */

export async function GET(
  request: Request
) {
  try {
    const collection =
      await getMongoCollection();

    const { searchParams } =
      new URL(request.url);

    const date =
      searchParams.get("date");

    const areaId =
      searchParams.get("areaId");

    const filter: Record<
      string,
      unknown
    > = {};

    if (areaId) {
      filter.areaId = areaId;
    }

    if (date) {
      const { start, end } =
        getSriLankaDayRange(date);

      filter.date = {
        $gte: start,
        $lt: end,
      };
    }

    const documents =
      await collection
        .find(filter)
        .sort({
          date: -1,
          createdAt: -1,
        })
        .toArray();

    const collections =
      documents.map((item) => ({
        _id: String(item._id),

        collectionId:
          item.collectionId || "",

        date:
          item.date,

        areaId:
          item.areaId || "",

        areaName:
          item.areaName || "",

        totalKg:
          Number(item.totalKg ?? 0),

        factoryWeightKg:
          Number(
            item.factoryWeightKg ?? 0
          ),

        differenceKg:
          Number(
            item.differenceKg ?? 0
          ),

        notes:
          item.notes || "",

        createdAt:
          item.createdAt,

        updatedAt:
          item.updatedAt,
      }));

    console.log(
      "GET FROM MONGODB:",
      collections
    );

    return NextResponse.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error(
      "GET COLLECTIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load collections",
      },
      { status: 500 }
    );
  }
}

/* =====================================
   POST
===================================== */

export async function POST(
  request: Request
) {
  try {
    const collection =
      await getMongoCollection();

    const body =
      await request.json();

    console.log(
      "================================"
    );

    console.log(
      "RAW BODY:",
      body
    );

    const date =
      String(
        body.date || ""
      ).trim();

    const areaId =
      String(
        body.areaId || ""
      ).trim();

    const totalKg =
      Number(body.totalKg);

    console.log(
      "DATE:",
      date
    );

    console.log(
      "AREA:",
      areaId
    );

    console.log(
      "TOTAL KG:",
      totalKg
    );

    console.log(
      "TOTAL KG TYPE:",
      typeof totalKg
    );

    /* =================================
       VALIDATION
    ================================= */

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

    if (!areaId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select an area",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(totalKg) ||
      totalKg <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Total tea KG must be greater than 0",
        },
        { status: 400 }
      );
    }

    /* =================================
       FIND AREA
    ================================= */

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
        { status: 404 }
      );
    }

    /* =================================
       DATE
    ================================= */

    const {
      start,
      end,
    } =
      getSriLankaDayRange(date);

    /* =================================
       CHECK EXISTING
    ================================= */

    const existing =
      await collection.findOne({
        areaId,
        date: {
          $gte: start,
          $lt: end,
        },
      });

    /* =================================
       UPDATE EXISTING
    ================================= */

    if (existing) {
      console.log(
        "EXISTING RECORD FOUND:",
        existing
      );

      await collection.updateOne(
        {
          _id: existing._id,
        },
        {
          $set: {
            totalKg: totalKg,

            areaName:
              area.name,

            differenceKg:
              totalKg -
              Number(
                existing.factoryWeightKg ??
                  0
              ),

            updatedAt:
              new Date(),
          },
        }
      );

      const updated =
        await collection.findOne({
          _id: existing._id,
        });

      console.log(
        "UPDATED DIRECTLY IN MONGODB:",
        updated
      );

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
              updated?.totalKg ?? 0
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
    }

    /* =================================
       CREATE NEW
    ================================= */

    const collectionId =
      await generateCollectionId(
        collection
      );

    const newDocument = {
      collectionId,

      date: start,

      areaId:
        area.areaId,

      areaName:
        area.name,

      totalKg:
        totalKg,

      factoryWeightKg:
        0,

      differenceKg:
        totalKg,

      notes: "",

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    console.log(
      "DOCUMENT BEFORE MONGODB INSERT:",
      newDocument
    );

    const insertResult =
      await collection.insertOne(
        newDocument
      );

    console.log(
      "MONGODB INSERT RESULT:",
      insertResult
    );

    /* =================================
       READ BACK FROM MONGODB
    ================================= */

    const saved =
      await collection.findOne({
        _id:
          insertResult.insertedId,
      });

    console.log(
      "ACTUAL SAVED MONGODB DOCUMENT:",
      saved
    );

    console.log(
      "ACTUAL SAVED TOTAL KG:",
      saved?.totalKg
    );

    /* =================================
       RESPONSE
    ================================= */

    return NextResponse.json(
      {
        success: true,

        message:
          "Collection added successfully",

        collection: {
          _id: String(
            saved?._id
          ),

          collectionId:
            saved?.collectionId,

          date:
            saved?.date,

          areaId:
            saved?.areaId,

          areaName:
            saved?.areaName,

          totalKg:
            Number(
              saved?.totalKg ?? 0
            ),

          factoryWeightKg:
            Number(
              saved?.factoryWeightKg ??
                0
            ),

          differenceKg:
            Number(
              saved?.differenceKg ??
                0
            ),

          notes:
            saved?.notes || "",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST COLLECTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to save collection",
      },
      { status: 500 }
    );
  }
}