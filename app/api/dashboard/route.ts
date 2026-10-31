
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import DailyAreaCollection from "@/models/DailyAreaCollection";

const START_DATE = "2026-10-01";
const TIME_ZONE = "Asia/Colombo";

type Period =
  | "today"
  | "7d"
  | "1m"
  | "3m"
  | "6m"
  | "12m"
  | "all"
  | "custom";

function getTodaySriLanka() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function addMonths(dateString: string, months: number) {
  const [year, month, day] = dateString.split("-").map(Number);

  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  const lastDay = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0)
  ).getUTCDate();

  const targetDay = Math.min(day, lastDay);

  return [
    targetYear,
    String(normalizedMonth + 1).padStart(2, "0"),
    String(targetDay).padStart(2, "0"),
  ].join("-");
}

function getSriLankaDayRange(fromDate: string, toDate: string) {
  const start = new Date(`${fromDate}T00:00:00+05:30`);

  // The end is exclusive, so add one day to the selected end date.
  const end = new Date(
    `${addDays(toDate, 1)}T00:00:00+05:30`
  );

  return { start, end };
}

function getDateRange(
  period: Period,
  today: string,
  customFrom?: string | null,
  customTo?: string | null
) {
  let fromDate = START_DATE;
  let toDate = today;

  switch (period) {
    case "today":
      fromDate = today;
      toDate = today;
      break;

    case "7d":
      fromDate = addDays(today, -6);
      toDate = today;
      break;

    case "1m":
      fromDate = addMonths(today, -1);
      toDate = today;
      break;

    case "3m":
      fromDate = addMonths(today, -3);
      toDate = today;
      break;

    case "6m":
      fromDate = addMonths(today, -6);
      toDate = today;
      break;

    case "12m":
      fromDate = addMonths(today, -12);
      toDate = today;
      break;

    case "custom":
      if (
        !customFrom ||
        !customTo ||
        !isValidDateString(customFrom) ||
        !isValidDateString(customTo)
      ) {
        throw new Error("Please select a valid custom date range.");
      }

      fromDate = customFrom;
      toDate = customTo;
      break;

    case "all":
    default:
      fromDate = START_DATE;
      toDate = today;
      break;
  }

  if (fromDate < START_DATE) {
    fromDate = START_DATE;
  }

  if (toDate > today) {
    toDate = today;
  }

  if (fromDate > toDate) {
    throw new Error("Start date cannot be after end date.");
  }

  return { fromDate, toDate };
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const today = getTodaySriLanka();

    const requestedPeriod = searchParams.get("period");

    const allowedPeriods: Period[] = [
      "today",
      "7d",
      "1m",
      "3m",
      "6m",
      "12m",
      "all",
      "custom",
    ];

    // Backward compatibility:
    // Old dashboard requests /api/dashboard?date=YYYY-MM-DD.
    const period: Period = allowedPeriods.includes(
      requestedPeriod as Period
    )
      ? (requestedPeriod as Period)
      : "all";

    const selectedDate = searchParams.get("date") || today;

    if (!isValidDateString(selectedDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid selected date.",
        },
        { status: 400 }
      );
    }

    const dateRange = getDateRange(
      period,
      selectedDate,
      searchParams.get("from"),
      searchParams.get("to")
    );

    const { fromDate, toDate } = dateRange;

    const {
      start: rangeStart,
      end: rangeEnd,
    } = getSriLankaDayRange(fromDate, toDate);

    const {
      start: selectedDayStart,
      end: selectedDayEnd,
    } = getSriLankaDayRange(selectedDate, selectedDate);

    /* ================================================
       ACTIVE AREAS
    ================================================ */

    const areas = await Area.find({
      status: "Active",
    })
      .sort({ name: 1 })
      .lean();

    /* ================================================
       COLLECTIONS FOR SELECTED PERIOD
    ================================================ */

    const periodCollections =
      await DailyAreaCollection.find({
        date: {
          $gte: rangeStart,
          $lt: rangeEnd,
        },
      })
        .sort({ date: 1 })
        .lean();

    /* ================================================
       COLLECTIONS FOR SELECTED DAY
    ================================================ */

    const selectedDayCollections =
      await DailyAreaCollection.find({
        date: {
          $gte: selectedDayStart,
          $lt: selectedDayEnd,
        },
      })
        .sort({ date: 1 })
        .lean();

    /* ================================================
       PERIOD AREA MAP
    ================================================ */

    const periodAreaMap = new Map<
      string,
      {
        areaId: string;
        areaName: string;
        teaWeightKg: number;
        factoryWeightKg: number;
        differenceKg: number;
        collectionCount: number;
        latestCollectionId?: string;
      }
    >();

    /* ================================================
       SELECTED DAY AREA MAP
    ================================================ */

    const todayAreaMap = new Map<
      string,
      {
        areaId: string;
        areaName: string;
        teaWeightKg: number;
        factoryWeightKg: number;
        collectionCount: number;
        latestCollectionId?: string;
      }
    >();

    for (const area of areas) {
      periodAreaMap.set(area.areaId, {
        areaId: area.areaId,
        areaName: area.name,
        teaWeightKg: 0,
        factoryWeightKg: 0,
        differenceKg: 0,
        collectionCount: 0,
      });

      todayAreaMap.set(area.areaId, {
        areaId: area.areaId,
        areaName: area.name,
        teaWeightKg: 0,
        factoryWeightKg: 0,
        collectionCount: 0,
      });
    }

    /* ================================================
       PROCESS PERIOD COLLECTIONS
    ================================================ */

    for (const collection of periodCollections) {
      const areaData = periodAreaMap.get(collection.areaId);

      if (!areaData) {
        continue;
      }

      const teaWeight = Number(collection.totalKg || 0);
      const factoryWeight = Number(
        collection.factoryWeightKg || 0
      );

      areaData.teaWeightKg += teaWeight;
      areaData.factoryWeightKg += factoryWeight;
      areaData.collectionCount += 1;
      areaData.latestCollectionId = collection.collectionId;
    }

    /* ================================================
       PROCESS SELECTED DAY COLLECTIONS
    ================================================ */

    for (const collection of selectedDayCollections) {
      const areaData = todayAreaMap.get(collection.areaId);

      if (!areaData) {
        continue;
      }

      const teaWeight = Number(collection.totalKg || 0);
      const factoryWeight = Number(
        collection.factoryWeightKg || 0
      );

      areaData.teaWeightKg += teaWeight;
      areaData.factoryWeightKg += factoryWeight;
      areaData.collectionCount += 1;
      areaData.latestCollectionId = collection.collectionId;
    }

    /* ================================================
       PERIOD AREA RESULTS
    ================================================ */

    const dashboardAreas = Array.from(
      periodAreaMap.values()
    ).map((area) => {
      const differenceKg = Number(
        (area.factoryWeightKg - area.teaWeightKg).toFixed(2)
      );

      return {
        areaId: area.areaId,
        areaName: area.areaName,

        teaWeightKg: Number(area.teaWeightKg.toFixed(2)),
        factoryWeightKg: Number(
          area.factoryWeightKg.toFixed(2)
        ),
        differenceKg,

        collectionCount: area.collectionCount,
        latestCollectionId: area.latestCollectionId,

        // Backward-compatible fields for the old dashboard.
        todayTeaWeightKg: Number(
          area.teaWeightKg.toFixed(2)
        ),
        todayFactoryWeightKg: Number(
          area.factoryWeightKg.toFixed(2)
        ),
        todayDifferenceKg: differenceKg,
        todayCollectionCount: area.collectionCount,
      };
    });

    /* ================================================
       PERIOD TOTALS
    ================================================ */

    const totalTeaWeightKg = dashboardAreas.reduce(
      (total, area) => total + area.teaWeightKg,
      0
    );

    const totalFactoryWeightKg = dashboardAreas.reduce(
      (total, area) => total + area.factoryWeightKg,
      0
    );

    const totalDifferenceKg = Number(
      (totalFactoryWeightKg - totalTeaWeightKg).toFixed(2)
    );

    const totalCollections = dashboardAreas.reduce(
      (total, area) => total + area.collectionCount,
      0
    );

    const collectedAreas = dashboardAreas.filter(
      (area) => area.collectionCount > 0
    ).length;

    /* ================================================
       SELECTED DAY TOTALS
    ================================================ */

    const todayAreas = Array.from(todayAreaMap.values());

    const todayTeaWeightKg = todayAreas.reduce(
      (total, area) => total + area.teaWeightKg,
      0
    );

    const todayFactoryWeightKg = todayAreas.reduce(
      (total, area) => total + area.factoryWeightKg,
      0
    );

    const todayDifferenceKg = Number(
      (todayFactoryWeightKg - todayTeaWeightKg).toFixed(2)
    );

    const todayCollectionCount = todayAreas.reduce(
      (total, area) => total + area.collectionCount,
      0
    );

    /* ================================================
       RESPONSE
    ================================================ */

    return NextResponse.json(
      {
        success: true,

        date: selectedDate,

        period,

        fromDate,
        toDate,

        today: {
          teaWeightKg: Number(todayTeaWeightKg.toFixed(2)),
          factoryWeightKg: Number(
            todayFactoryWeightKg.toFixed(2)
          ),
          differenceKg: todayDifferenceKg,
          collectionCount: todayCollectionCount,
        },

        // These summary values now represent the selected period.
        summary: {
          totalAreas: areas.length,
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

        // Area data now represents the selected period.
        areas: dashboardAreas,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("DASHBOARD API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard.",

        date: "",
        period: "all",
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
      { status: 500 }
    );
  }
}
