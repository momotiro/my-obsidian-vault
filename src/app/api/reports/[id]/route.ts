import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/middleware/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { updateReportSchema } from "@/lib/validation/reports";

/**
 * GET /api/reports/:id
 * Get detailed information about a specific daily report
 * - Staff: Only see their own reports
 * - Manager: See all reports
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid report ID",
          },
        },
        { status: 400 }
      );
    }

    // Fetch report with all related data
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        monitoringRecords: {
          include: {
            discordServer: {
              select: {
                id: true,
                serverName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REPORT_NOT_FOUND",
            message: "Report not found",
          },
        },
        { status: 404 }
      );
    }

    // Check authorization: Staff can only see their own reports
    if (user.role === UserRole.STAFF && report.userId !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to view this report",
          },
        },
        { status: 403 }
      );
    }

    // Format response
    const formattedReport = {
      report_id: report.id,
      user_id: report.userId,
      user_name: report.user.name,
      report_date: report.reportDate.toISOString().split("T")[0],
      problem: report.problem,
      plan: report.plan,
      monitoring_records: report.monitoringRecords.map((record) => ({
        record_id: record.id,
        server_id: record.serverId,
        server_name: record.discordServer.serverName,
        monitoring_content: record.monitoringContent,
        created_at: record.createdAt.toISOString(),
      })),
      comments: report.comments.map((comment) => ({
        comment_id: comment.id,
        user_id: comment.userId,
        user_name: comment.user.name,
        target_field: comment.targetField.toLowerCase(),
        comment_text: comment.commentText,
        created_at: comment.createdAt.toISOString(),
      })),
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: formattedReport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get report detail error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while fetching report",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reports/:id
 * Update a daily report
 * - Staff can only update their own reports
 * - Manager cannot update (only comment)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid report ID",
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateReportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { problem, plan, monitoringRecords } = validationResult.data;

    // Check if report exists and verify ownership
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { userId: true },
    });

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REPORT_NOT_FOUND",
            message: "Report not found",
          },
        },
        { status: 404 }
      );
    }

    // Check authorization: Only the owner (Staff) can update
    if (existingReport.userId !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to edit this report",
          },
        },
        { status: 403 }
      );
    }

    // Verify all servers exist
    const serverIds = monitoringRecords.map((r) => r.serverId);
    const servers = await prisma.discordServer.findMany({
      where: {
        id: {
          in: serverIds,
        },
      },
      select: { id: true },
    });

    if (servers.length !== serverIds.length) {
      const foundIds = servers.map((s) => s.id);
      const missingIds = serverIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Server(s) not found: ${missingIds.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    // Update report in a transaction
    const updatedReport = await prisma.$transaction(async (tx) => {
      // Delete existing monitoring records
      await tx.monitoringRecord.deleteMany({
        where: { reportId },
      });

      // Update report and create new monitoring records
      return tx.dailyReport.update({
        where: { id: reportId },
        data: {
          problem: problem !== undefined ? problem : undefined,
          plan: plan !== undefined ? plan : undefined,
          monitoringRecords: {
            create: monitoringRecords.map((record) => ({
              serverId: record.serverId,
              monitoringContent: record.monitoringContent,
            })),
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          report_id: updatedReport.id,
          updated_at: updatedReport.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update report error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while updating report",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/:id
 * Delete a daily report
 * - Staff can only delete their own reports
 * - Manager cannot delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid report ID",
          },
        },
        { status: 400 }
      );
    }

    // Check if report exists and verify ownership
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { userId: true },
    });

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REPORT_NOT_FOUND",
            message: "Report not found",
          },
        },
        { status: 404 }
      );
    }

    // Check authorization: Only the owner (Staff) can delete
    if (existingReport.userId !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to delete this report",
          },
        },
        { status: 403 }
      );
    }

    // Delete report (monitoring records and comments will be cascade deleted)
    await prisma.dailyReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Report deleted successfully",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete report error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while deleting report",
        },
      },
      { status: 500 }
    );
  }
}
