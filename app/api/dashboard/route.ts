import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import Supplier from "@/models/Supplier";
import TeaCollection from "@/models/TeaCollection";

function getSriLankaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
  }).format(date);
}

function getSriLankaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  const day = Number(
    parts.find((part) => part.type === "day")?.value
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
    Date.UTC(year, month - 1, day, 0, 0, 0) -
      5.5 * 60 * 60 * 1000
  );
}

function addDays(
  date: Date,
  days: number
) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    const {
      year,
      month,
      day,
    } = getSriLankaDateParts(now);

    // Sri Lanka today
    const todayStart = sriLankaDateToUTC(
      year,
      month,
      day
    );

    const tomorrowStart = addDays(
      todayStart,
      1
    );

    // Current month
    const monthStart = sriLankaDateToUTC(
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

    // Last 7 days
    const sevenDaysAgo = addDays(
      todayStart,
      -6
    );

    /*
     * ----------------------------------------
     * TODAY'S COLLECTION
     * ----------------------------------------
     */

    const todayCollections =
      await TeaCollection.find({
        date: {
          $gte: todayStart,
          $lt: tomorrowStart,
        },
      })
        .sort({ date: -1 })
        .lean();

    const todayKg =
      todayCollections.reduce(
        (sum, item) =>
          sum + Number(item.weightKg || 0),
        0
      );

    const todayValue =
      todayCollections.reduce(
        (sum, item) =>
          sum + Number(item.totalAmount || 0),
        0
      );

    const todaySupplierIds =
      new Set(
        todayCollections.map(
          (item) => item.supplierId
        )
      );

    const todaySuppliers =
      todaySupplierIds.size;

    /*
     * ----------------------------------------
     * MONTHLY COLLECTION
     * ----------------------------------------
     */

    const monthlyCollections =
      await TeaCollection.find({
        date: {
          $gte: monthStart,
          $lt: nextMonthStart,
        },
      })
        .sort({ date: -1 })
        .lean();

    const monthlyKg =
      monthlyCollections.reduce(
        (sum, item) =>
          sum + Number(item.weightKg || 0),
        0
      );

    const monthlyValue =
      monthlyCollections.reduce(
        (sum, item) =>
          sum + Number(item.totalAmount || 0),
        0
      );

    const monthlySupplierIds =
      new Set(
        monthlyCollections.map(
          (item) => item.supplierId
        )
      );

    const monthlySuppliers =
      monthlySupplierIds.size;

    /*
     * ----------------------------------------
     * TOTAL / ACTIVE DATA
     * ----------------------------------------
     */

    const [
      totalAreas,
      activeAreas,
      totalSuppliers,
      activeSuppliers,
    ] = await Promise.all([
      Area.countDocuments(),

      Area.countDocuments({
        status: "Active",
      }),

      Supplier.countDocuments(),

      Supplier.countDocuments({
        status: "Active",
      }),
    ]);

    /*
     * ----------------------------------------
     * LAST 7 DAYS
     * ----------------------------------------
     */

    const sevenDayCollections =
      await TeaCollection.find({
        date: {
          $gte: sevenDaysAgo,
          $lt: tomorrowStart,
        },
      })
        .sort({ date: 1 })
        .lean();

    const dailyMap = new Map<
      string,
      number
    >();

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(
        sevenDaysAgo,
        i
      );

      const dateKey =
        getSriLankaDate(currentDate);

      dailyMap.set(dateKey, 0);
    }

    for (const collection of sevenDayCollections) {
      const dateKey =
        getSriLankaDate(
          new Date(collection.date)
        );

      const current =
        dailyMap.get(dateKey) || 0;

      dailyMap.set(
        dateKey,
        current +
          Number(
            collection.weightKg || 0
          )
      );
    }

    const dailyData = Array.from(
      dailyMap.entries()
    ).map(([date, kg]) => {
      const dateObject = new Date(
        `${date}T00:00:00+05:30`
      );

      return {
        date,
        day: new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone: "Asia/Colombo",
            day: "2-digit",
          }
        ).format(dateObject),
        kg,
      };
    });

    /*
     * ----------------------------------------
     * RECENT COLLECTIONS
     * ----------------------------------------
     */

    const recentCollections =
      await TeaCollection.find({})
        .sort({ date: -1, createdAt: -1 })
        .limit(8)
        .lean();

    const formattedRecent =
      recentCollections.map(
        (collection) => ({
          id: collection.collectionId,
          supplier:
            collection.supplierName,
          supplierId:
            collection.supplierId,
          area: collection.areaName,
          areaId: collection.areaId,
          kg: Number(
            collection.weightKg || 0
          ),
          rate: Number(
            collection.ratePerKg || 0
          ),
          amount: Number(
            collection.totalAmount || 0
          ),
          date: collection.date,
        })
      );

    /*
     * ----------------------------------------
     * AVERAGE DAILY
     * ----------------------------------------
     */

    const daysPassed = Math.max(
      1,
      Math.ceil(
        (now.getTime() -
          monthStart.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const averageDaily =
      monthlyKg / daysPassed;

    /*
     * ----------------------------------------
     * RESPONSE
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      date: {
        today: getSriLankaDate(now),
        year,
        month,
        day,
      },

      stats: {
        todayKg,
        todaySuppliers,
        todayValue,
        monthlyKg,
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
      "Dashboard API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}