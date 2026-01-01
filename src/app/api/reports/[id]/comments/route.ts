import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, authorize } from "@/lib/middleware/auth";
import { UserRole } from "@prisma/client";
import { createCommentSchema } from "@/lib/validation/comments";

/**
 * GET /api/reports/:id/comments
 * Get all comments for a specific report
 *
 * Permissions:
 * - Staff can only view comments on their own reports
 * - Manager can view comments on all reports
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

    // Parse report ID
    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "Invalid report ID" },
        { status: 400 }
      );
    }

    // Check if report exists
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { id: true, userId: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Permission check: Staff can only view comments on their own reports
    if (user.role === UserRole.STAFF && report.userId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only view comments on your own reports" },
        { status: 403 }
      );
    }

    // Fetch comments with user info, sorted by createdAt ASC
    const comments = await prisma.comment.findMany({
      where: { reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format response
    const formattedComments = comments.map((comment) => ({
      comment_id: comment.id,
      report_id: comment.reportId,
      user_id: comment.userId,
      user_name: comment.user.name,
      user_email: comment.user.email,
      target_field: comment.targetField.toLowerCase(),
      comment_text: comment.commentText,
      created_at: comment.createdAt.toISOString(),
      updated_at: comment.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          comments: formattedComments,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get comments error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while fetching comments",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/:id/comments
 * Create a new comment on a report
 *
 * Permissions:
 * - MANAGER ONLY (Staff cannot comment)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate and authorize (MANAGER only)
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager
    const authError = authorize(user, [UserRole.MANAGER]);
    if (authError) {
      return NextResponse.json(
        { error: "Forbidden: Only managers can create comments" },
        { status: 403 }
      );
    }

    // Parse report ID
    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "Invalid report ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { targetField, commentText } = validationResult.data;

    // Check if report exists
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        reportId,
        userId: user.userId,
        targetField,
        commentText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Format response
    const response = {
      comment_id: comment.id,
      report_id: comment.reportId,
      user_id: comment.userId,
      user_name: comment.user.name,
      target_field: comment.targetField.toLowerCase(),
      comment_text: comment.commentText,
      created_at: comment.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while creating comment",
      },
      { status: 500 }
    );
  }
}
