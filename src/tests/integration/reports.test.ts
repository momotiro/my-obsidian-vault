/**
 * Integration Tests for Report CRUD Operations (Issue #32)
 *
 * Test Cases:
 * - TEST-REPORT-001: Create report with monitoring records
 * - TEST-REPORT-002: Create report fails without monitoring records
 * - TEST-REPORT-003: Get report list as staff (own reports only)
 * - TEST-REPORT-004: Get report list as manager (all reports)
 * - TEST-REPORT-005: Get report detail
 * - TEST-REPORT-006: Update own report
 * - TEST-REPORT-007: Cannot update other user's report
 * - TEST-REPORT-008: Delete own report
 * - TEST-REPORT-009: Filter reports by date range
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as getReports, POST as createReport } from "@/app/api/reports/route";
import { GET as getReport, PUT as updateReport, DELETE as deleteReport } from "@/app/api/reports/[id]/route";
import {
  cleanDatabase,
  createTestUsers,
  createTestServers,
  createTestReport,
  disconnectTestDb,
} from "../helpers/test-db";
import { createTestRequest, parseResponse } from "../helpers/test-client";

describe("Integration: Report CRUD Operations (Issue #32)", () => {
  let staffToken: string;
  let staff2Token: string;
  let managerToken: string;
  let staffUserId: number;
  let staff2UserId: number;
  let server1Id: number;
  let server2Id: number;

  beforeEach(async () => {
    await cleanDatabase();

    // Create test users and servers
    const users = await createTestUsers();
    const servers = await createTestServers();

    staffUserId = users.staff.id;
    staff2UserId = users.staff2.id;
    server1Id = servers.server1.id;
    server2Id = servers.server2.id;

    // Login to get tokens
    const staffLogin = await loginPost(
      createTestRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "staff@test.com", password: "staff123" },
      })
    );
    const staffData = await staffLogin.json();
    staffToken = staffData.token;

    const staff2Login = await loginPost(
      createTestRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "staff2@test.com", password: "staff123" },
      })
    );
    const staff2Data = await staff2Login.json();
    staff2Token = staff2Data.token;

    const managerLogin = await loginPost(
      createTestRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "manager@test.com", password: "manager123" },
      })
    );
    const managerData = await managerLogin.json();
    managerToken = managerData.token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectTestDb();
  });

  describe("TEST-REPORT-001: Create report with monitoring records", () => {
    it("should create report with multiple monitoring records", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "POST",
        token: staffToken,
        body: {
          reportDate: "2025-01-01",
          problem: "スパム投稿が増加傾向",
          plan: "自動検知ツールの設定見直し",
          monitoringRecords: [
            {
              serverId: server1Id,
              monitoringContent: "ユーザー投稿のチェック\n不適切な画像3件削除",
            },
            {
              serverId: server2Id,
              monitoringContent: "新規メンバー5名参加\nルール違反なし",
            },
          ],
        },
      });

      const response = await createReport(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.report_id).toBeTruthy();
      expect(data.data.user_id).toBe(staffUserId);
      expect(data.data.report_date).toBe("2025-01-01");
      expect(data.data.problem).toBe("スパム投稿が増加傾向");
      expect(data.data.plan).toBe("自動検知ツールの設定見直し");
    });

    it("should create report with only one monitoring record", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "POST",
        token: staffToken,
        body: {
          reportDate: "2025-01-02",
          problem: null,
          plan: null,
          monitoringRecords: [
            {
              serverId: server1Id,
              monitoringContent: "通常の監視",
            },
          ],
        },
      });

      const response = await createReport(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe("TEST-REPORT-002: Create report fails without monitoring records", () => {
    it("should reject report with no monitoring records", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "POST",
        token: staffToken,
        body: {
          reportDate: "2025-01-01",
          problem: "問題なし",
          plan: "予定なし",
          monitoringRecords: [],
        },
      });

      const response = await createReport(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject report without monitoringRecords field", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "POST",
        token: staffToken,
        body: {
          reportDate: "2025-01-01",
          problem: "問題なし",
          plan: "予定なし",
        },
      });

      const response = await createReport(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe("TEST-REPORT-003: Get report list as staff (own reports only)", () => {
    it("should return only own reports for staff", async () => {
      // Create reports for different users
      await createTestReport(staffUserId, server1Id, {
        reportDate: new Date("2025-01-01"),
      });
      await createTestReport(staffUserId, server2Id, {
        reportDate: new Date("2025-01-02"),
      });
      await createTestReport(staff2UserId, server1Id, {
        reportDate: new Date("2025-01-01"),
      });

      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "GET",
        token: staffToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reports).toHaveLength(2);
      expect(data.data.reports.every((r: any) => r.user_id === staffUserId)).toBe(true);
      expect(data.data.pagination.total_count).toBe(2);
    });

    it("should not show other staff's reports", async () => {
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest("http://localhost:3000/api/reports", {
        method: "GET",
        token: staffToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(1);
      expect(data.data.reports[0].user_id).toBe(staffUserId);
    });
  });

  describe("TEST-REPORT-004: Get report list as manager (all reports)", () => {
    it("should return all reports for manager", async () => {
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
      expect(data.data.pagination.total_count).toBe(2);
    });

    it("should filter reports by userId when specified", async () => {
      await createTestReport(staffUserId, server1Id);
      await createTestReport(staffUserId, server2Id);
      await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(
        `http://localhost:3000/api/reports?userId=${staffUserId}`,
        {
          method: "GET",
          token: managerToken,
        }
      );

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(2);
      expect(data.data.reports.every((r: any) => r.user_id === staffUserId)).toBe(true);
    });
  });

  describe("TEST-REPORT-005: Get report detail", () => {
    it("should return detailed report information", async () => {
      const report = await createTestReport(staffUserId, server1Id, {
        problem: "詳細テスト",
        plan: "テスト計画",
      });

      const request = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "GET",
        token: staffToken,
      });

      const response = await getReport(request, { params: Promise.resolve({ id: String(report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.report_id).toBe(report.id);
      expect(data.data.problem).toBe("詳細テスト");
      expect(data.data.plan).toBe("テスト計画");
      expect(data.data.monitoring_records).toBeTruthy();
      expect(data.data.monitoring_records.length).toBeGreaterThan(0);
    });

    it("should return 404 for non-existent report", async () => {
      const request = createTestRequest("http://localhost:3000/api/reports/99999", {
        method: "GET",
        token: staffToken,
      });

      const response = await getReport(request, { params: Promise.resolve({ id: "99999" }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("REPORT_NOT_FOUND");
    });

    it("should prevent staff from viewing other staff's reports", async () => {
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

    it("should allow manager to view any report", async () => {
      const staffReport = await createTestReport(staffUserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staffReport.id}`, {
        method: "GET",
        token: managerToken,
      });

      const response = await getReport(request, { params: Promise.resolve({ id: String(staffReport.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("TEST-REPORT-006: Update own report", () => {
    it("should update own report successfully", async () => {
      const report = await createTestReport(staffUserId, server1Id, {
        problem: "元の問題",
        plan: "元の予定",
      });

      const request = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "PUT",
        token: staffToken,
        body: {
          problem: "更新後の問題",
          plan: "更新後の予定",
          monitoringRecords: [
            {
              serverId: server1Id,
              monitoringContent: "更新後の監視内容",
            },
          ],
        },
      });

      const response = await updateReport(request, { params: Promise.resolve({ id: String(report.id) }) });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.report_id).toBe(report.id);
      expect(data.data.updated_at).toBeTruthy();
    });

    it("should update monitoring records when editing report", async () => {
      const report = await createTestReport(staffUserId, server1Id);

      const updateRequest = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "PUT",
        token: staffToken,
        body: {
          problem: "変更なし",
          plan: "変更なし",
          monitoringRecords: [
            {
              serverId: server1Id,
              monitoringContent: "新しい監視1",
            },
            {
              serverId: server2Id,
              monitoringContent: "新しい監視2",
            },
          ],
        },
      });

      await updateReport(updateRequest, { params: Promise.resolve({ id: String(report.id) }) });

      // Verify the changes
      const getRequest = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "GET",
        token: staffToken,
      });

      const getResponse = await getReport(getRequest, { params: Promise.resolve({ id: String(report.id) }) });
      const { data } = await parseResponse(getResponse);

      expect(data.data.monitoring_records).toHaveLength(2);
    });
  });

  describe("TEST-REPORT-007: Cannot update other user's report", () => {
    it("should reject update to other staff's report", async () => {
      const staff2Report = await createTestReport(staff2UserId, server1Id);

      const request = createTestRequest(`http://localhost:3000/api/reports/${staff2Report.id}`, {
        method: "PUT",
        token: staffToken,
        body: {
          problem: "不正な更新",
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
  });

  describe("TEST-REPORT-008: Delete own report", () => {
    it("should delete own report successfully", async () => {
      const report = await createTestReport(staffUserId, server1Id);

      const deleteRequest = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "DELETE",
        token: staffToken,
      });

      const deleteResponse = await deleteReport(deleteRequest, { params: Promise.resolve({ id: String(report.id) }) });
      const { status, data } = await parseResponse(deleteResponse);

      expect(status).toBe(200);
      expect(data.success).toBe(true);

      // Verify report is deleted
      const getRequest = createTestRequest(`http://localhost:3000/api/reports/${report.id}`, {
        method: "GET",
        token: staffToken,
      });

      const getResponse = await getReport(getRequest, { params: Promise.resolve({ id: String(report.id) }) });
      const { status: getStatus } = await parseResponse(getResponse);

      expect(getStatus).toBe(404);
    });

    it("should not allow deleting other user's report", async () => {
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
    });
  });

  describe("TEST-REPORT-009: Filter reports by date range", () => {
    it("should filter reports by date range", async () => {
      await createTestReport(staffUserId, server1Id, {
        reportDate: new Date("2025-01-01"),
      });
      await createTestReport(staffUserId, server1Id, {
        reportDate: new Date("2025-01-15"),
      });
      await createTestReport(staffUserId, server1Id, {
        reportDate: new Date("2025-02-01"),
      });

      const request = createTestRequest(
        "http://localhost:3000/api/reports?startDate=2025-01-01&endDate=2025-01-31",
        {
          method: "GET",
          token: staffToken,
        }
      );

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(2);
    });

    it("should handle startDate only filter", async () => {
      await createTestReport(staffUserId, server1Id, {
        reportDate: new Date("2025-01-01"),
      });
      await createTestReport(staffUserId, server1Id, {
        reportDate: new Date("2025-01-15"),
      });

      const request = createTestRequest("http://localhost:3000/api/reports?startDate=2025-01-10", {
        method: "GET",
        token: staffToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(1);
      expect(data.data.reports[0].report_date).toBe("2025-01-15");
    });
  });

  describe("Pagination", () => {
    it("should paginate report list", async () => {
      // Create 25 reports
      for (let i = 1; i <= 25; i++) {
        await createTestReport(staffUserId, server1Id, {
          reportDate: new Date(`2025-01-${String(i).padStart(2, "0")}`),
        });
      }

      const request = createTestRequest("http://localhost:3000/api/reports?page=1&limit=10", {
        method: "GET",
        token: staffToken,
      });

      const response = await getReports(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data.reports).toHaveLength(10);
      expect(data.data.pagination.current_page).toBe(1);
      expect(data.data.pagination.total_count).toBe(25);
      expect(data.data.pagination.total_pages).toBe(3);
    });
  });
});
