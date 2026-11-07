import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import DailyAreaCollection from "@/models/DailyAreaCollection";

const START_DATE = "2026-10-01";

/* =========================================================
   SRI LANKA DAY RANGE
========================================================= */

function getSriLankaDayRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getTodaySriLanka() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function getCalendarMonthRange(selectedDate: string) {
  const [year, month] = selectedDate.split("-").map(Number);

  const monthStartString = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonthStartString = `${nextMonthDate.getUTCFullYear()}-${String(
    nextMonthDate.getUTCMonth() + 1
  ).padStart(2, "0")}-01`;
  const lastDayDate = new Date(nextMonthDate.getTime() - 24 * 60 * 60 * 1000);
  const lastDayString = `${lastDayDate.getUTCFullYear()}-${String(
    lastDayDate.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(lastDayDate.getUTCDate()).padStart(2, "0")}`;

  // Do not include dates before the system's configured start date.
  const effectiveStartString =
    monthStartString < START_DATE ? START_DATE : monthStartString;

  return {
    fromDate: effectiveStartString,
    toDate: lastDayString,
    start: getSriLankaDayRange(effectiveStartString).start,
    end: getSriLankaDayRange(nextMonthStartString).start,
  };
}

/* =========================================================
   GET DASHBOARD
========================================================= */

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get("date") || getTodaySriLanka();
    const selectedDate = isValidDateString(requestedDate)
      ? requestedDate
      : getTodaySriLanka();

    /* =======================================================
       DATE RANGES
    ======================================================= */

    const cumulativeStart = getSriLankaDayRange(START_DATE).start;
    const { start: selectedDayStart, end: selectedDayEnd } =
      getSriLankaDayRange(selectedDate);

    // Calendar month containing the selected date.
    // Example: selecting 2026-11-07 calculates November totals.
    const monthRange = getCalendarMonthRange(selectedDate);

    /* =======================================================
       ACTIVE AREAS
    ======================================================= */

    const areas = await Area.find({ status: "Active" })
      .sort({ name: 1 })
      .lean();

    /* =======================================================
       COLLECTION QUERIES
    ======================================================= */

    const [cumulativeCollections, todayCollections, monthCollections] =
      await Promise.all([
        DailyAreaCollection.find({
          date: { $gte: cumulativeStart, $lt: selectedDayEnd },
        })
          .sort({ date: 1 })
          .lean(),

        DailyAreaCollection.find({
          date: { $gte: selectedDayStart, $lt: selectedDayEnd },
        })
          .sort({ date: 1 })
          .lean(),

        DailyAreaCollection.find({
          date: { $gte: monthRange.start, $lt: monthRange.end },
        })
          .sort({ date: 1 })
          .lean(),
      ]);

    /* =======================================================
       AREA MAPS
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

    for (const area of areas) {
      cumulativeAreaMap.set(area.areaId, {
        areaId: area.areaId,
        areaName: area.name,
        totalTeaWeightKg: 0,
        totalFactoryWeightKg: 0,
        collectionCount: 0,
        latestCollectionId: undefined,
      });

      todayAreaMap.set(area.areaId, {
        areaId: area.areaId,
        areaName: area.name,
        todayTeaWeightKg: 0,
        todayFactoryWeightKg: 0,
        todayCollectionCount: 0,
        latestCollectionId: undefined,
      });
    }

    /* =======================================================
       PROCESS CUMULATIVE COLLECTIONS
    ======================================================= */

    for (const collection of cumulativeCollections) {
      const areaData = cumulativeAreaMap.get(collection.areaId);
      if (!areaData) continue;

      areaData.totalTeaWeightKg += Number(collection.totalKg || 0);
      areaData.totalFactoryWeightKg += Number(
        collection.factoryWeightKg || 0
      );
      areaData.collectionCount += 1;
      areaData.latestCollectionId = collection.collectionId;
    }

    /* =======================================================
       PROCESS SELECTED-DATE COLLECTIONS
    ======================================================= */

    for (const collection of todayCollections) {
      const areaData = todayAreaMap.get(collection.areaId);
      if (!areaData) continue;

      areaData.todayTeaWeightKg += Number(collection.totalKg || 0);
      areaData.todayFactoryWeightKg += Number(
        collection.factoryWeightKg || 0
      );
      areaData.todayCollectionCount += 1;
      areaData.latestCollectionId = collection.collectionId;
    }

    /* =======================================================
       CUMULATIVE TOTALS: START DATE -> SELECTED DATE
    ======================================================= */

    const cumulativeAreas = Array.from(cumulativeAreaMap.values());

    const totalTeaWeightKg = cumulativeAreas.reduce(
      (total, area) => total + area.totalTeaWeightKg,
      0
    );

    const totalFactoryWeightKg = cumulativeAreas.reduce(
      (total, area) => total + area.totalFactoryWeightKg,
      0
    );

    const totalDifferenceKg = Number(
      (totalFactoryWeightKg - totalTeaWeightKg).toFixed(2)
    );

    const totalCollections = cumulativeAreas.reduce(
      (total, area) => total + area.collectionCount,
      0
    );

    /* =======================================================
       SELECTED-DATE TOTALS
    ======================================================= */

    const todayAreas = Array.from(todayAreaMap.values());

    const todayTeaWeightKg = todayAreas.reduce(
      (total, area) => total + area.todayTeaWeightKg,
      0
    );

    const todayFactoryWeightKg = todayAreas.reduce(
      (total, area) => total + area.todayFactoryWeightKg,
      0
    );

    const todayDifferenceKg = Number(
      (todayFactoryWeightKg - todayTeaWeightKg).toFixed(2)
    );

    const todayCollectionCount = todayAreas.reduce(
      (total, area) => total + area.todayCollectionCount,
      0
    );

    /* =======================================================
       SELECTED MONTH TOTALS

       Full calendar month containing selectedDate.
       The query includes all records in that calendar month.
    ======================================================= */

    const monthTotals = monthCollections.reduce(
      (totals, collection) => {
        totals.totalTeaWeightKg += Number(collection.totalKg || 0);
        totals.totalFactoryWeightKg += Number(
          collection.factoryWeightKg || 0
        );
        totals.totalCollections += 1;
        return totals;
      },
      {
        totalTeaWeightKg: 0,
        totalFactoryWeightKg: 0,
        totalCollections: 0,
      }
    );

    const monthSummary = {
      fromDate: monthRange.fromDate,
      toDate: selectedDate,
      totalTeaWeightKg: Number(monthTotals.totalTeaWeightKg.toFixed(2)),
      totalFactoryWeightKg: Number(
        monthTotals.totalFactoryWeightKg.toFixed(2)
      ),
      totalDifferenceKg: Number(
        (
          monthTotals.totalFactoryWeightKg -
          monthTotals.totalTeaWeightKg
        ).toFixed(2)
      ),
      totalCollections: monthTotals.totalCollections,
    };

    /* =======================================================
       SELECTED-DATE AREA DATA
    ======================================================= */

    const dashboardAreas = todayAreas.map((area) => ({
      areaId: area.areaId,
      areaName: area.areaName,
      todayTeaWeightKg: Number(area.todayTeaWeightKg.toFixed(2)),
      todayFactoryWeightKg: Number(area.todayFactoryWeightKg.toFixed(2)),
      todayDifferenceKg: Number(
        (area.todayFactoryWeightKg - area.todayTeaWeightKg).toFixed(2)
      ),
      todayCollectionCount: area.todayCollectionCount,
      latestCollectionId: area.latestCollectionId,
    }));

    const collectedAreas = dashboardAreas.filter(
      (area) => area.todayCollectionCount > 0
    ).length;

    /* =======================================================
       RESPONSE
    ======================================================= */

    return NextResponse.json(
      {
        success: true,
        date: selectedDate,
        fromDate: START_DATE,
        toDate: selectedDate,

        today: {
          teaWeightKg: Number(todayTeaWeightKg.toFixed(2)),
          factoryWeightKg: Number(todayFactoryWeightKg.toFixed(2)),
          differenceKg: todayDifferenceKg,
          collectionCount: todayCollectionCount,
        },

        // Existing cumulative summary is preserved.
        summary: {
          totalAreas: areas.length,
          collectedAreas,
          totalTeaWeightKg: Number(totalTeaWeightKg.toFixed(2)),
          totalFactoryWeightKg: Number(totalFactoryWeightKg.toFixed(2)),
          totalDifferenceKg,
          totalCollections,
        },

        // New calendar-month totals for the Period Totals cards.
        monthSummary,

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
        monthSummary: {
          fromDate: "",
          toDate: "",
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
