import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type AuthUser = {
  userId: string;
  username: string;
  role: "ADMIN" | "STAFF";
  name: string;
};

const JWT_SECRET = process.env.JWT_SECRET;

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");
      return null;
    }

    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(
      JWT_SECRET
    );

    const { payload } = await jwtVerify(
      token,
      secret
    );

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    if (
      payload.role !== "ADMIN" &&
      payload.role !== "STAFF"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role as "ADMIN" | "STAFF",
      name: payload.name,
    };
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return user;
}