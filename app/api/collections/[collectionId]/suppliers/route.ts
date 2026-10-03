import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import Supplier from "@/models/Supplier";
import SupplierTeaCollection from "@/models/SupplierTeaCollection";

interface RouteContext {
  params: Promise<{
    collectionId: string;
  }>;
}

async function getDailyCollection(
  collectionId: string
) {
  await connectDB();

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(
      "MongoDB database connection not available"
    );
  }

  const collection =
    db.collection(
      "dailyareacollections"
    );

  return collection.findOne({
    collectionId,
  });
}

/* =================================
   GET SUPPLIER CONTRIBUTIONS
================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAuth();

    const { collectionId } =
      await context.params;

    const dailyCollection =
      await getDailyCollection(
        collectionId
      );

    if (!dailyCollection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tea collection not found",
        },
        { status: 404 }
      );
    }

    const contributions =
      await SupplierTeaCollection.find({
        areaId:
          dailyCollection.areaId,
        date: dailyCollection.date,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    const supplierTotal =
      contributions.reduce(
        (sum, item) =>
          sum +
          Number(
            item.weightKg || 0
          ),
        0
      );

    const areaTotal =
      Number(
        dailyCollection.totalKg || 0
      );

    const difference =
      areaTotal - supplierTotal;

    return NextResponse.json({
      success: true,

      collection: {
        collectionId:
          dailyCollection.collectionId,

        date:
          dailyCollection.date,

        areaId:
          dailyCollection.areaId,

        areaName:
          dailyCollection.areaName,

        totalKg:
          areaTotal,
      },

      contributions:
        contributions.map(
          (item) => ({
            _id:
              String(item._id),

            contributionId:
              item.contributionId,

            date:
              item.date,

            areaId:
              item.areaId,

            areaName:
              item.areaName,

            supplierId:
              item.supplierId,

            supplierName:
              item.supplierName,

            weightKg:
              Number(
                item.weightKg || 0
              ),

            notes:
              item.notes || "",

            createdAt:
              item.createdAt,

            updatedAt:
              item.updatedAt,
          })
        ),

      summary: {
        areaTotalKg:
          areaTotal,

        supplierTotalKg:
          supplierTotal,

        differenceKg:
          difference,

        status:
          difference === 0
            ? "Matched"
            : difference > 0
            ? "Remaining"
            : "Over",
      },
    });
  } catch (error) {
    console.error(
      "GET SUPPLIER CONTRIBUTIONS ERROR:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
          contributions: [],
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load supplier contributions",
      },
      { status: 500 }
    );
  }
}

/* =================================
   POST SUPPLIER CONTRIBUTION
================================= */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAuth();

    const { collectionId } =
      await context.params;

    const body =
      await request.json();

    const supplierId =
      String(
        body.supplierId || ""
      ).trim();

    const weightKg =
      Number(body.weightKg);

    const notes =
      String(
        body.notes || ""
      ).trim();

    if (!supplierId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a supplier",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(weightKg) ||
      weightKg <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supplier tea KG must be greater than 0",
        },
        { status: 400 }
      );
    }

    const dailyCollection =
      await getDailyCollection(
        collectionId
      );

    if (!dailyCollection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tea collection not found",
        },
        { status: 404 }
      );
    }

    const supplier =
      await Supplier.findOne({
        supplierId,
        areaId:
          dailyCollection.areaId,
        status: "Active",
      }).lean();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Active supplier not found in this area",
        },
        { status: 404 }
      );
    }

    /*
      Check if this supplier already
      has a contribution for this
      area/date.
    */

    const existing =
      await SupplierTeaCollection.findOne(
        {
          supplierId:
            supplier.supplierId,

          areaId:
            dailyCollection.areaId,

          date:
            dailyCollection.date,
        }
      );

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This supplier already has a tea contribution for this collection date.",
        },
        { status: 409 }
      );
    }

    /*
      Generate contribution ID
    */

    const last =
      await SupplierTeaCollection.findOne(
        {}
      )
        .sort({
          createdAt: -1,
        })
        .lean();

    let nextNumber = 1;

    if (
      last &&
      typeof last.contributionId ===
        "string"
    ) {
      const match =
        last.contributionId.match(
          /SUP-COL-(\d+)/
        );

      if (match) {
        nextNumber =
          Number(match[1]) + 1;
      }
    }

    const contributionId =
      `SUP-COL-${String(
        nextNumber
      ).padStart(4, "0")}`;

    const created =
      await SupplierTeaCollection.create(
        {
          contributionId,

          date:
            dailyCollection.date,

          areaId:
            dailyCollection.areaId,

          areaName:
            dailyCollection.areaName,

          supplierId:
            supplier.supplierId,

          supplierName:
            supplier.name,

          weightKg,

          notes,
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Supplier tea contribution added successfully",

        contribution: {
          _id:
            String(created._id),

          contributionId:
            created.contributionId,

          date:
            created.date,

          areaId:
            created.areaId,

          areaName:
            created.areaName,

          supplierId:
            created.supplierId,

          supplierName:
            created.supplierName,

          weightKg:
            Number(
              created.weightKg
            ),

          notes:
            created.notes || "",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADD SUPPLIER CONTRIBUTION ERROR:",
      error
    );

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
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to add supplier contribution",
      },
      { status: 500 }
    );
  }
}