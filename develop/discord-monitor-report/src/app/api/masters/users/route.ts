import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["staff", "manager"]),
});

/**
 * GET /api/masters/users
 * Get all users (managers only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication and role
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== UserRole.MANAGER) {
      return NextResponse.json(
        { error: "Forbidden: Manager role required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");

    let where: { role?: UserRole } | undefined = undefined;
    if (roleParam) {
      if (roleParam === "staff") {
        where = { role: UserRole.STAFF };
      } else if (roleParam === "manager") {
        where = { role: UserRole.MANAGER };
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedUsers = users.map((user) => ({
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      { success: true, data: { users: formattedUsers } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/masters/users
 * Create a new user (managers only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication and role
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== UserRole.MANAGER) {
      return NextResponse.json(
        { error: "Forbidden: Manager role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validationResult.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role === "staff" ? UserRole.STAFF : UserRole.MANAGER,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          user_id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
