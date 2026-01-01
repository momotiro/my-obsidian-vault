import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../prisma";

/**
 * Phase 2 Database Setup Validation Tests
 *
 * These tests validate that all Phase 2 components are properly configured:
 * - Issue #6: Prisma schema
 * - Issue #7: Database migrations
 * - Issue #8: Prisma client singleton
 * - Issue #9: Seed data script
 * - Issue #10: Database connection testing
 */

describe("Phase 2: Database Setup Validation", () => {
  describe("Issue #6: Prisma Schema", () => {
    it("should have all required models defined", () => {
      // Verify all models are available in the Prisma client
      expect(prisma.user).toBeDefined();
      expect(prisma.discordServer).toBeDefined();
      expect(prisma.dailyReport).toBeDefined();
      expect(prisma.monitoringRecord).toBeDefined();
      expect(prisma.comment).toBeDefined();
    });

    it("should have proper TypeScript types generated", () => {
      // This compilation test verifies types are properly generated
      const mockUser: Parameters<typeof prisma.user.create>[0] = {
        data: {
          name: "Test",
          email: "test@test.com",
          passwordHash: "hash",
          role: "STAFF",
        },
      };

      expect(mockUser.data.role).toBe("STAFF");
    });
  });

  describe("Issue #7: Database Migrations", () => {
    it("should have migration files in correct location", async () => {
      // Check if migration directory exists
      const fs = await import("fs/promises");
      const path = await import("path");

      const migrationPath = path.resolve(
        process.cwd(),
        "prisma",
        "migrations",
        "20260101000000_init"
      );

      try {
        const stats = await fs.stat(migrationPath);
        expect(stats.isDirectory()).toBe(true);
      } catch (error) {
        throw new Error(`Migration directory not found: ${migrationPath}`);
      }
    });

    it("should have migration.sql file", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const sqlPath = path.resolve(
        process.cwd(),
        "prisma",
        "migrations",
        "20260101000000_init",
        "migration.sql"
      );

      const content = await fs.readFile(sqlPath, "utf-8");

      // Verify migration contains key SQL statements
      expect(content).toContain("CREATE TYPE \"UserRole\"");
      expect(content).toContain("CREATE TYPE \"CommentTarget\"");
      expect(content).toContain("CREATE TABLE \"users\"");
      expect(content).toContain("CREATE TABLE \"discord_servers\"");
      expect(content).toContain("CREATE TABLE \"daily_reports\"");
      expect(content).toContain("CREATE TABLE \"monitoring_records\"");
      expect(content).toContain("CREATE TABLE \"comments\"");
    });

    it("should have migration_lock.toml", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const lockPath = path.resolve(
        process.cwd(),
        "prisma",
        "migrations",
        "migration_lock.toml"
      );

      const content = await fs.readFile(lockPath, "utf-8");
      expect(content).toContain("postgresql");
    });
  });

  describe("Issue #8: Prisma Client Singleton", () => {
    it("should export a Prisma client instance", () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe("object");
    });

    it("should be a singleton instance", async () => {
      // Import prisma again using dynamic import
      const module = await import("../prisma");
      const prisma2 = module.prisma;

      // Should be the same instance
      expect(prisma).toBe(prisma2);
    });

    it("should have proper configuration", () => {
      // Verify client has necessary configuration
      expect(prisma.$connect).toBeDefined();
      expect(prisma.$disconnect).toBeDefined();
      expect(prisma.$transaction).toBeDefined();
      expect(prisma.$queryRaw).toBeDefined();
    });
  });

  describe("Issue #9: Seed Data Script", () => {
    it("should have seed.ts file", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const seedPath = path.resolve(process.cwd(), "prisma", "seed.ts");

      try {
        const stats = await fs.stat(seedPath);
        expect(stats.isFile()).toBe(true);
      } catch (error) {
        throw new Error(`Seed file not found: ${seedPath}`);
      }
    });

    it("should have seed script in package.json", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const pkgPath = path.resolve(process.cwd(), "package.json");
      const content = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.scripts["db:seed"]).toBeDefined();
      expect(pkg.scripts["db:seed"]).toContain("tsx prisma/seed.ts");
      expect(pkg.prisma?.seed).toBe("tsx prisma/seed.ts");
    });

    it("should import required Prisma types in seed", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const seedPath = path.resolve(process.cwd(), "prisma", "seed.ts");
      const content = await fs.readFile(seedPath, "utf-8");

      expect(content).toContain("import { PrismaClient");
      expect(content).toContain("UserRole");
      expect(content).toContain("CommentTarget");
    });

    it("should create comprehensive seed data", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const seedPath = path.resolve(process.cwd(), "prisma", "seed.ts");
      const content = await fs.readFile(seedPath, "utf-8");

      // Verify seed creates all types of data
      expect(content).toContain("prisma.user.create");
      expect(content).toContain("prisma.discordServer.create");
      expect(content).toContain("prisma.dailyReport.create");
      expect(content).toContain("prisma.comment.create");

      // Verify it includes both STAFF and MANAGER users
      expect(content).toContain("UserRole.STAFF");
      expect(content).toContain("UserRole.MANAGER");

      // Verify it includes comments on both fields
      expect(content).toContain("CommentTarget.PROBLEM");
      expect(content).toContain("CommentTarget.PLAN");
    });
  });

  describe("Issue #10: Database Connection Testing", () => {
    it("should have test file in correct location", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const testPath = path.resolve(
        process.cwd(),
        "src",
        "lib",
        "__tests__",
        "prisma.test.ts"
      );

      try {
        const stats = await fs.stat(testPath);
        expect(stats.isFile()).toBe(true);
      } catch (error) {
        throw new Error(`Test file not found: ${testPath}`);
      }
    });

    it("should have comprehensive test coverage", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const testPath = path.resolve(
        process.cwd(),
        "src",
        "lib",
        "__tests__",
        "prisma.test.ts"
      );
      const content = await fs.readFile(testPath, "utf-8");

      // Verify test includes connection tests
      expect(content).toContain("connect to the database");

      // Verify test includes CRUD operations
      expect(content).toContain("create and delete a user");
      expect(content).toContain("create a Discord server");
      expect(content).toContain("create a daily report");

      // Verify test includes cascade delete tests
      expect(content).toContain("cascade delete");

      // Verify test includes transaction tests
      expect(content).toContain("transaction");
    });
  });

  describe("Package Configuration", () => {
    it("should have all database scripts defined", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const pkgPath = path.resolve(process.cwd(), "package.json");
      const content = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.scripts["db:generate"]).toBe("prisma generate");
      expect(pkg.scripts["db:migrate"]).toBe("prisma migrate dev");
      expect(pkg.scripts["db:seed"]).toBe("tsx prisma/seed.ts");
      expect(pkg.scripts["db:reset"]).toBe("prisma migrate reset --force");
    });

    it("should have tsx installed", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const pkgPath = path.resolve(process.cwd(), "package.json");
      const content = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.devDependencies.tsx).toBeDefined();
    });

    it("should have Prisma 7.2.0 installed", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const pkgPath = path.resolve(process.cwd(), "package.json");
      const content = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);

      expect(pkg.dependencies["@prisma/client"]).toBe("^7.2.0");
      expect(pkg.dependencies.prisma).toBe("^7.2.0");
    });
  });

  describe("Environment Configuration", () => {
    it("should have .env.example file", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const envExamplePath = path.resolve(process.cwd(), ".env.example");

      try {
        const content = await fs.readFile(envExamplePath, "utf-8");
        expect(content).toContain("DATABASE_URL");
        expect(content).toContain("JWT_SECRET");
      } catch (error) {
        throw new Error(`.env.example file not found: ${envExamplePath}`);
      }
    });

    it("should have prisma.config.ts with correct format", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const configPath = path.resolve(process.cwd(), "prisma.config.ts");
      const content = await fs.readFile(configPath, "utf-8");

      // Verify Prisma 7 config format
      expect(content).toContain("defineConfig");
      expect(content).toContain("datasource");
      expect(content).toContain("process.env");
    });
  });

  describe("Documentation", () => {
    it("should have README in prisma directory", async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      const readmePath = path.resolve(process.cwd(), "prisma", "README.md");

      try {
        const content = await fs.readFile(readmePath, "utf-8");
        expect(content).toContain("Database Setup Guide");
        expect(content).toContain("npm run db:generate");
        expect(content).toContain("npm run db:migrate");
        expect(content).toContain("npm run db:seed");
      } catch (error) {
        throw new Error(`README not found: ${readmePath}`);
      }
    });
  });
});
