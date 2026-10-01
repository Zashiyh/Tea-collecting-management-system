import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import Supplier from "@/models/Supplier";
import TeaCollection from "@/models/TeaCollection";

function getSriLankaDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET() {
  try {
    await connectDB();

    const today = getSriLankaDateString();

    const todayStart = new Date(`${today}T00:00:00+05:30`);

    const tomorrowStart = new Date(
      todayStart.getTime() + 24 * 60 * 60 * 1000
    );

    const areas = await Area.find({
      status: "Active",
    })
      .sort({ name: 1 })
      .lean();

    const result = await Promise.all(
      areas.map(async (area) => {
        const suppliers = await Supplier.find({
          areaId: area.areaId,
          status: "Active",
        })
          .select("supplierId name")
          .lean();

        const totalStats = await TeaCollection.aggregate([
          {
            $match: {
              areaId: area.areaId,
            },
          },
          {
            $group: {
              _id: null,
              totalKg: {
                $sum: "$weightKg",
              },
              totalValue: {
                $sum: "$totalAmount",
              },
            },
          },
        ]);

        const todayStats = await TeaCollection.aggregate([
          {
            $match: {
              areaId: area.areaId,
              date: {
                $gte: todayStart,
                $lt: tomorrowStart,
              },
            },
          },
          {
            $group: {
              _id: null,
              todayKg: {
                $sum: "$weightKg",
              },
              todayValue: {
                $sum: "$totalAmount",
              },
            },
          },
        ]);

        const latestCollection = await TeaCollection.findOne({
          areaId: area.areaId,
        })
          .sort({
            date: -1,
            createdAt: -1,
          })
          .select("date")
          .lean();

        return {
          areaId: area.areaId,
          name: area.name,
          description: area.description || "",
          status: area.status,

          supplierCount: suppliers.length,

          totalKg: totalStats[0]?.totalKg || 0,
          totalValue: totalStats[0]?.totalValue || 0,

          todayKg: todayStats[0]?.todayKg || 0,
          todayValue: todayStats[0]?.todayValue || 0,

          latestCollectionDate:
            latestCollection?.date || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      areas: result,
    });
  } catch (error) {
    console.error("GET /api/collections/areas ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load collection areas",
      },
      {
        status: 500,
      }
    );
  }
}