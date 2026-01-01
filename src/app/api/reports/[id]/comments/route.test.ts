import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";
import { UserRole, CommentTarget } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("GET /api/reports/:id/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (reportId: string, token: string): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/reports/${reportId}/comments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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

  const otherStaffToken = signToken({
    userId: 3,
    email: "other@example.com",
    role: UserRole.STAFF,
  });

  describe("Successful GET", () => {
    it("should return comments for staff's own report", async () => {
      const mockReport = { id: 1, userId: 1 };
      const mockComments = [
        {
          id: 1,
          reportId: 1,
          userId: 2,
          targetField: CommentTarget.PROBLEM,
          commentText: "Good point",
          createdAt: new Date("2025-01-01T10:00:00Z"),
          updatedAt: new Date("2025-01-01T10:00:00Z"),
          user: {
            id: 2,
            name: "Manager",
            email: "manager@example.com",
            role: UserRole.MANAGER,
          },
        },
        {
          id: 2,
          reportId: 1,
          userId: 2,
          targetField: CommentTarget.PLAN,
          commentText: "Looks good",
          createdAt: new Date("2025-01-01T11:00:00Z"),
          updatedAt: new Date("2025-01-01T11:00:00Z"),
          user: {
            id: 2,
            name: "Manager",
            email: "manager@example.com",
            role: UserRole.MANAGER,
          },
        },
      ];

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments as any);

      const request = createRequest("1", staffToken);
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.comments).toHaveLength(2);
      expect(data.data.comments[0].comment_id).toBe(1);
      expect(data.data.comments[0].target_field).toBe("problem");
      expect(data.data.comments[0].user_name).toBe("Manager");
      expect(data.data.comments[1].comment_id).toBe(2);
      expect(data.data.comments[1].target_field).toBe("plan");
    });

    it("should return comments for manager viewing any report", async () => {
      const mockReport = { id: 1, userId: 1 };
      const mockComments: any[] = [];

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments as any);

      const request = createRequest("1", managerToken);
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.comments).toHaveLength(0);
    });

    it("should return empty array when no comments exist", async () => {
      const mockReport = { id: 1, userId: 1 };
      const mockComments: any[] = [];

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);

      const request = createRequest("1", staffToken);
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.comments).toEqual([]);
    });
  });

  describe("Permission checks", () => {
    it("should reject staff viewing other staff's report", async () => {
      const mockReport = { id: 1, userId: 1 };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);

      const request = createRequest("1", otherStaffToken);
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("own reports");
    });

    it("should reject unauthenticated request", async () => {
      const request = new NextRequest("http://localhost:3000/api/reports/1/comments", {
        method: "GET",
      });

      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const request = createRequest("1", "invalid-token");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation errors", () => {
    it("should reject invalid report ID", async () => {
      const request = createRequest("invalid", staffToken);
      const response = await GET(request, { params: Promise.resolve({ id: "invalid" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid report ID");
    });

    it("should return 404 for non-existent report", async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

      const request = createRequest("999", staffToken);
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });

  describe("Database errors", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      const request = createRequest("1", staffToken);
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});

describe("POST /api/reports/:id/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (reportId: string, token: string, body: unknown): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/reports/${reportId}/comments`, {
      method: "POST",
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

  describe("Successful POST", () => {
    it("should create comment as manager", async () => {
      const mockReport = { id: 1 };
      const mockComment = {
        id: 1,
        reportId: 1,
        userId: 2,
        targetField: CommentTarget.PROBLEM,
        commentText: "Good work!",
        createdAt: new Date("2025-01-01T10:00:00Z"),
        updatedAt: new Date("2025-01-01T10:00:00Z"),
        user: {
          id: 2,
          name: "Manager",
          email: "manager@example.com",
          role: UserRole.MANAGER,
        },
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);
      vi.mocked(prisma.comment.create).mockResolvedValue(mockComment as any);

      const request = createRequest("1", managerToken, {
        targetField: "PROBLEM",
        commentText: "Good work!",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.comment_id).toBe(1);
      expect(data.data.target_field).toBe("problem");
      expect(data.data.comment_text).toBe("Good work!");
      expect(data.data.user_name).toBe("Manager");
    });

    it("should create comment with PLAN targetField", async () => {
      const mockReport = { id: 1 };
      const mockComment = {
        id: 2,
        reportId: 1,
        userId: 2,
        targetField: CommentTarget.PLAN,
        commentText: "Nice plan!",
        createdAt: new Date("2025-01-01T10:00:00Z"),
        updatedAt: new Date("2025-01-01T10:00:00Z"),
        user: {
          id: 2,
          name: "Manager",
          email: "manager@example.com",
          role: UserRole.MANAGER,
        },
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);
      vi.mocked(prisma.comment.create).mockResolvedValue(mockComment as any);

      const request = createRequest("1", managerToken, {
        targetField: "PLAN",
        commentText: "Nice plan!",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.target_field).toBe("plan");
    });
  });

  describe("Permission checks", () => {
    it("should reject staff trying to create comment", async () => {
      const request = createRequest("1", staffToken, {
        targetField: "PROBLEM",
        commentText: "Test comment",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("manager");
    });

    it("should reject unauthenticated request", async () => {
      const request = new NextRequest("http://localhost:3000/api/reports/1/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetField: "PROBLEM",
          commentText: "Test",
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation errors", () => {
    it("should reject invalid targetField", async () => {
      const request = createRequest("1", managerToken, {
        targetField: "INVALID",
        commentText: "Test comment",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject missing targetField", async () => {
      const request = createRequest("1", managerToken, {
        commentText: "Test comment",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject missing commentText", async () => {
      const request = createRequest("1", managerToken, {
        targetField: "PROBLEM",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject empty commentText", async () => {
      const request = createRequest("1", managerToken, {
        targetField: "PROBLEM",
        commentText: "",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject commentText exceeding 2000 characters", async () => {
      const longText = "a".repeat(2001);
      const request = createRequest("1", managerToken, {
        targetField: "PROBLEM",
        commentText: longText,
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should accept commentText with exactly 2000 characters", async () => {
      const maxText = "a".repeat(2000);
      const mockReport = { id: 1 };
      const mockComment = {
        id: 1,
        reportId: 1,
        userId: 2,
        targetField: CommentTarget.PROBLEM,
        commentText: maxText,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 2,
          name: "Manager",
          email: "manager@example.com",
          role: UserRole.MANAGER,
        },
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);
      vi.mocked(prisma.comment.create).mockResolvedValue(mockComment as any);

      const request = createRequest("1", managerToken, {
        targetField: "PROBLEM",
        commentText: maxText,
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });

      expect(response.status).toBe(201);
    });

    it("should reject invalid report ID", async () => {
      const request = createRequest("invalid", managerToken, {
        targetField: "PROBLEM",
        commentText: "Test",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "invalid" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid report ID");
    });

    it("should return 404 for non-existent report", async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

      const request = createRequest("999", managerToken, {
        targetField: "PROBLEM",
        commentText: "Test",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });

  describe("Database errors", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      const request = createRequest("1", managerToken, {
        targetField: "PROBLEM",
        commentText: "Test",
      });

      const response = await POST(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
