import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "JWT_SECRET is not configured.",
        },
        { status: 500 }
      );
    }

    await connectDB();

    const body = await request.json();

    const username = String(body.username || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required.",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      username,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "This account has been disabled.",
        },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(
      JWT_SECRET
    );

    const token = await new SignJWT({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Login failed.",
      },
      { status: 500 }
    );
  }
}