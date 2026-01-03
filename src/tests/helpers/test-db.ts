/**
 * Test database utilities for integration tests
 * Provides utilities for database setup, cleanup, and seeding
 */

import { PrismaClient, UserRole, CommentTarget } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";

// Use a singleton pattern for test database
let prismaClient: PrismaClient | null = null;

/**
 * Get or create Prisma client for tests
 */
export function getTestPrisma(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prismaClient;
}

/**
 * Clean all tables in the database
 */
export async function cleanDatabase() {
  const prisma = getTestPrisma();

  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.comment.deleteMany();
    await prisma.monitoringRecord.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.discordServer.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error("Failed to clean database:", error);
    throw new Error(
      `Database cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectTestDb() {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

/**
 * Create test user fixtures with unique identifiers
 */
export async function createTestUsers() {
  const prisma = getTestPrisma();
  const testRunId = Date.now();

  const staffPassword = await hashPassword("staff123");
  const managerPassword = await hashPassword("manager123");

  const staff = await prisma.user.create({
    data: {
      name: `Test Staff ${testRunId}`,
      email: `staff-${testRunId}@test.com`,
      passwordHash: staffPassword,
      role: UserRole.STAFF,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      name: `Test Staff 2 ${testRunId}`,
      email: `staff2-${testRunId}@test.com`,
      passwordHash: staffPassword,
      role: UserRole.STAFF,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: `Test Manager ${testRunId}`,
      email: `manager-${testRunId}@test.com`,
      passwordHash: managerPassword,
      role: UserRole.MANAGER,
    },
  });

  return { staff, staff2, manager };
}

/**
 * Create test Discord server fixtures
 */
export async function createTestServers() {
  const prisma = getTestPrisma();

  const server1 = await prisma.discordServer.create({
    data: {
      serverName: "Test Server 1",
      description: "Test server description 1",
      isActive: true,
    },
  });

  const server2 = await prisma.discordServer.create({
    data: {
      serverName: "Test Server 2",
      description: "Test server description 2",
      isActive: true,
    },
  });

  const server3 = await prisma.discordServer.create({
    data: {
      serverName: "Inactive Server",
      description: "Inactive test server",
      isActive: false,
    },
  });

  return { server1, server2, server3 };
}

/**
 * Create test daily report with monitoring records
 */
export async function createTestReport(
  userId: number,
  serverId: number,
  options?: {
    reportDate?: Date;
    problem?: string;
    plan?: string;
    monitoringContent?: string;
  }
) {
  const prisma = getTestPrisma();

  const report = await prisma.dailyReport.create({
    data: {
      userId,
      reportDate: options?.reportDate || new Date(),
      problem: options?.problem || "Test problem",
      plan: options?.plan || "Test plan",
      monitoringRecords: {
        create: [
          {
            serverId,
            monitoringContent: options?.monitoringContent || "Test monitoring content",
          },
        ],
      },
    },
    include: {
      monitoringRecords: {
        include: {
          discordServer: true,
        },
      },
    },
  });

  return report;
}

/**
 * Create test comment
 */
export async function createTestComment(
  reportId: number,
  userId: number,
  options?: {
    targetField?: CommentTarget;
    commentText?: string;
  }
) {
  const prisma = getTestPrisma();

  const comment = await prisma.comment.create({
    data: {
      reportId,
      userId,
      targetField: options?.targetField || CommentTarget.PROBLEM,
      commentText: options?.commentText || "Test comment",
    },
  });

  return comment;
}

/**
 * Seed complete test dataset
 */
export async function seedTestData() {
  const users = await createTestUsers();
  const servers = await createTestServers();

  // Create reports for staff user
  const report1 = await createTestReport(users.staff.id, servers.server1.id, {
    reportDate: new Date("2025-01-01"),
    problem: "スパム投稿が増加傾向",
    plan: "自動検知ツールの設定見直し",
  });

  const report2 = await createTestReport(users.staff.id, servers.server2.id, {
    reportDate: new Date("2025-01-02"),
    problem: "新規ルールの周知が必要",
    plan: "告知メッセージの作成",
  });

  // Create report for staff2
  const report3 = await createTestReport(users.staff2.id, servers.server1.id, {
    reportDate: new Date("2025-01-01"),
    problem: "モデレーション対応件数が増加",
    plan: "対応フローの見直し",
  });

  // Create comments from manager
  await createTestComment(report1.id, users.manager.id, {
    targetField: CommentTarget.PROBLEM,
    commentText: "来週の定例会議で議論しましょう",
  });

  return { users, servers, reports: [report1, report2, report3] };
}
