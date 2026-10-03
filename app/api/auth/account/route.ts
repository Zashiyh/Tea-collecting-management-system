import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET;

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    if (!JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "JWT_SECRET is not configured." },
        { status: 500 }
      );
    }

    await connectDB();

    const body = await request.json();

    const currentPassword = String(body.currentPassword || "").trim();
    const newUsername = String(body.newUsername || "").trim().toLowerCase();
    const newPassword = String(body.newPassword || "").trim();

    // Current password is always required
    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is required.",
        },
        { status: 400 }
      );
    }

    // At least username or password must be changed
    if (!newUsername && !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a new username or new password.",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(currentUser.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "This account is disabled.",
        },
        { status: 403 }
      );
    }

    // Verify current password
    const passwordCorrect = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        { status: 401 }
      );
    }

    // Validate username
    if (newUsername) {
      if (newUsername.length < 3) {
        return NextResponse.json(
          {
            success: false,
            message: "Username must contain at least 3 characters.",
          },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9._-]+$/.test(newUsername)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Username can only contain letters, numbers, dots, underscores and hyphens.",
          },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({
        username: newUsername,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "This username is already being used.",
          },
          { status: 409 }
        );
      }

      user.username = newUsername;
    }

    // Validate and hash new password
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            message: "New password must contain at least 8 characters.",
          },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      user.passwordHash = passwordHash;
    }

    await user.save();

    // Create a fresh JWT
    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new SignJWT({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Account updated successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });

    // Replace existing authentication cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    console.error("Account update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the account.",
      },
      { status: 500 }
    );
  }
}