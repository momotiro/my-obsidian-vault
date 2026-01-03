import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * GET /api/masters/servers
 * Get all Discord servers
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get("is_active");

    const where =
      isActiveParam !== null
        ? { isActive: isActiveParam === "true" }
        : undefined;

    const servers = await prisma.discordServer.findMany({
      where,
      select: {
        id: true,
        serverName: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        serverName: "asc",
      },
    });

    const formattedServers = servers.map((server) => ({
      server_id: server.id,
      server_name: server.serverName,
      description: server.description || "",
      is_active: server.isActive,
      created_at: server.createdAt.toISOString(),
      updated_at: server.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      { success: true, data: { servers: formattedServers } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get servers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/masters/servers
 * Create a new Discord server (managers only)
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

    if (!payload || payload.role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden: Manager role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { server_name, description, is_active } = body;

    if (!server_name) {
      return NextResponse.json(
        { error: "Server name is required" },
        { status: 400 }
      );
    }

    const server = await prisma.discordServer.create({
      data: {
        serverName: server_name,
        description: description || "",
        isActive: is_active ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          server_id: server.id,
          server_name: server.serverName,
          description: server.description || "",
          is_active: server.isActive,
          created_at: server.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
