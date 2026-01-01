import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/middleware/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import {
  createReportSchema,
  listReportsQuerySchema,
  type CreateReportInput,
} from "@/lib/validation/reports";

/**
 * GET /api/reports
 * Get list of daily reports with filtering and pagination
 * - Staff: Only see their own reports
 * - Manager: See all reports (optionally filter by userId)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = listReportsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { userId: filterUserId, startDate, endDate, page, limit } = validationResult.data;

    // Determine which reports to fetch based on user role
    let userId: number | undefined;
    if (user.role === UserRole.STAFF) {
      // Staff can only see their own reports
      userId = user.userId;
    } else if (user.role === UserRole.MANAGER) {
      // Manager can filter by userId or see all reports
      userId = filterUserId;
    }

    // Build where clause
    const where: any = {};
    if (userId !== undefined) {
      where.userId = userId;
    }
    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.reportDate.lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch reports with counts
    const [reports, totalCount] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          monitoringRecords: {
            select: {
              id: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          reportDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.dailyReport.count({ where }),
    ]);

    // Format response
    const formattedReports = reports.map((report) => ({
      report_id: report.id,
      user_id: report.userId,
      user_name: report.user.name,
      report_date: report.reportDate.toISOString().split("T")[0],
      monitoring_count: report.monitoringRecords.length,
      comment_count: report.comments.length,
      has_unread_comments: false, // TODO: Implement read tracking in future
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          reports: formattedReports,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_count: totalCount,
            limit,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get reports error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while fetching reports",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Create a new daily report with monitoring records
 * - Staff can only create their own reports
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createReportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { reportDate, problem, plan, monitoringRecords } = validationResult.data;

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

    // Create report with monitoring records in a transaction
    const report = await prisma.dailyReport.create({
      data: {
        userId: user.userId,
        reportDate: new Date(reportDate),
        problem: problem || null,
        plan: plan || null,
        monitoringRecords: {
          create: monitoringRecords.map((record) => ({
            serverId: record.serverId,
            monitoringContent: record.monitoringContent,
          })),
        },
      },
      include: {
        monitoringRecords: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          report_id: report.id,
          user_id: report.userId,
          report_date: report.reportDate.toISOString().split("T")[0],
          problem: report.problem,
          plan: report.plan,
          created_at: report.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create report error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while creating report",
        },
      },
      { status: 500 }
    );
  }
}
