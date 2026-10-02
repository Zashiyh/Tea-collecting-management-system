import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import DailyAreaCollection from "@/models/DailyAreaCollection";

const START_DATE = "2026-10-01";

function getSriLankaDayRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00+05:30`);

  const end = new Date(`${dateString}T00:00:00+05:30`);

  end.setTime(end.getTime() + 24 * 60 * 60 * 1000);

  return {
    start,
    end,
  };
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const selectedDate =
      searchParams.get("date") ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

    const { start: startDate } =
      getSriLankaDayRange(START_DATE);

    const { end: selectedDayEnd } =
      getSriLankaDayRange(selectedDate);

    const areas = await Area.find({
      status: "Active",
    })
      .sort({
        name: 1,
      })
      .lean();

    const collections =
      await DailyAreaCollection.find({
        date: {
          $gte: startDate,
          $lt: selectedDayEnd,
        },
      })
        .sort({
          date: 1,
        })
        .lean();

    const areaMap = new Map<
      string,
      {
        areaId: string;
        areaName: string;

        totalTeaWeightKg: number;
        totalFactoryWeightKg: number;
        totalDifferenceKg: number;

        collectionCount: number;

        latestCollectionId?: string;
      }
    >();

    for (const area of areas) {
      areaMap.set(area.areaId, {
        areaId: area.areaId,
        areaName: area.name,

        totalTeaWeightKg: 0,
        totalFactoryWeightKg: 0,
        totalDifferenceKg: 0,

        collectionCount: 0,

        latestCollectionId: undefined,
      });
    }

    for (const collection of collections) {
      const areaId = collection.areaId;

      const areaData = areaMap.get(areaId);

      if (!areaData) {
        continue;
      }

      const teaWeight = Number(
        collection.totalKg || 0
      );

      const factoryWeight = Number(
        collection.factoryWeightKg || 0
      );

      // IMPORTANT:
      // Factory Weight - Tea Weight
      //
      // 50,000 - 40,000 = +10,000
      // 40,000 - 50,000 = -10,000
      // 40,000 - 40,000 = 0
      const difference = Number(
        (factoryWeight - teaWeight).toFixed(2)
      );

      areaData.totalTeaWeightKg += teaWeight;

      areaData.totalFactoryWeightKg +=
        factoryWeight;

      areaData.totalDifferenceKg +=
        difference;

      areaData.collectionCount += 1;

      areaData.latestCollectionId =
        collection.collectionId;
    }

    const dashboardAreas = Array.from(
      areaMap.values()
    ).map((area) => ({
      areaId: area.areaId,
      areaName: area.areaName,

      totalTeaWeightKg: Number(
        area.totalTeaWeightKg.toFixed(2)
      ),

      totalFactoryWeightKg: Number(
        area.totalFactoryWeightKg.toFixed(2)
      ),

      // Factory Weight - Tea Weight
      totalDifferenceKg: Number(
        (
          area.totalFactoryWeightKg -
          area.totalTeaWeightKg
        ).toFixed(2)
      ),

      collectionCount:
        area.collectionCount,

      latestCollectionId:
        area.latestCollectionId,
    }));

    const totalTeaWeightKg =
      dashboardAreas.reduce(
        (total, area) =>
          total + area.totalTeaWeightKg,
        0
      );

    const totalFactoryWeightKg =
      dashboardAreas.reduce(
        (total, area) =>
          total + area.totalFactoryWeightKg,
        0
      );

    // IMPORTANT:
    // Factory Weight - Tea Weight
    const totalDifferenceKg = Number(
      (
        totalFactoryWeightKg -
        totalTeaWeightKg
      ).toFixed(2)
    );

    const totalCollections =
      dashboardAreas.reduce(
        (total, area) =>
          total + area.collectionCount,
        0
      );

    const collectedAreas =
      dashboardAreas.filter(
        (area) =>
          area.collectionCount > 0
      ).length;

    return NextResponse.json(
      {
        success: true,

        date: selectedDate,

        fromDate: START_DATE,

        toDate: selectedDate,

        summary: {
          totalAreas:
            dashboardAreas.length,

          collectedAreas,

          totalTeaWeightKg: Number(
            totalTeaWeightKg.toFixed(2)
          ),

          totalFactoryWeightKg: Number(
            totalFactoryWeightKg.toFixed(2)
          ),

          totalDifferenceKg,

          totalCollections,
        },

        areas: dashboardAreas,
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
      "DASHBOARD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard",

        date: "",

        fromDate: START_DATE,

        toDate: "",

        summary: {
          totalAreas: 0,
          collectedAreas: 0,
          totalTeaWeightKg: 0,
          totalFactoryWeightKg: 0,
          totalDifferenceKg: 0,
          totalCollections: 0,
        },

        areas: [],
      },
      {
        status: 500,
      }
    );
  }
}