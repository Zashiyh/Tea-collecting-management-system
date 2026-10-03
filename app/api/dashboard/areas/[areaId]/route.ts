import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import DailyAreaCollection from "@/models/DailyAreaCollection";

const START_DATE = "2026-10-01";

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

function getTodaySriLanka() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      areaId: string;
    }>;
  }
) {
  try {
    await connectDB();

    const { areaId } = await context.params;

    if (!areaId) {
      return NextResponse.json(
        {
          success: false,
          message: "Area ID is required.",
        },
        { status: 400 }
      );
    }

    const decodedAreaId =
      decodeURIComponent(areaId);

    const { searchParams } =
      new URL(request.url);

    /*
      Optional date filtering.

      If no from/to is supplied,
      show ALL collections from START_DATE
      up to today.
    */

    const fromParam =
      searchParams.get("from");

    const toParam =
      searchParams.get("to");

    const fromDate =
      fromParam || START_DATE;

    const toDate =
      toParam || getTodaySriLanka();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid from date.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid to date.",
        },
        { status: 400 }
      );
    }

    const area =
      await Area.findOne({
        areaId: decodedAreaId,
      }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message: `Area not found: ${decodedAreaId}`,
        },
        { status: 404 }
      );
    }

    const {
      start: startDate,
    } = getSriLankaDayRange(fromDate);

    const {
      end: endDate,
    } = getSriLankaDayRange(toDate);

    /*
      Get ALL collections for this area
      inside the selected range.
    */

    const collections =
      await DailyAreaCollection.find({
        areaId: area.areaId,
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      })
        .sort({
          date: 1,
        })
        .lean();

    let totalTeaWeightKg = 0;
    let totalFactoryWeightKg = 0;

    const formattedCollections =
      collections.map((item) => {
        const teaWeight =
          Number(item.totalKg || 0);

        const factoryWeight =
          Number(
            item.factoryWeightKg || 0
          );

        const differenceKg =
          Number(
            (
              factoryWeight -
              teaWeight
            ).toFixed(2)
          );

        totalTeaWeightKg +=
          teaWeight;

        totalFactoryWeightKg +=
          factoryWeight;

        return {
          collectionId:
            item.collectionId,

          date:
            item.date,

          areaId:
            item.areaId,

          areaName:
            item.areaName,

          totalKg:
            teaWeight,

          factoryWeightKg:
            factoryWeight,

          differenceKg,

          notes:
            item.notes || "",
        };
      });

    totalTeaWeightKg =
      Number(
        totalTeaWeightKg.toFixed(2)
      );

    totalFactoryWeightKg =
      Number(
        totalFactoryWeightKg.toFixed(2)
      );

    const totalDifferenceKg =
      Number(
        (
          totalFactoryWeightKg -
          totalTeaWeightKg
        ).toFixed(2)
      );

    return NextResponse.json(
      {
        success: true,

        area: {
          areaId: area.areaId,
          areaName: area.name,
        },

        fromDate,

        toDate,

        summary: {
          totalCollections:
            formattedCollections.length,

          totalTeaWeightKg,

          totalFactoryWeightKg,

          totalDifferenceKg,
        },

        collections:
          formattedCollections,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "AREA DASHBOARD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load area dashboard.",
      },
      {
        status: 500,
      }
    );
  }
}