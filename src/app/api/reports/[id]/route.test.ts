import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";
import { UserRole } from "@prisma/client";

// Mock environment variables
vi.mock("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    JWT_SECRET: "test-jwt-secret-key-that-is-at-least-32-characters-long",
    NEXT_PUBLIC_API_URL: "http://localhost:3000",
    NODE_ENV: "test",
  },
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    discordServer: {
      findMany: vi.fn(),
    },
    monitoringRecord: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("GET /api/reports/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token: string, reportId: string): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/reports/${reportId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  describe("Authentication", () => {
    it("should return 401 without token", async () => {
      const request = new NextRequest("http://localhost:3000/api/reports/1", {
        method: "GET",
      });

      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should return 400 for invalid report ID", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      const request = createRequest(token, "invalid");
      const response = await GET(request, { params: Promise.resolve({ id: "invalid" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Authorization", () => {
    it("should return 404 when report not found", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

      const request = createRequest(token, "999");
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("REPORT_NOT_FOUND");
    });

    it("should return 403 when staff tries to view other's report", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      const mockReport = {
        id: 1,
        userId: 2, // Different user
        reportDate: new Date("2025-12-31"),
        problem: "Problem",
        plan: "Plan",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 2, name: "Other User" },
        monitoringRecords: [],
        comments: [],
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);

      const request = createRequest(token, "1");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should allow staff to view own report", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      const mockReport = {
        id: 1,
        userId: 1, // Same user
        reportDate: new Date("2025-12-31"),
        problem: "Problem",
        plan: "Plan",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, name: "Staff User" },
        monitoringRecords: [
          {
            id: 1,
            serverId: 1,
            monitoringContent: "Content",
            createdAt: new Date(),
            discordServer: { id: 1, serverName: "Server A" },
          },
        ],
        comments: [
          {
            id: 1,
            userId: 2,
            targetField: "PROBLEM",
            commentText: "Comment",
            createdAt: new Date(),
            user: { id: 2, name: "Manager" },
          },
        ],
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);

      const request = createRequest(token, "1");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.report_id).toBe(1);
      expect(data.data.user_id).toBe(1);
      expect(data.data.monitoring_records).toHaveLength(1);
      expect(data.data.comments).toHaveLength(1);
      expect(data.data.comments[0].target_field).toBe("problem");
    });

    it("should allow manager to view any report", async () => {
      const token = signToken({
        userId: 2,
        email: "manager@example.com",
        role: UserRole.MANAGER,
      });

      const mockReport = {
        id: 1,
        userId: 1, // Different user
        reportDate: new Date("2025-12-31"),
        problem: "Problem",
        plan: "Plan",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, name: "Staff User" },
        monitoringRecords: [],
        comments: [],
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as any);

      const request = createRequest(token, "1");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

describe("PUT /api/reports/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token: string, reportId: string, body: unknown): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/reports/${reportId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Authorization", () => {
    it("should return 404 when report not found", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

      const request = createRequest(token, "999", {
        monitoringRecords: [{ serverId: 1, monitoringContent: "Test" }],
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("REPORT_NOT_FOUND");
    });

    it("should return 403 when user tries to update other's report", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 2, // Different user
      } as any);

      const request = createRequest(token, "1", {
        monitoringRecords: [{ serverId: 1, monitoringContent: "Test" }],
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 when manager tries to update (managers can only comment)", async () => {
      const token = signToken({
        userId: 2,
        email: "manager@example.com",
        role: UserRole.MANAGER,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 1, // Staff's report
      } as any);

      const request = createRequest(token, "1", {
        monitoringRecords: [{ serverId: 1, monitoringContent: "Test" }],
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe("Validation", () => {
    it("should return 400 when monitoringRecords is empty", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 1,
      } as any);

      const request = createRequest(token, "1", {
        monitoringRecords: [],
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when server does not exist", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 1,
      } as any);

      vi.mocked(prisma.discordServer.findMany).mockResolvedValue([]);

      const request = createRequest(token, "1", {
        monitoringRecords: [{ serverId: 999, monitoringContent: "Test" }],
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Successful update", () => {
    it("should update report and replace monitoring records", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 1,
      } as any);

      vi.mocked(prisma.discordServer.findMany).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ] as any);

      const mockUpdatedReport = {
        id: 1,
        userId: 1,
        updatedAt: new Date(),
      };

      // Mock transaction
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          monitoringRecord: {
            deleteMany: vi.fn(),
          },
          dailyReport: {
            update: vi.fn().mockResolvedValue(mockUpdatedReport),
          },
        });
      });

      const request = createRequest(token, "1", {
        problem: "Updated problem",
        plan: "Updated plan",
        monitoringRecords: [
          { serverId: 1, monitoringContent: "New content 1" },
          { serverId: 2, monitoringContent: "New content 2" },
        ],
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.report_id).toBe(1);
      expect(data.data.updated_at).toBeTruthy();
    });
  });
});

describe("DELETE /api/reports/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token: string, reportId: string): NextRequest => {
    return new NextRequest(`http://localhost:3000/api/reports/${reportId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  describe("Authorization", () => {
    it("should return 404 when report not found", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

      const request = createRequest(token, "999");
      const response = await DELETE(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("REPORT_NOT_FOUND");
    });

    it("should return 403 when user tries to delete other's report", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 2, // Different user
      } as any);

      const request = createRequest(token, "1");
      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 when manager tries to delete", async () => {
      const token = signToken({
        userId: 2,
        email: "manager@example.com",
        role: UserRole.MANAGER,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 1, // Staff's report
      } as any);

      const request = createRequest(token, "1");
      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe("Successful deletion", () => {
    it("should delete report", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        userId: 1, // Same user
      } as any);

      vi.mocked(prisma.dailyReport.delete).mockResolvedValue({} as any);

      const request = createRequest(token, "1");
      const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toContain("deleted");

      // Verify delete was called
      expect(vi.mocked(prisma.dailyReport.delete)).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
