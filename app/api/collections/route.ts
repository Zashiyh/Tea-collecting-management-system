import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

import Area from "@/models/Area";
import DailyAreaCollection from "@/models/DailyAreaCollection";

const START_COLLECTION_ID = "AREA-COL";

function getSriLankaDayRange(dateString: string) {
  const start = new Date(
    `${dateString}T00:00:00+05:30`
  );

  const end = new Date(
    `${dateString}T00:00:00+05:30`
  );

  end.setTime(
    end.getTime() + 24 * 60 * 60 * 1000
  );

  return {
    start,
    end,
  };
}

function getSriLankaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: Request) {
  try {
    // 🔒 Login required
    await requireAuth();

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const areaId =
      searchParams.get("areaId");

    const date =
      searchParams.get("date");

    const filter: Record<string, unknown> = {};

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

    const collections =
      await DailyAreaCollection.find(
        filter
      )
        .sort({
          date: -1,
          createdAt: -1,
        })
        .lean();

    const formatted =
      collections.map((item) => {
        const teaWeight = Number(
          item.totalKg || 0
        );

        const factoryWeight = Number(
          item.factoryWeightKg || 0
        );

        // IMPORTANT:
        // Factory Weight - Tea Weight
        const differenceKg = Number(
          (
            factoryWeight -
            teaWeight
          ).toFixed(2)
        );

        return {
          ...item,

          _id: item._id.toString(),

          totalKg: teaWeight,

          factoryWeightKg:
            factoryWeight,

          differenceKg,
        };
      });

    return NextResponse.json({
      success: true,
      collections: formatted,
    });
  } catch (error) {
    /*
     * UNAUTHORIZED
     */
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
          collections: [],
        },
        {
          status: 401,
        }
      );
    }

    console.error(
      "COLLECTIONS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load collections",
        collections: [],
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 🔒 Login required
    await requireAuth();

    await connectDB();

    const body =
      await request.json();

    const {
      date,
      areaId,
      totalKg,
      factoryWeightKg,
      notes,
    } = body;

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Date is required",
        },
        { status: 400 }
      );
    }

    if (!areaId) {
      return NextResponse.json(
        {
          success: false,
          message: "Area is required",
        },
        { status: 400 }
      );
    }

    const teaWeight = Number(totalKg);

    const factoryWeight =
      Number(factoryWeightKg);

    if (
      !Number.isFinite(teaWeight) ||
      teaWeight < 0
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
      !Number.isFinite(factoryWeight) ||
      factoryWeight < 0
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

    const {
      start,
      end,
    } = getSriLankaDayRange(date);

    const existing =
      await DailyAreaCollection.findOne({
        areaId,
        date: {
          $gte: start,
          $lt: end,
        },
      });

    // IMPORTANT:
    // Factory Weight - Tea Weight
    const differenceKg = Number(
      (
        factoryWeight -
        teaWeight
      ).toFixed(2)
    );

    if (existing) {
      existing.date = start;

      existing.areaId =
        area.areaId;

      existing.areaName =
        area.name;

      existing.totalKg =
        teaWeight;

      existing.factoryWeightKg =
        factoryWeight;

      existing.differenceKg =
        differenceKg;

      existing.notes =
        typeof notes === "string"
          ? notes.trim()
          : "";

      await existing.save();

      return NextResponse.json({
        success: true,
        message:
          "Collection updated successfully",
        collection: {
          collectionId:
            existing.collectionId,
          date: existing.date,
          areaId:
            existing.areaId,
          areaName:
            existing.areaName,
          totalKg:
            existing.totalKg,
          factoryWeightKg:
            existing.factoryWeightKg,
          differenceKg:
            existing.differenceKg,
          notes:
            existing.notes,
        },
      });
    }

    const lastCollection =
      await DailyAreaCollection.findOne({})
        .sort({
          collectionId: -1,
        })
        .lean();

    let nextNumber = 1;

    if (
      lastCollection?.collectionId
    ) {
      const match =
        lastCollection.collectionId.match(
          /(\d+)$/
        );

      if (match) {
        nextNumber =
          Number(match[1]) + 1;
      }
    }

    const collectionId =
      `${START_COLLECTION_ID}-${String(
        nextNumber
      ).padStart(3, "0")}`;

    const collection =
      await DailyAreaCollection.create({
        collectionId,

        date: start,

        areaId:
          area.areaId,

        areaName:
          area.name,

        totalKg:
          teaWeight,

        factoryWeightKg:
          factoryWeight,

        differenceKg,

        notes:
          typeof notes === "string"
            ? notes.trim()
            : "",
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Collection saved successfully",

        collection: {
          collectionId:
            collection.collectionId,

          date:
            collection.date,

          areaId:
            collection.areaId,

          areaName:
            collection.areaName,

          totalKg:
            collection.totalKg,

          factoryWeightKg:
            collection.factoryWeightKg,

          differenceKg:
            collection.differenceKg,

          notes:
            collection.notes,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /*
     * UNAUTHORIZED
     */
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
        {
          status: 401,
        }
      );
    }

    console.error(
      "COLLECTION POST ERROR:",
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
      {
        status: 500,
      }
    );
  }
}