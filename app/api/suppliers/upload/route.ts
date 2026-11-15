import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import cloudinary from "@/lib/cloudinary";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select an image." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG and WEBP images are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: "Image size must be less than 5MB.",
        },
        { status: 400 }
      );
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Image upload configuration is missing.",
        },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "cooroonduwatte/suppliers",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Image upload failed."));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
  } catch (error) {
    console.error("Supplier image upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to upload image.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const { publicId } = await request.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Image ID is required.",
        },
        { status: 400 }
      );
    }

    if (!publicId.startsWith("cooroonduwatte/suppliers/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid supplier image ID.",
        },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    return NextResponse.json({
      success: true,
      message:
        result.result === "ok" || result.result === "not found"
          ? "Image deleted."
          : "Image deletion completed.",
    });
  } catch (error) {
    console.error("Supplier image delete error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete image.",
      },
      { status: 500 }
    );
  }
}