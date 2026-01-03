import { UserRole } from "@prisma/client";
import { CommentTarget } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

const commentSchema = z.object({
  target_field: z.enum(["problem", "plan"]),
  comment_text: z.string().min(1, "Comment text is required"),
});

/**
 * POST /api/reports/[id]/comments
 * Create a new comment on a report (managers only)
 */
export async function POST(
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

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (payload.role !== UserRole.MANAGER) {
      return NextResponse.json(
        { error: "Forbidden: Manager role required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: "Invalid report ID" },
        { status: 400 }
      );
    }

    // Verify report exists
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = commentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { target_field, comment_text } = validationResult.data;

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        reportId,
        userId: payload.userId,
        targetField: target_field === "problem" ? CommentTarget.PROBLEM : CommentTarget.PLAN,
        commentText: comment_text,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          comment_id: comment.id,
          report_id: comment.reportId,
          user_id: comment.userId,
          user_name: comment.user.name,
          target_field: comment.targetField,
          comment_text: comment.commentText,
          created_at: comment.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
