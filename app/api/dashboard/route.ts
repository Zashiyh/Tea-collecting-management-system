import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import DailyAreaCollection from "@/models/DailyAreaCollection";

const START_DATE = "2026-10-01";

/* =========================================================
   SRI LANKA DAY RANGE
========================================================= */

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

/* =========================================================
   TODAY IN SRI LANKA
========================================================= */

function getTodaySriLanka() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/* =========================================================
   GET DASHBOARD
========================================================= */

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const selectedDate =
      searchParams.get("date") ||
      getTodaySriLanka();

    /* =======================================================
       DATE RANGES
    ======================================================= */

    // Cumulative:
    // 01/10/2026 -> selected date

    const {
      start: cumulativeStart,
    } = getSriLankaDayRange(
      START_DATE
    );

    // Selected date only:
    // 03/10/2026 00:00
    // ->
    // 04/10/2026 00:00

    const {
      start: selectedDayStart,
      end: selectedDayEnd,
    } = getSriLankaDayRange(
      selectedDate
    );

    /* =======================================================
       ACTIVE AREAS
    ======================================================= */

    const areas = await Area.find({
      status: "Active",
    })
      .sort({
        name: 1,
      })
      .lean();

    /* =======================================================
       CUMULATIVE COLLECTIONS
       
       01/10 -> SELECTED DATE
    ======================================================= */

    const cumulativeCollections =
      await DailyAreaCollection.find({
        date: {
          $gte: cumulativeStart,
          $lt: selectedDayEnd,
        },
      })
        .sort({
          date: 1,
        })
        .lean();

    /* =======================================================
       SELECTED DAY COLLECTIONS
       
       ONLY SELECTED DATE
    ======================================================= */

    const todayCollections =
      await DailyAreaCollection.find({
        date: {
          $gte: selectedDayStart,
          $lt: selectedDayEnd,
        },
      })
        .sort({
          date: 1,
        })
        .lean();

    /* =======================================================
       CUMULATIVE AREA MAP
    ======================================================= */

    const cumulativeAreaMap = new Map<
      string,
      {
        areaId: string;
        areaName: string;

        totalTeaWeightKg: number;
        totalFactoryWeightKg: number;

        collectionCount: number;

        latestCollectionId?: string;
      }
    >();

    /* =======================================================
       TODAY AREA MAP
       
       ONLY SELECTED DATE
    ======================================================= */

    const todayAreaMap = new Map<
      string,
      {
        areaId: string;
        areaName: string;

        todayTeaWeightKg: number;
        todayFactoryWeightKg: number;

        todayCollectionCount: number;

        latestCollectionId?: string;
      }
    >();

    /* =======================================================
       CREATE AREA MAPS
    ======================================================= */

    for (const area of areas) {
      /* -----------------------------------------------------
         CUMULATIVE AREA
      ----------------------------------------------------- */

      cumulativeAreaMap.set(
        area.areaId,
        {
          areaId: area.areaId,
          areaName: area.name,

          totalTeaWeightKg: 0,
          totalFactoryWeightKg: 0,

          collectionCount: 0,

          latestCollectionId:
            undefined,
        }
      );

      /* -----------------------------------------------------
         TODAY AREA
      ----------------------------------------------------- */

      todayAreaMap.set(
        area.areaId,
        {
          areaId: area.areaId,
          areaName: area.name,

          todayTeaWeightKg: 0,
          todayFactoryWeightKg: 0,

          todayCollectionCount: 0,

          latestCollectionId:
            undefined,
        }
      );
    }

    /* =======================================================
       PROCESS CUMULATIVE DATA
    ======================================================= */

    for (const collection of cumulativeCollections) {
      const areaId =
        collection.areaId;

      const areaData =
        cumulativeAreaMap.get(
          areaId
        );

      if (!areaData) {
        continue;
      }

      const teaWeight = Number(
        collection.totalKg || 0
      );

      const factoryWeight = Number(
        collection.factoryWeightKg || 0
      );

      areaData.totalTeaWeightKg +=
        teaWeight;

      areaData.totalFactoryWeightKg +=
        factoryWeight;

      areaData.collectionCount += 1;

      areaData.latestCollectionId =
        collection.collectionId;
    }

    /* =======================================================
       PROCESS TODAY DATA
       
       ONLY SELECTED DATE
    ======================================================= */

    for (const collection of todayCollections) {
      const areaId =
        collection.areaId;

      const areaData =
        todayAreaMap.get(
          areaId
        );

      if (!areaData) {
        continue;
      }

      const teaWeight = Number(
        collection.totalKg || 0
      );

      const factoryWeight = Number(
        collection.factoryWeightKg || 0
      );

      areaData.todayTeaWeightKg +=
        teaWeight;

      areaData.todayFactoryWeightKg +=
        factoryWeight;

      areaData.todayCollectionCount +=
        1;

      areaData.latestCollectionId =
        collection.collectionId;
    }

    /* =======================================================
       CUMULATIVE TOTALS
    ======================================================= */

    const cumulativeAreas =
      Array.from(
        cumulativeAreaMap.values()
      );

    const totalTeaWeightKg =
      cumulativeAreas.reduce(
        (total, area) =>
          total +
          area.totalTeaWeightKg,
        0
      );

    const totalFactoryWeightKg =
      cumulativeAreas.reduce(
        (total, area) =>
          total +
          area.totalFactoryWeightKg,
        0
      );

    const totalDifferenceKg =
      Number(
        (
          totalFactoryWeightKg -
          totalTeaWeightKg
        ).toFixed(2)
      );

    const totalCollections =
      cumulativeAreas.reduce(
        (total, area) =>
          total +
          area.collectionCount,
        0
      );

    /* =======================================================
       TODAY TOTALS
    ======================================================= */

    const todayAreas =
      Array.from(
        todayAreaMap.values()
      );

    const todayTeaWeightKg =
      todayAreas.reduce(
        (total, area) =>
          total +
          area.todayTeaWeightKg,
        0
      );

    const todayFactoryWeightKg =
      todayAreas.reduce(
        (total, area) =>
          total +
          area.todayFactoryWeightKg,
        0
      );

    const todayDifferenceKg =
      Number(
        (
          todayFactoryWeightKg -
          todayTeaWeightKg
        ).toFixed(2)
      );

    const todayCollectionCount =
      todayAreas.reduce(
        (total, area) =>
          total +
          area.todayCollectionCount,
        0
      );

    /* =======================================================
       TODAY AREA DATA
       
       IMPORTANT:
       THESE ARE SELECTED-DATE VALUES ONLY
    ======================================================= */

    const dashboardAreas =
      todayAreas.map((area) => {
        const difference =
          Number(
            (
              area.todayFactoryWeightKg -
              area.todayTeaWeightKg
            ).toFixed(2)
          );

        return {
          areaId:
            area.areaId,

          areaName:
            area.areaName,

          todayTeaWeightKg:
            Number(
              area.todayTeaWeightKg.toFixed(
                2
              )
            ),

          todayFactoryWeightKg:
            Number(
              area.todayFactoryWeightKg.toFixed(
                2
              )
            ),

          todayDifferenceKg:
            difference,

          todayCollectionCount:
            area.todayCollectionCount,

          latestCollectionId:
            area.latestCollectionId,
        };
      });

    /* =======================================================
       COLLECTED AREAS
       
       TODAY ONLY
    ======================================================= */

    const collectedAreas =
      dashboardAreas.filter(
        (area) =>
          area.todayCollectionCount > 0
      ).length;

    /* =======================================================
       RESPONSE
    ======================================================= */

    return NextResponse.json(
      {
        success: true,

        /* SELECTED DATE */

        date: selectedDate,

        /* CUMULATIVE PERIOD */

        fromDate: START_DATE,

        toDate: selectedDate,

        /* =================================================
           TODAY / SELECTED DATE
        ================================================= */

        today: {
          teaWeightKg: Number(
            todayTeaWeightKg.toFixed(2)
          ),

          factoryWeightKg: Number(
            todayFactoryWeightKg.toFixed(2)
          ),

          differenceKg:
            todayDifferenceKg,

          collectionCount:
            todayCollectionCount,
        },

        /* =================================================
           CUMULATIVE SUMMARY
           
           01/10 -> SELECTED DATE
        ================================================= */

        summary: {
          totalAreas:
            areas.length,

          collectedAreas,

          totalTeaWeightKg:
            Number(
              totalTeaWeightKg.toFixed(2)
            ),

          totalFactoryWeightKg:
            Number(
              totalFactoryWeightKg.toFixed(2)
            ),

          totalDifferenceKg,

          totalCollections,
        },

        /* =================================================
           AREA DATA
           
           SELECTED DATE ONLY
        ================================================= */

        areas:
          dashboardAreas,
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

        today: {
          teaWeightKg: 0,
          factoryWeightKg: 0,
          differenceKg: 0,
          collectionCount: 0,
        },

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