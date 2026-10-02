import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import Supplier from "@/models/Supplier";
import DailyAreaCollection from "@/models/DailyAreaCollection";

/* =====================================================
   SRI LANKA DATE HELPERS
===================================================== */

function getTodaySriLanka(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year =
    parts.find((part) => part.type === "year")?.value ?? "";

  const month =
    parts.find((part) => part.type === "month")?.value ?? "";

  const day =
    parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

/* =====================================================
   CREATE SRI LANKA DAY RANGE
===================================================== */

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

/* =====================================================
   DASHBOARD GET
===================================================== */

export async function GET(request: Request) {
  try {
    /* =================================================
       DATABASE
    ================================================= */

    await connectDB();

    /* =================================================
       SELECTED DATE
    ================================================= */

    const { searchParams } =
      new URL(request.url);

    const requestedDate =
      searchParams.get("date");

    const selectedDate =
      requestedDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(
        requestedDate
      )
        ? requestedDate
        : getTodaySriLanka();

    const {
      start,
      end,
    } =
      getSriLankaDayRange(
        selectedDate
      );

    console.log(
      "DASHBOARD DATE:",
      selectedDate
    );

    console.log(
      "DASHBOARD START:",
      start.toISOString()
    );

    console.log(
      "DASHBOARD END:",
      end.toISOString()
    );

    /* =================================================
       GET ALL ACTIVE AREAS
    ================================================= */

    const areas =
      await Area.find({
        status: "Active",
      })
        .sort({
          name: 1,
        })
        .lean();

    console.log(
      "ACTIVE AREAS:",
      areas.length
    );

    /* =================================================
       GET COLLECTIONS FOR SELECTED DATE
    ================================================= */

    const collections =
      await DailyAreaCollection.find({
        date: {
          $gte: start,
          $lt: end,
        },
      })
        .sort({
          areaName: 1,
        })
        .lean();

    console.log(
      "DATE COLLECTIONS:",
      collections.length
    );

    /* =================================================
       CREATE AREA COLLECTION MAP
    ================================================= */

    const collectionMap =
      new Map<
        string,
        (typeof collections)[number]
      >();

    for (
      const collection of collections
    ) {
      collectionMap.set(
        collection.areaId,
        collection
      );
    }

    /* =================================================
       BUILD AREA DATA
    ================================================= */

    const areaResults =
      areas.map((area) => {
        const collection =
          collectionMap.get(
            area.areaId
          );

        const teaWeightKg =
          collection
            ? Number(
                collection.totalKg || 0
              )
            : 0;

        const factoryWeightKg =
          collection
            ? Number(
                collection.factoryWeightKg ||
                  0
              )
            : 0;

        const differenceKg =
          collection
            ? Number(
                collection.differenceKg ??
                  teaWeightKg -
                    factoryWeightKg
              )
            : 0;

        return {
          areaId:
            area.areaId,

          areaName:
            area.name,

          teaWeightKg,

          factoryWeightKg,

          differenceKg,

          collectionId:
            collection?.collectionId,
        };
      });

    /* =================================================
       CALCULATE TOTALS
    ================================================= */

    const totalTeaWeightKg =
      areaResults.reduce(
        (
          total,
          area
        ) =>
          total +
          Number(
            area.teaWeightKg || 0
          ),
        0
      );

    const totalFactoryWeightKg =
      areaResults.reduce(
        (
          total,
          area
        ) =>
          total +
          Number(
            area.factoryWeightKg || 0
          ),
        0
      );

    const totalDifferenceKg =
      areaResults.reduce(
        (
          total,
          area
        ) =>
          total +
          Number(
            area.differenceKg || 0
          ),
        0
      );

    /* =================================================
       COLLECTED AREAS
    ================================================= */

    const collectedAreas =
      areaResults.filter(
        (area) =>
          Boolean(
            area.collectionId
          )
      ).length;

    /* =================================================
       SUPPLIER COUNT
    ================================================= */

    const totalSuppliers =
      await Supplier.countDocuments({
        status: "Active",
      });

    /* =================================================
       FINAL RESPONSE
    ================================================= */

    const response = {
      success: true,

      date: selectedDate,

      summary: {
        totalAreas:
          areas.length,

        collectedAreas,

        totalTeaWeightKg,

        totalFactoryWeightKg,

        totalDifferenceKg,

        totalSuppliers,
      },

      areas:
        areaResults,
    };

    console.log(
      "DASHBOARD RESPONSE:",
      JSON.stringify(
        response,
        null,
        2
      )
    );

    return NextResponse.json(
      response,
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
      "================================="
    );

    console.error(
      "DASHBOARD API ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data",

        areas: [],

        summary: {
          totalAreas: 0,
          collectedAreas: 0,
          totalTeaWeightKg: 0,
          totalFactoryWeightKg: 0,
          totalDifferenceKg: 0,
          totalSuppliers: 0,
        },
      },
      {
        status: 500,
      }
    );
  }
}