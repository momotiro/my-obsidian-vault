import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
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
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    discordServer: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token: string, queryParams: Record<string, string> = {}): NextRequest => {
    const url = new URL("http://localhost:3000/api/reports");
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return new NextRequest(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  describe("Authentication", () => {
    it("should return 401 without token", async () => {
      const request = new NextRequest("http://localhost:3000/api/reports", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const request = new NextRequest("http://localhost:3000/api/reports", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe("Staff user", () => {
    it("should only see own reports", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      const mockReports = [
        {
          id: 1,
          userId: 1,
          reportDate: new Date("2025-12-31"),
          problem: "Problem 1",
          plan: "Plan 1",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 1, name: "Staff User" },
          monitoringRecords: [{ id: 1 }, { id: 2 }],
          comments: [{ id: 1 }],
        },
      ];

      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue(mockReports);
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(1);

      const request = createRequest(token);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reports).toHaveLength(1);
      expect(data.data.reports[0].user_id).toBe(1);
      expect(data.data.reports[0].monitoring_count).toBe(2);
      expect(data.data.reports[0].comment_count).toBe(1);

      // Verify findMany was called with userId filter
      expect(vi.mocked(prisma.dailyReport.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
          }),
        })
      );
    });
  });

  describe("Manager user", () => {
    it("should see all reports when no userId filter", async () => {
      const token = signToken({
        userId: 2,
        email: "manager@example.com",
        role: UserRole.MANAGER,
      });

      const mockReports = [
        {
          id: 1,
          userId: 1,
          reportDate: new Date("2025-12-31"),
          problem: "Problem 1",
          plan: "Plan 1",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 1, name: "Staff User" },
          monitoringRecords: [],
          comments: [],
        },
        {
          id: 2,
          userId: 3,
          reportDate: new Date("2025-12-30"),
          problem: "Problem 2",
          plan: "Plan 2",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 3, name: "Another Staff" },
          monitoringRecords: [],
          comments: [],
        },
      ];

      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue(mockReports);
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(2);

      const request = createRequest(token);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reports).toHaveLength(2);

      // Verify findMany was called without userId filter
      expect(vi.mocked(prisma.dailyReport.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            userId: expect.anything(),
          }),
        })
      );
    });

    it("should filter by userId when provided", async () => {
      const token = signToken({
        userId: 2,
        email: "manager@example.com",
        role: UserRole.MANAGER,
      });

      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([]);
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(0);

      const request = createRequest(token, { userId: "1" });
      const response = await GET(request);

      expect(response.status).toBe(200);

      // Verify findMany was called with userId filter
      expect(vi.mocked(prisma.dailyReport.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
          }),
        })
      );
    });
  });

  describe("Date filtering", () => {
    it("should filter by date range", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([]);
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(0);

      const request = createRequest(token, {
        startDate: "2025-12-01",
        endDate: "2025-12-31",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);

      // Verify date filter
      expect(vi.mocked(prisma.dailyReport.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportDate: {
              gte: new Date("2025-12-01"),
              lte: new Date("2025-12-31"),
            },
          }),
        })
      );
    });
  });

  describe("Pagination", () => {
    it("should use default pagination values", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([]);
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(0);

      const request = createRequest(token);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.current_page).toBe(1);
      expect(data.data.pagination.limit).toBe(20);
    });

    it("should use custom pagination values", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([]);
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(50);

      const request = createRequest(token, { page: "2", limit: "10" });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.current_page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.total_pages).toBe(5);

      // Verify skip and take
      expect(vi.mocked(prisma.dailyReport.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
    });
  });
});

describe("POST /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token: string, body: unknown): NextRequest => {
    return new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Authentication", () => {
    it("should return 401 without token", async () => {
      const request = new NextRequest("http://localhost:3000/api/reports", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should return 400 when reportDate is missing", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      const request = createRequest(token, {
        monitoringRecords: [{ serverId: 1, monitoringContent: "Test" }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when monitoringRecords is empty", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      const request = createRequest(token, {
        reportDate: "2025-12-31",
        monitoringRecords: [],
      });

      const response = await POST(request);
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

      // Mock server lookup - return empty array (servers not found)
      vi.mocked(prisma.discordServer.findMany).mockResolvedValue([]);

      const request = createRequest(token, {
        reportDate: "2025-12-31",
        monitoringRecords: [
          { serverId: 999, monitoringContent: "Test" },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toContain("Server(s) not found");
    });
  });

  describe("Successful creation", () => {
    it("should create report with monitoring records", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      // Mock server lookup
      vi.mocked(prisma.discordServer.findMany).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ] as any);

      const mockReport = {
        id: 1,
        userId: 1,
        reportDate: new Date("2025-12-31"),
        problem: "Test problem",
        plan: "Test plan",
        createdAt: new Date(),
        updatedAt: new Date(),
        monitoringRecords: [
          { id: 1, serverId: 1, monitoringContent: "Content 1" },
          { id: 2, serverId: 2, monitoringContent: "Content 2" },
        ],
      };

      vi.mocked(prisma.dailyReport.create).mockResolvedValue(mockReport as any);

      const request = createRequest(token, {
        reportDate: "2025-12-31",
        problem: "Test problem",
        plan: "Test plan",
        monitoringRecords: [
          { serverId: 1, monitoringContent: "Content 1" },
          { serverId: 2, monitoringContent: "Content 2" },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.report_id).toBe(1);
      expect(data.data.user_id).toBe(1);
      expect(data.data.problem).toBe("Test problem");
      expect(data.data.plan).toBe("Test plan");

      // Verify create was called with correct data
      expect(vi.mocked(prisma.dailyReport.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            reportDate: new Date("2025-12-31"),
            problem: "Test problem",
            plan: "Test plan",
          }),
        })
      );
    });

    it("should create report without problem and plan (optional)", async () => {
      const token = signToken({
        userId: 1,
        email: "staff@example.com",
        role: UserRole.STAFF,
      });

      vi.mocked(prisma.discordServer.findMany).mockResolvedValue([{ id: 1 }] as any);

      const mockReport = {
        id: 1,
        userId: 1,
        reportDate: new Date("2025-12-31"),
        problem: null,
        plan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        monitoringRecords: [
          { id: 1, serverId: 1, monitoringContent: "Content 1" },
        ],
      };

      vi.mocked(prisma.dailyReport.create).mockResolvedValue(mockReport as any);

      const request = createRequest(token, {
        reportDate: "2025-12-31",
        monitoringRecords: [
          { serverId: 1, monitoringContent: "Content 1" },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.problem).toBeNull();
      expect(data.data.plan).toBeNull();
    });
  });
});
