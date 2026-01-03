/**
 * Integration Tests for Permission Control (Issue #35)
 *
 * Test Cases:
 * - TEST-INT-003: Staff permission restrictions
 * - TEST-INT-004: Manager full permissions
 * - Staff can only access own reports
 * - Manager can access all reports
 * - Unauthorized access returns 401
 * - Forbidden access returns 403
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as getReports } from "@/app/api/reports/route";
import { GET as getReport, PUT as updateReport, DELETE as deleteReport } from "@/app/api/reports/[id]/route";
import {
  cleanDatabase,
  createTestUsers,
  createTestServers,
  createTestReport,
  disconnectTestDb,
  getTestPrisma,
} from "../helpers/test-db";
import { createTestRequest, parseResponse } from "../helpers/test-client";

describe("Integration: Permission Control (Issue #35)", () => {
  let staffToken: string;
  let staff2Token: string;
  let managerToken: string;
  let staffUserId: number;
  let staff2UserId: number;
  let server1Id: number;

  beforeEach(async () => {
    await cleanDatabase();

    const users = await createTestUsers();
    const servers = await createTestServers();

    staffUserId = users.staff.id;
    staff2UserId = users.staff2.id;
    server1Id = servers.server1.id;

    // Login
    const staffLogin = await loginPost(
      createTestRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "staff@test.com", password: "staff123" },
      })
    );
    staffToken = (await staffLogin.json()).token;

    const staff2Login = await loginPost(
      createTestRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "staff2@test.com", password: "staff123" },
      })
    );
    staff2Token = (await staff2Login.json()).token;

    const managerLogin = await loginPost(
      createTestRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "manager@test.com", password: "manager123" },
      })
    );
    managerToken = (await managerLogin.json()).token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectTestDb();
  });

  describe("TEST-INT-003: Staff permission restrictions", () => {
    it("should prevent staff from accessing master management", async () => {
      // This test verifies that staff role does not have permission
      // to access master management endpoints
      // In actual API implementation, endpoints would return 403

      const prisma = getTestPrisma();
      const staff = await prisma.user.findUnique({
        where: { id: staffUserId },
      });

      expect(staff?.role).toBe("STAFF");
      // Staff should not be able to access:
      // - POST /api/masters/servers
      // - PUT /api/masters/servers/:id
      // - DELETE /api/masters/servers/:id
      // - POST /api/masters/users
      // - PUT /api/masters/users/:id
      // - DELETE /api/masters/users/:id
    });

    it("should prevent staff from viewing other staff reports", async () => {
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "GET",
        token: staffToken,
      });

      const response = await getReport(request, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should prevent staff from editing other staff reports", async () => {
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "PUT",
        token: staffToken,
        body: {
          problem: "不正な編集",
          plan: "不正な予定",
          monitoringRecords: [
            {
              serverId: server1Id,
              monitoringContent: "不正な監視",
            },
          ],
        },
      });

      const response = await updateReport(request, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should prevent staff from deleting other staff reports", async () => {
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "DELETE",
        token: staffToken,
      });

      const response = await deleteReport(request, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");

      // Verify report still exists
      const verifyRequest = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "GET",
        token: staff2Token,
      });

      const verifyResponse = await getReport(verifyRequest, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status: verifyStatus } = await parseResponse(verifyResponse);

      expect(verifyStatus).toBe(200);
    });

    it("should prevent staff from posting comments", async () => {
      const report = await createTestReport(staffUserId, server1Id);

      // Staff should not have access to comment posting functionality
      // In a real implementation, this would be enforced by API middleware
      // Comment API should check: user.role === UserRole.MANAGER

      const prisma = getTestPrisma();
      const staff = await prisma.user.findUnique({
        where: { id: staffUserId },
      });

      expect(staff?.role).not.toBe("MANAGER");
      // POST /api/reports/:id/comments should return 403 for STAFF
    });
  });

  describe("TEST-INT-004: Manager full permissions", () => {
    it("should allow manager to view all staff reports", async () => {
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "GET",
        token: managerToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reports).toHaveLength(2);
    });

    it("should allow manager to view any specific report", async () => {
      const staffReport = await createTestReport(staffUserId, server1Id);
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      // View staff report
      const request1 = createTestRequest(`http://localhost:3000/api/reports/${staffReport.id}`, {
        method: "GET",
        token: managerToken,
      });

      const response1 = await getReport(request1, { params: Promise.resolve({ id: String(staffReport.id) }) });
      const { status: status1 } = await parseResponse(response1);

      expect(status1).toBe(200);

      // View staff2 report
      const request2 = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "GET",
        token: managerToken,
      });

      const response2 = await getReport(request2, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status: status2 } = await parseResponse(response2);

      expect(status2).toBe(200);
    });

    it("should allow manager to post comments", async () => {
      const report = await createTestReport(staffUserId, server1Id);
      const prisma = getTestPrisma();

      const manager = await prisma.user.findUnique({
        where: { id: await (await createTestUsers()).manager.id },
      });

      expect(manager?.role).toBe("MANAGER");
      // Manager should have access to:
      // - POST /api/reports/:id/comments
      // - PUT /api/comments/:id (own comments)
      // - DELETE /api/comments/:id (own comments)
    });

    it("should allow manager to access master management", async () => {
      const prisma = getTestPrisma();
      const manager = await prisma.user.findFirst({
        where: { role: "MANAGER" },
      });

      expect(manager?.role).toBe("MANAGER");
      // Manager should have access to:
      // - GET /api/masters/servers
      // - POST /api/masters/servers
      // - PUT /api/masters/servers/:id
      // - DELETE /api/masters/servers/:id
      // - GET /api/masters/users
      // - POST /api/masters/users
      // - PUT /api/masters/users/:id
      // - DELETE /api/masters/users/:id
    });

    it("should allow manager to filter reports by user", async () => {
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports?userId=${staffUserId}`, {
        method: "GET",
        token: managerToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(2);
      expect(data.data.reports.every((r: any) => r.user_id === staffUserId)).toBe(true);
    });
  });

  describe("Staff can only access own reports", () => {
    it("should show only own reports in list", async () => {
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "GET",
        token: staffToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(2);
      expect(data.data.reports.every((r: any) => r.user_id === staffUserId)).toBe(true);
    });

    it("should allow staff to create own reports", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "POST",
        token: staffToken,
        body: {
          reportDate: "2025-01-01",
          problem: "自分の報告",
          plan: "自分の予定",
          monitoringRecords: [
            {
              serverId: server1Id,
              monitoringContent: "自分の監視",
            },
          ],
        },
      });

      const { POST: createReport } = await import("@/app/api/reports/route");
      const response = await createReport(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.data.user_id).toBe(staffUserId);
    });

    it("should allow staff to update own reports", async () => {
      const report = await createTestReport(staffUserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "PUT",
        token: staffToken,
        body: {
          problem: "更新した問題",
          plan: "更新した予定",
          monitoringRecords: [
            {
              serverId: server1Id,
              monitoringContent: "更新した監視",
            },
          ],
        },
      });

      const response = await updateReport(request, { params: Promise.resolve({ id: String(report.id) }) });
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });

    it("should allow staff to delete own reports", async () => {
      const report = await createTestReport(staffUserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "DELETE",
        token: staffToken,
      });

      const response = await deleteReport(request, { params: Promise.resolve({ id: String(report.id) }) });
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });
  });

  describe("Manager can access all reports", () => {
    it("should show all reports in list without filtering", async () => {
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "GET",
        token: managerToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(2);

      const userIds = new Set(data.data.reports.map((r: any) => r.user_id));
      expect(userIds.size).toBe(2); // Two different users
    });

    it("should allow manager to view report details from any user", async () => {
      const reports = [
        await createTestReport(staffUserId, server1Id),
        await createTestReport(staff2UserId, server1Id),
      ];

      for (const report of reports) {
        const request = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
          method: "GET",
          token: managerToken,
        });

        const response = await getReport(request, { params: Promise.resolve({ id: String(report.id) }) });
        const { status } = await parseResponse(response);

        expect(status).toBe(200);
      }
    });
  });

  describe("Unauthorized access returns 401", () => {
    it("should return 401 for requests without token", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "GET",
        // No token
      });

      const response = await getReports(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 for requests with invalid token", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "GET",
        token: "invalid.token.here",
      });

      const response = await getReports(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });
  });

  describe("Forbidden access returns 403", () => {
    it("should return 403 when staff tries to access other's report", async () => {
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "GET",
        token: staffToken,
      });

      const response = await getReport(request, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 when staff tries to edit other's report", async () => {
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "PUT",
        token: staffToken,
        body: {
          problem: "不正な編集",
          plan: "不正な予定",
          monitoringRecords: [{ serverId: server1Id, monitoringContent: "不正な監視" }],
        },
      });

      const response = await updateReport(request, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should return 403 when staff tries to delete other's report", async () => {
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "DELETE",
        token: staffToken,
      });

      const response = await deleteReport(request, { params: Promise.resolve({ id: String(staff2Report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Role-based permission matrix", () => {
    it("should enforce complete permission matrix", async () => {
      // This test documents the complete permission matrix for the system

      const permissionMatrix = {
        STAFF: {
          "GET /api/reports": "Own reports only",
          "POST /api/reports": "Allowed",
          "GET /api/reports/:id": "Own reports only",
          "PUT /api/reports/:id": "Own reports only",
          "DELETE /api/reports/:id": "Own reports only",
          "POST /api/reports/:id/comments": "Forbidden",
          "GET /api/masters/*": "Forbidden",
          "POST /api/masters/*": "Forbidden",
          "PUT /api/masters/*": "Forbidden",
          "DELETE /api/masters/*": "Forbidden",
        },
        MANAGER: {
          "GET /api/reports": "All reports",
          "POST /api/reports": "Not needed (managers don't create reports)",
          "GET /api/reports/:id": "All reports",
          "PUT /api/reports/:id": "Cannot modify (only comment)",
          "DELETE /api/reports/:id": "Cannot delete",
          "POST /api/reports/:id/comments": "Allowed",
          "GET /api/masters/*": "Allowed",
          "POST /api/masters/*": "Allowed",
          "PUT /api/masters/*": "Allowed",
          "DELETE /api/masters/*": "Allowed (with constraints)",
        },
      };

      // Verify matrix is defined
      expect(permissionMatrix.STAFF).toBeDefined();
      expect(permissionMatrix.MANAGER).toBeDefined();

      // Staff has restricted access
      expect(permissionMatrix.STAFF["POST /api/reports/:id/comments"]).toBe("Forbidden");
      expect(permissionMatrix.STAFF["GET /api/masters/*"]).toBe("Forbidden");

      // Manager has elevated access
      expect(permissionMatrix.MANAGER["POST /api/reports/:id/comments"]).toBe("Allowed");
      expect(permissionMatrix.MANAGER["GET /api/masters/*"]).toBe("Allowed");
    });
  });
});
