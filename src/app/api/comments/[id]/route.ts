import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, authorize } from "@/lib/middleware/auth";
import { UserRole } from "@prisma/client";
import { updateCommentSchema } from "@/lib/validation/comments";

/**
 * PUT /api/comments/:id
 * Update a comment
 *
 * Permissions:
 * - MANAGER ONLY
 * - Can only update own comments (userId must match)
 */
export async function PUT(
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
        { error: "Forbidden: Only managers can update comments" },
        { status: 403 }
      );
    }

    // Parse comment ID
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { commentText } = validationResult.data;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Ownership check: Only the comment creator can update it
    if (existingComment.userId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own comments" },
        { status: 403 }
      );
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { commentText },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          comment_id: updatedComment.id,
          updated_at: updatedComment.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update comment error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while updating comment",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/:id
 * Delete a comment
 *
 * Permissions:
 * - MANAGER ONLY
 * - Can only delete own comments (userId must match)
 */
export async function DELETE(
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
        { error: "Forbidden: Only managers can delete comments" },
        { status: 403 }
      );
    }

    // Parse comment ID
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Ownership check: Only the comment creator can delete it
    if (existingComment.userId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete comment (hard delete)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Comment deleted successfully",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete comment error:", {
      errorType: error instanceof Error ? error.constructor.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while deleting comment",
      },
      { status: 500 }
    );
  }
}
