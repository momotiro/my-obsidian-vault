import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../prisma";

describe("Prisma Database Connection", () => {
  beforeAll(async () => {
    // Ensure Prisma client is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.$disconnect();
  });

  it("should successfully connect to the database", async () => {
    // Test basic database connection by executing a simple query
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });

  it("should have the correct Prisma client instance", () => {
    expect(prisma).toBeInstanceOf(PrismaClient);
  });

  it("should execute queries successfully", async () => {
    // Test that we can query the database schema
    const tables = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;

    expect(Array.isArray(tables)).toBe(true);
  });

  it("should have all expected models available", () => {
    // Verify that all models are properly generated
    expect(prisma.user).toBeDefined();
    expect(prisma.discordServer).toBeDefined();
    expect(prisma.dailyReport).toBeDefined();
    expect(prisma.monitoringRecord).toBeDefined();
    expect(prisma.comment).toBeDefined();
  });

  it("should support transaction operations", async () => {
    // Test that transactions work
    const result = await prisma.$transaction(async (tx) => {
      // Just verify transaction context works
      const count = await tx.user.count();
      return count;
    });

    expect(typeof result).toBe("number");
  });

  describe("CRUD Operations", () => {
    it("should create and delete a user", async () => {
      // Create a test user
      const user = await prisma.user.create({
        data: {
          name: "Test User",
          email: `test-${Date.now()}@example.com`,
          passwordHash: "test-hash",
          role: "STAFF",
        },
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe("Test User");
      expect(user.role).toBe("STAFF");

      // Clean up
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Verify deletion
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(deletedUser).toBeNull();
    });

    it("should create a Discord server", async () => {
      // Create a test server
      const server = await prisma.discordServer.create({
        data: {
          serverName: "Test Server",
          description: "Test Description",
          isActive: true,
        },
      });

      expect(server).toBeDefined();
      expect(server.id).toBeDefined();
      expect(server.serverName).toBe("Test Server");
      expect(server.isActive).toBe(true);

      // Clean up
      await prisma.discordServer.delete({
        where: { id: server.id },
      });
    });

    it("should create a daily report with monitoring records", async () => {
      // Create test user and server first
      const user = await prisma.user.create({
        data: {
          name: "Report Test User",
          email: `report-test-${Date.now()}@example.com`,
          passwordHash: "test-hash",
          role: "STAFF",
        },
      });

      const server = await prisma.discordServer.create({
        data: {
          serverName: "Report Test Server",
          isActive: true,
        },
      });

      // Create daily report with monitoring record
      const report = await prisma.dailyReport.create({
        data: {
          userId: user.id,
          reportDate: new Date(),
          problem: "Test problem",
          plan: "Test plan",
          monitoringRecords: {
            create: [
              {
                serverId: server.id,
                monitoringContent: "Test monitoring content",
              },
            ],
          },
        },
        include: {
          monitoringRecords: true,
        },
      });

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.problem).toBe("Test problem");
      expect(report.monitoringRecords).toHaveLength(1);
      expect(report.monitoringRecords[0].monitoringContent).toBe(
        "Test monitoring content"
      );

      // Clean up (cascade delete should handle monitoring records)
      await prisma.dailyReport.delete({
        where: { id: report.id },
      });

      await prisma.discordServer.delete({
        where: { id: server.id },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });
    });

    it("should create comments on reports", async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          name: "Comment Test User",
          email: `comment-test-${Date.now()}@example.com`,
          passwordHash: "test-hash",
          role: "STAFF",
        },
      });

      const manager = await prisma.user.create({
        data: {
          name: "Manager Test User",
          email: `manager-test-${Date.now()}@example.com`,
          passwordHash: "test-hash",
          role: "MANAGER",
        },
      });

      const report = await prisma.dailyReport.create({
        data: {
          userId: user.id,
          reportDate: new Date(),
          problem: "Test problem for comment",
        },
      });

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          reportId: report.id,
          userId: manager.id,
          targetField: "PROBLEM",
          commentText: "Test comment from manager",
        },
      });

      expect(comment).toBeDefined();
      expect(comment.commentText).toBe("Test comment from manager");
      expect(comment.targetField).toBe("PROBLEM");

      // Clean up
      await prisma.comment.delete({
        where: { id: comment.id },
      });

      await prisma.dailyReport.delete({
        where: { id: report.id },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      await prisma.user.delete({
        where: { id: manager.id },
      });
    });
  });

  describe("Relations and Cascading", () => {
    it("should cascade delete monitoring records when report is deleted", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Cascade Test User",
          email: `cascade-${Date.now()}@example.com`,
          passwordHash: "test-hash",
          role: "STAFF",
        },
      });

      const server = await prisma.discordServer.create({
        data: {
          serverName: "Cascade Test Server",
          isActive: true,
        },
      });

      const report = await prisma.dailyReport.create({
        data: {
          userId: user.id,
          reportDate: new Date(),
          monitoringRecords: {
            create: [
              {
                serverId: server.id,
                monitoringContent: "Test content 1",
              },
              {
                serverId: server.id,
                monitoringContent: "Test content 2",
              },
            ],
          },
        },
      });

      // Verify records exist
      const recordsBefore = await prisma.monitoringRecord.findMany({
        where: { reportId: report.id },
      });
      expect(recordsBefore).toHaveLength(2);

      // Delete report
      await prisma.dailyReport.delete({
        where: { id: report.id },
      });

      // Verify records were cascade deleted
      const recordsAfter = await prisma.monitoringRecord.findMany({
        where: { reportId: report.id },
      });
      expect(recordsAfter).toHaveLength(0);

      // Clean up
      await prisma.discordServer.delete({
        where: { id: server.id },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });
    });
  });
});
