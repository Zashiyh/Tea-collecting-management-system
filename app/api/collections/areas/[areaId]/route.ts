import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Area from "@/models/Area";
import Supplier from "@/models/Supplier";
import TeaCollection from "@/models/TeaCollection";

interface RouteContext {
  params: Promise<{
    areaId: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { areaId } = await context.params;

    // Find area
    const area = await Area.findOne({
      areaId,
    }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message: "Area not found",
        },
        {
          status: 404,
        }
      );
    }

    // Get suppliers belonging to this area
    const suppliers = await Supplier.find({
      areaId,
    })
      .sort({
        name: 1,
      })
      .lean();

    // Get all collections belonging to this area
    const collections = await TeaCollection.find({
      areaId,
    })
      .sort({
        date: -1,
        createdAt: -1,
      })
      .lean();

    // Create supplier map
    const supplierMap = new Map<
      string,
      {
        supplierId: string;
        name: string;
        phone: string;
        village: string;
        address: string;
        status: string;
        totalKg: number;
        totalValue: number;
        collectionCount: number;
        collections: typeof collections;
      }
    >();

    // Add suppliers to map
    for (const supplier of suppliers) {
      supplierMap.set(supplier.supplierId, {
        supplierId: supplier.supplierId,
        name: supplier.name,
        phone: supplier.phone,
        village: supplier.village,
        address: supplier.address || "",
        status: supplier.status,
        totalKg: 0,
        totalValue: 0,
        collectionCount: 0,
        collections: [],
      });
    }

    // Attach collections to suppliers
    for (const collection of collections) {
      const supplier = supplierMap.get(
        collection.supplierId
      );

      if (!supplier) {
        continue;
      }

      supplier.totalKg += collection.weightKg;

      // totalAmount is optional in TeaCollection
      supplier.totalValue +=
        collection.totalAmount ?? 0;

      supplier.collectionCount += 1;

      supplier.collections.push(collection);
    }

    // Convert Map to array
    const supplierResults =
      Array.from(supplierMap.values());

    // Area totals
    const totalKg = collections.reduce(
      (
        total: number,
        collection: (typeof collections)[number]
      ) => total + collection.weightKg,
      0
    );

    const totalValue = collections.reduce(
      (
        total: number,
        collection: (typeof collections)[number]
      ) =>
        total + (collection.totalAmount ?? 0),
      0
    );

    // Return response
    return NextResponse.json({
      success: true,

      area: {
        areaId: area.areaId,
        name: area.name,
        description: area.description || "",
        status: area.status,
      },

      summary: {
        supplierCount: suppliers.length,
        totalKg,
        totalValue,
        collectionCount: collections.length,
      },

      suppliers: supplierResults,
    });
  } catch (error) {
    console.error(
      "GET /api/collections/areas/[areaId] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load area collections",
      },
      {
        status: 500,
      }
    );
  }
}