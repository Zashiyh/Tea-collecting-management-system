import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Area from "@/models/Area";
import Supplier from "@/models/Supplier";
import DailyAreaCollection from "@/models/DailyAreaCollection";
import SupplierTeaCollection from "@/models/SupplierTeaCollection";

/* =====================================================
   SRI LANKA DATE HELPERS
===================================================== */

function getSriLankaDate(
  date = new Date()
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Colombo",
    }
  ).format(date);
}

function getSriLankaDateParts(
  date = new Date()
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(date);

  const year = Number(
    parts.find(
      (part) =>
        part.type === "year"
    )?.value
  );

  const month = Number(
    parts.find(
      (part) =>
        part.type === "month"
    )?.value
  );

  const day = Number(
    parts.find(
      (part) =>
        part.type === "day"
    )?.value
  );

  return {
    year,
    month,
    day,
  };
}

function sriLankaDateToUTC(
  year: number,
  month: number,
  day: number
) {
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0
    ) -
      5.5 *
        60 *
        60 *
        1000
  );
}

function addDays(
  date: Date,
  days: number
) {
  const result =
    new Date(date);

  result.setUTCDate(
    result.getUTCDate() + days
  );

  return result;
}

/* =====================================================
   DASHBOARD GET
===================================================== */

export async function GET() {
  try {
    await connectDB();

    const now =
      new Date();

    const {
      year,
      month,
      day,
    } =
      getSriLankaDateParts(
        now
      );

    /* =================================================
       DATE RANGES
    ================================================= */

    const todayStart =
      sriLankaDateToUTC(
        year,
        month,
        day
      );

    const tomorrowStart =
      addDays(
        todayStart,
        1
      );

    const monthStart =
      sriLankaDateToUTC(
        year,
        month,
        1
      );

    const nextMonthStart =
      month === 12
        ? sriLankaDateToUTC(
            year + 1,
            1,
            1
          )
        : sriLankaDateToUTC(
            year,
            month + 1,
            1
          );

    const sevenDaysAgo =
      addDays(
        todayStart,
        -6
      );

    /* =================================================
       TODAY'S AREA COLLECTION
    ================================================= */

    const todayCollections =
      await DailyAreaCollection.find(
        {
          date: {
            $gte: todayStart,
            $lt: tomorrowStart,
          },
        }
      )
        .sort({
          date: -1,
        })
        .lean();

    /*
     * Main collection is area-wise.
     *
     * Example:
     * Area 1 = 5,000 KG
     * Area 2 = 20,000 KG
     */

    const todayKg =
      todayCollections.reduce(
        (sum, item) =>
          sum +
          Number(
            item.totalKg || 0
          ),
        0
      );

    const todayAreaIds =
      new Set(
        todayCollections.map(
          (item) =>
            item.areaId
        )
      );

    const todayAreas =
      todayAreaIds.size;

    /* =================================================
       TODAY'S SUPPLIER CONTRIBUTIONS
    ================================================= */

    const todayContributions =
      await SupplierTeaCollection.find(
        {
          date: {
            $gte: todayStart,
            $lt: tomorrowStart,
          },
        }
      ).lean();

    const todaySupplierIds =
      new Set(
        todayContributions.map(
          (item) =>
            item.supplierId
        )
      );

    const todaySuppliers =
      todaySupplierIds.size;

    /*
     * Payments / rates are not part
     * of the new collection flow yet.
     */

    const todayValue = 0;

    /* =================================================
       MONTHLY AREA COLLECTION
    ================================================= */

    const monthlyCollections =
      await DailyAreaCollection.find(
        {
          date: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        }
      )
        .sort({
          date: -1,
        })
        .lean();

    const monthlyKg =
      monthlyCollections.reduce(
        (sum, item) =>
          sum +
          Number(
            item.totalKg || 0
          ),
        0
      );

    const monthlyAreaIds =
      new Set(
        monthlyCollections.map(
          (item) =>
            item.areaId
        )
      );

    const monthlyAreas =
      monthlyAreaIds.size;

    /* =================================================
       MONTHLY SUPPLIER CONTRIBUTIONS
    ================================================= */

    const monthlyContributions =
      await SupplierTeaCollection.find(
        {
          date: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        }
      ).lean();

    const monthlySupplierIds =
      new Set(
        monthlyContributions.map(
          (item) =>
            item.supplierId
        )
      );

    const monthlySuppliers =
      monthlySupplierIds.size;

    const monthlyValue = 0;

    /* =================================================
       AREA / SUPPLIER COUNTS
    ================================================= */

    const [
      totalAreas,
      activeAreas,
      totalSuppliers,
      activeSuppliers,
    ] =
      await Promise.all([
        Area.countDocuments(),

        Area.countDocuments({
          status: "Active",
        }),

        Supplier.countDocuments(),

        Supplier.countDocuments({
          status: "Active",
        }),
      ]);

    /* =================================================
       LAST 7 DAYS
    ================================================= */

    const sevenDayCollections =
      await DailyAreaCollection.find(
        {
          date: {
            $gte:
              sevenDaysAgo,

            $lt:
              tomorrowStart,
          },
        }
      )
        .sort({
          date: 1,
        })
        .lean();

    const dailyMap =
      new Map<
        string,
        number
      >();

    /*
     * Create all 7 dates first.
     */

    for (
      let i = 0;
      i < 7;
      i++
    ) {
      const currentDate =
        addDays(
          sevenDaysAgo,
          i
        );

      const dateKey =
        getSriLankaDate(
          currentDate
        );

      dailyMap.set(
        dateKey,
        0
      );
    }

    /*
     * Add area totals.
     */

    for (
      const collection of
        sevenDayCollections
    ) {
      const dateKey =
        getSriLankaDate(
          new Date(
            collection.date
          )
        );

      const current =
        dailyMap.get(
          dateKey
        ) || 0;

      dailyMap.set(
        dateKey,
        current +
          Number(
            collection.totalKg ||
              0
          )
      );
    }

    const dailyData =
      Array.from(
        dailyMap.entries()
      ).map(
        ([date, kg]) => {
          const dateObject =
            new Date(
              `${date}T00:00:00+05:30`
            );

          return {
            date,

            day: new Intl.DateTimeFormat(
              "en-US",
              {
                timeZone:
                  "Asia/Colombo",

                day: "2-digit",
              }
            ).format(
              dateObject
            ),

            kg,
          };
        }
      );

    /* =================================================
       RECENT AREA COLLECTIONS
    ================================================= */

    const recentCollections =
      await DailyAreaCollection.find(
        {}
      )
        .sort({
          date: -1,
          createdAt: -1,
        })
        .limit(8)
        .lean();

    const formattedRecent =
      recentCollections.map(
        (collection) => ({
          id:
            collection.collectionId,

          /*
           * New system is area-wise.
           * Supplier is added later.
           */
          supplier:
            "Area Collection",

          supplierId:
            "",

          area:
            collection.areaName,

          areaId:
            collection.areaId,

          kg:
            Number(
              collection.totalKg ||
                0
            ),

          /*
           * Rate/payment
           * will be added later.
           */
          rate: 0,

          amount: 0,

          date:
            collection.date,
        })
      );

    /* =================================================
       AVERAGE DAILY
    ================================================= */

    const daysPassed =
      Math.max(
        1,

        Math.ceil(
          (now.getTime() -
            monthStart.getTime()) /
            (1000 *
              60 *
              60 *
              24)
        )
      );

    const averageDaily =
      monthlyKg /
      daysPassed;

    /* =================================================
       RESPONSE
    ================================================= */

    return NextResponse.json({
      success: true,

      date: {
        today:
          getSriLankaDate(
            now
          ),

        year,

        month,

        day,
      },

      stats: {
        todayKg,

        todayAreas,

        todaySuppliers,

        todayValue,

        monthlyKg,

        monthlyAreas,

        totalAreas,

        activeAreas,

        totalSuppliers,

        activeSuppliers,

        monthlySuppliers,

        monthlyValue,

        averageDaily,
      },

      dailyData,

      recentCollections:
        formattedRecent,
    });
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
            : "Failed to load dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}