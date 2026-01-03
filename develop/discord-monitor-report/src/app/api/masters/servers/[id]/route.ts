import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

const updateServerSchema = z.object({
  server_name: z.string().min(1).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

/**
 * PUT /api/masters/servers/[id]
 * Update a Discord server (managers only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const { id } = await params;
    const serverId = parseInt(id);

    if (isNaN(serverId)) {
      return NextResponse.json(
        { error: "Invalid server ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateServerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (validationResult.data.server_name !== undefined) {
      updateData.serverName = validationResult.data.server_name;
    }
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }
    if (validationResult.data.is_active !== undefined) {
      updateData.isActive = validationResult.data.is_active;
    }

    const server = await prisma.discordServer.update({
      where: { id: serverId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          server_id: server.id,
          updated_at: server.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    console.error("Update server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/masters/servers/[id]
 * Delete a Discord server (managers only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const { id } = await params;
    const serverId = parseInt(id);

    if (isNaN(serverId)) {
      return NextResponse.json(
        { error: "Invalid server ID" },
        { status: 400 }
      );
    }

    // Check if server is in use
    const recordCount = await prisma.monitoringRecord.count({
      where: { serverId },
    });

    if (recordCount > 0) {
      return NextResponse.json(
        { error: "Server is in use and cannot be deleted" },
        { status: 400 }
      );
    }

    await prisma.discordServer.delete({
      where: { id: serverId },
    });

    return NextResponse.json(
      {
        success: true,
        data: { message: "Server deleted successfully" },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      );
    }

    console.error("Delete server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
