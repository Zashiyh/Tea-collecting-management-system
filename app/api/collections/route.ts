import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";

function getSriLankaDateRange(
  dateString: string
) {
  const start = new Date(
    `${dateString}T00:00:00+05:30`
  );

  const end = new Date(
    `${dateString}T23:59:59.999+05:30`
  );

  return {
    start,
    end,
  };
}

/* =====================================================
   GET COLLECTIONS
===================================================== */

export async function GET(
  request: Request
) {
  try {
    await connectDB();

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error(
        "MongoDB database connection not available"
      );
    }

    const collection =
      db.collection(
        "dailyareacollections"
      );

    const { searchParams } =
      new URL(request.url);

    const areaId =
      searchParams.get("areaId");

    const date =
      searchParams.get("date");

    const filter: Record<
      string,
      unknown
    > = {};

    if (areaId) {
      filter.areaId = areaId;
    }

    /* --------------------------------
       Date filter
    -------------------------------- */

    if (date) {
      const {
        start,
        end,
      } = getSriLankaDateRange(date);

      filter.date = {
        $gte: start,
        $lte: end,
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
      documents.map(
        (document) => ({
          _id: String(
            document._id
          ),

          collectionId:
            document.collectionId,

          date: document.date,

          areaId:
            document.areaId,

          areaName:
            document.areaName,

          // Area / Tea weight
          totalKg: Number(
            document.totalKg ?? 0
          ),

          // Factory weight
          factoryWeightKg:
            Number(
              document.factoryWeightKg ??
                0
            ),

          // Difference
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
        })
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

/* =====================================================
   POST COLLECTION
===================================================== */

export async function POST(
  request: Request
) {
  try {
    await connectDB();

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error(
        "MongoDB database connection not available"
      );
    }

    const body =
      await request.json();

    const date = String(
      body.date || ""
    ).trim();

    const areaId = String(
      body.areaId || ""
    ).trim();

    const totalKg = Number(
      body.totalKg
    );

    const factoryWeightKg =
      Number(
        body.factoryWeightKg
      );

    const notes = String(
      body.notes || ""
    ).trim();

    /* --------------------------------
       Validation
    -------------------------------- */

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
            "Area is required",
        },
        { status: 400 }
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
            "Valid tea weight is required",
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    /* --------------------------------
       Validate date
    -------------------------------- */

    const selectedDate =
      new Date(
        `${date}T00:00:00+05:30`
      );

    if (
      Number.isNaN(
        selectedDate.getTime()
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

    /* --------------------------------
       Find area
    -------------------------------- */

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
            "Selected area was not found or is inactive",
        },
        { status: 404 }
      );
    }

    /* --------------------------------
       Difference
       
       Tea Weight - Factory Weight
    -------------------------------- */

    const differenceKg =
      Number(
        (
          totalKg -
          factoryWeightKg
        ).toFixed(2)
      );

    const collection =
      db.collection(
        "dailyareacollections"
      );

    /* --------------------------------
       Check same area + same date
    -------------------------------- */

    const start =
      new Date(
        `${date}T00:00:00+05:30`
      );

    const end =
      new Date(
        `${date}T23:59:59.999+05:30`
      );

    const existing =
      await collection.findOne({
        areaId,
        date: {
          $gte: start,
          $lte: end,
        },
      });

    /* --------------------------------
       If already exists
       
       Update it instead of creating
       duplicate collection
    -------------------------------- */

    if (existing) {
      await collection.updateOne(
        {
          _id: existing._id,
        },
        {
          $set: {
            date: selectedDate,
            areaId: area.areaId,
            areaName: area.name,

            totalKg,

            factoryWeightKg,

            differenceKg,

            notes,

            updatedAt:
              new Date(),
          },
        }
      );

      const updated =
        await collection.findOne({
          _id: existing._id,
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

          totalKg: Number(
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

    /* --------------------------------
       Generate collection ID
    -------------------------------- */

    const lastCollection =
      await collection
        .find({})
        .sort({
          collectionId: -1,
        })
        .limit(1)
        .toArray();

    let nextNumber = 1;

    if (
      lastCollection.length > 0
    ) {
      const lastId =
        String(
          lastCollection[0]
            .collectionId || ""
        );

      const match =
        lastId.match(
          /(\d+)$/
        );

      if (match) {
        nextNumber =
          Number(match[1]) + 1;
      }
    }

    const collectionId =
      `AREA-COL-${String(
        nextNumber
      ).padStart(3, "0")}`;

    /* --------------------------------
       Create collection
    -------------------------------- */

    const newCollection = {
      collectionId,

      date: selectedDate,

      areaId: area.areaId,

      areaName: area.name,

      // Tea weight
      totalKg,

      // Factory weight
      factoryWeightKg,

      // Difference
      differenceKg,

      notes,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    const result =
      await collection.insertOne(
        newCollection
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Collection added successfully",

        collection: {
          _id: String(
            result.insertedId
          ),

          collectionId,

          date: selectedDate,

          areaId:
            area.areaId,

          areaName:
            area.name,

          totalKg,

          factoryWeightKg,

          differenceKg,

          notes,
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