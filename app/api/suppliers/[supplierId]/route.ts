import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

import Supplier from "@/models/Supplier";
import Area from "@/models/Area";
import TeaCollection from "@/models/TeaCollection";

interface RouteContext {
  params: Promise<{
    supplierId: string;
  }>;
}

/*
 * GET SINGLE SUPPLIER
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAuth();
    await connectDB();

    const { supplierId } =
      await context.params;

    const supplier =
      await Supplier.findOne({
        supplierId,
      }).lean();

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      supplier,
    });
  } catch (error) {
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
        {
          status: 401,
        }
      );
    }

    console.error(
      "GET single supplier error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch supplier",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * UPDATE SUPPLIER
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAuth();
    await connectDB();

    const { supplierId } =
      await context.params;

    const body =
      await request.json();

    const name =
      body.name?.trim();

    const phone =
      body.phone?.trim();

    const areaId =
      body.areaId?.trim();

    const village =
      body.village?.trim();

    const address =
      body.address?.trim() || "";

    const imageUrl =
      body.imageUrl === undefined
        ? undefined
        : String(body.imageUrl || "").trim();

    const imagePublicId =
      body.imagePublicId === undefined
        ? undefined
        : String(body.imagePublicId || "").trim();

    const removeImage =
      body.removeImage === true;

    if (
      !name ||
      !phone ||
      !areaId ||
      !village
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, phone, area and village are required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find existing supplier
     */
    const existingSupplier =
      await Supplier.findOne({
        supplierId,
      });

    if (!existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supplier not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Validate area
     */
    const area =
      await Area.findOne({
        areaId,
        status: "Active",
      }).lean();

    if (!area) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected area was not found or is inactive",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Check duplicate phone
     */
    const duplicatePhone =
      await Supplier.findOne({
        phone,
        supplierId: {
          $ne: supplierId,
        },
      }).lean();

    if (duplicatePhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another supplier already uses this phone number",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Validate new Cloudinary image
     */
    if (
      imageUrl !== undefined &&
      imageUrl !== ""
    ) {
      try {
        const parsedUrl = new URL(imageUrl);

        if (
          parsedUrl.protocol !== "https:" ||
          parsedUrl.hostname !== "res.cloudinary.com"
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid supplier image URL.",
            },
            {
              status: 400,
            }
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid supplier image URL.",
          },
          {
            status: 400,
          }
        );
      }

      if (!imagePublicId) {
        return NextResponse.json(
          {
            success: false,
            message: "Image ID is required.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Store old image details
     */
    const oldImagePublicId =
      existingSupplier.imagePublicId || "";

    const oldImageUrl =
      existingSupplier.imageUrl || "";

    /*
     * Update supplier
     */
    existingSupplier.name =
      name;

    existingSupplier.phone =
      phone;

    existingSupplier.areaId =
      area.areaId;

    existingSupplier.areaName =
      area.name;

    existingSupplier.village =
      village;

    existingSupplier.address =
      address;

    /*
     * Update or remove profile image
     */
    if (removeImage) {
      existingSupplier.imageUrl = "";
      existingSupplier.imagePublicId = "";
    } else if (
      imageUrl !== undefined &&
      imagePublicId !== undefined
    ) {
      existingSupplier.imageUrl =
        imageUrl;

      existingSupplier.imagePublicId =
        imagePublicId;
    }

    await existingSupplier.save();

    /*
     * Delete old Cloudinary image
     * only after successful database save
     */
    const imageChanged =
      removeImage ||
      (
        imagePublicId !== undefined &&
        imagePublicId !== oldImagePublicId
      );

    if (
      imageChanged &&
      oldImagePublicId
    ) {
      try {
        await cloudinary.uploader.destroy(
          oldImagePublicId
        );
      } catch (imageError) {
        console.error(
          "OLD SUPPLIER IMAGE DELETE ERROR:",
          imageError
        );
      }
    }

    /*
     * Keep historical collection records
     * synchronized with supplier name/area.
     *
     * This does NOT change collection weight,
     * rate or amount.
     */
    await TeaCollection.updateMany(
      {
        supplierId,
      },
      {
        $set: {
          supplierName: name,
          areaId: area.areaId,
          areaName: area.name,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Supplier updated successfully",
      supplier:
        existingSupplier,
    });
  } catch (error) {
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
        {
          status: 401,
        }
      );
    }

    console.error(
      "PATCH supplier error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update supplier",
      },
      {
        status: 500
      }
    );
  }
}

/*
 * DELETE SUPPLIER
 */
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAuth();
    await connectDB();

    const { supplierId } =
      await context.params;

    const supplier =
      await Supplier.findOne({
        supplierId,
      });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supplier not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Check collection history
     */
    const collectionCount =
      await TeaCollection.countDocuments({
        supplierId,
      });

    /*
     * Do not physically delete a supplier
     * if historical collection records exist.
     *
     * Instead mark inactive.
     */
    if (collectionCount > 0) {
      supplier.status =
        "Inactive";

      await supplier.save();

      return NextResponse.json({
        success: true,
        deleted: false,
        deactivated: true,
        message:
          "Supplier has collection history, so it was marked as inactive instead of being permanently deleted.",
      });
    }

    /*
     * No collection history
     * => permanent delete is safe
     */
    const imagePublicId =
      supplier.imagePublicId || "";

    await Supplier.deleteOne({
      supplierId,
    });

    /*
     * Delete supplier profile image
     * from Cloudinary
     */
    if (imagePublicId) {
      try {
        await cloudinary.uploader.destroy(
          imagePublicId
        );
      } catch (imageError) {
        console.error(
          "SUPPLIER IMAGE DELETE ERROR:",
          imageError
        );
      }
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      deactivated: false,
      message:
        "Supplier deleted successfully",
    });
  } catch (error) {
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
        {
          status: 401,
        }
      );
    }

    console.error(
      "DELETE supplier error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete supplier",
      },
      {
        status: 500,
      }
    );
  }
}