import { z } from "zod";
import { CommentTarget } from "@prisma/client";

/**
 * Schema for creating a new comment
 */
export const createCommentSchema = z.object({
  targetField: z.nativeEnum(CommentTarget),
  commentText: z
    .string()
    .min(1, "Comment text is required")
    .max(2000, "Comment text must not exceed 2000 characters"),
});

/**
 * Schema for updating a comment
 */
export const updateCommentSchema = z.object({
  commentText: z
    .string()
    .min(1, "Comment text is required")
    .max(2000, "Comment text must not exceed 2000 characters"),
});

/**
 * Type for creating a comment
 */
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Type for updating a comment
 */
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
