import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT, DELETE } from "./route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";
import { UserRole } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("PUT /api/comments/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (commentId: string, token: string, body: unknown): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  };

  const staffToken = signToken({
    userId: 1,
    email: "staff@example.com",
    role: UserRole.STAFF,
  });

  const managerToken = signToken({
    userId: 2,
    email: "manager@example.com",
    role: UserRole.MANAGER,
  });

  const otherManagerToken = signToken({
    userId: 3,
    email: "other-manager@example.com",
    role: UserRole.MANAGER,
  });

  describe("Successful PUT", () => {
    it("should update comment as owner", async () => {
      const mockExistingComment = { id: 1, userId: 2 };
      const mockUpdatedComment = {
        id: 1,
        updatedAt: new Date("2025-01-01T12:00:00Z"),
      };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as any);
      vi.mocked(prisma.comment.update).mockResolvedValue(mockUpdatedComment as any);

      const request = createRequest("1", managerToken, {
        commentText: "Updated comment text",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.comment_id).toBe(1);
      expect(data.data.updated_at).toBeTruthy();
    });

    it("should update comment with max length text", async () => {
      const maxText = "a".repeat(2000);
      const mockExistingComment = { id: 1, userId: 2 };
      const mockUpdatedComment = {
        id: 1,
        updatedAt: new Date("2025-01-01T12:00:00Z"),
      };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as any);
      vi.mocked(prisma.comment.update).mockResolvedValue(mockUpdatedComment as any);

      const request = createRequest("1", managerToken, {
        commentText: maxText,
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(200);
    });
  });

  describe("Permission checks", () => {
    it("should reject staff trying to update comment", async () => {
      const request = createRequest("1", staffToken, {
        commentText: "Updated text",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("manager");
    });

    it("should reject manager updating another manager's comment", async () => {
      const mockExistingComment = { id: 1, userId: 2 }; // Owned by userId 2

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as any);

      const request = createRequest("1", otherManagerToken, {
        commentText: "Updated text",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("own comments");
    });

    it("should reject unauthenticated request", async () => {
      const request = new NextRequest("http://localhost:3000/api/comments/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentText: "Updated text",
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const request = createRequest("1", "invalid-token", {
        commentText: "Updated text",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation errors", () => {
    it("should reject missing commentText", async () => {
      const request = createRequest("1", managerToken, {});

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject empty commentText", async () => {
      const request = createRequest("1", managerToken, {
        commentText: "",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject commentText exceeding 2000 characters", async () => {
      const longText = "a".repeat(2001);
      const request = createRequest("1", managerToken, {
        commentText: longText,
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject invalid comment ID", async () => {
      const request = createRequest("invalid", managerToken, {
        commentText: "Updated text",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "invalid" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid comment ID");
    });

    it("should return 404 for non-existent comment", async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      const request = createRequest("999", managerToken, {
        commentText: "Updated text",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });

  describe("Database errors", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.comment.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      const request = createRequest("1", managerToken, {
        commentText: "Updated text",
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});

describe("DELETE /api/comments/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (commentId: string, token: string): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const staffToken = signToken({
    userId: 1,
    email: "staff@example.com",
    role: UserRole.STAFF,
  });

  const managerToken = signToken({
    userId: 2,
    email: "manager@example.com",
    role: UserRole.MANAGER,
  });

  const otherManagerToken = signToken({
    userId: 3,
    email: "other-manager@example.com",
    role: UserRole.MANAGER,
  });

  describe("Successful DELETE", () => {
    it("should delete comment as owner", async () => {
      const mockExistingComment = { id: 1, userId: 2 };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as any);
      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      const request = createRequest("1", managerToken);

      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toContain("deleted");
    });
  });

  describe("Permission checks", () => {
    it("should reject staff trying to delete comment", async () => {
      const request = createRequest("1", staffToken);

      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("manager");
    });

    it("should reject manager deleting another manager's comment", async () => {
      const mockExistingComment = { id: 1, userId: 2 }; // Owned by userId 2

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as any);

      const request = createRequest("1", otherManagerToken);

      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("own comments");
    });

    it("should reject unauthenticated request", async () => {
      const request = new NextRequest("http://localhost:3000/api/comments/1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const request = new NextRequest("http://localhost:3000/api/comments/1", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation errors", () => {
    it("should reject invalid comment ID", async () => {
      const request = createRequest("invalid", managerToken);

      const response = await DELETE(request, { params: Promise.resolve({ id: "invalid" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid comment ID");
    });

    it("should return 404 for non-existent comment", async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      const request = createRequest("999", managerToken);

      const response = await DELETE(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });

  describe("Database errors", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.comment.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      const request = createRequest("1", managerToken);

      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
