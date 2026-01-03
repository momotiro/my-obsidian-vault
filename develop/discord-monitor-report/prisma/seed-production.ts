import "dotenv/config";
import { UserRole } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  console.log("Starting production seed...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

  // Create initial users
  const staffPassword = await hashPassword("staff123");
  const managerPassword = await hashPassword("manager123");

  const staff = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      name: "担当者テスト",
      email: "staff@example.com",
      passwordHash: staffPassword,
      role: UserRole.STAFF,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      name: "上長テスト",
      email: "manager@example.com",
      passwordHash: managerPassword,
      role: UserRole.MANAGER,
    },
  });

  console.log("✓ Created users:");
  console.log(`  - Staff: ${staff.email} (password: staff123)`);
  console.log(`  - Manager: ${manager.email} (password: manager123)`);

  // Create initial Discord servers (using createMany which skips duplicates)
  const servers = [
    {
      serverName: "メインコミュニティ",
      description: "プライマリDiscordサーバー",
      isActive: true,
    },
    {
      serverName: "サブコミュニティ",
      description: "セカンダリDiscordサーバー",
      isActive: true,
    },
    {
      serverName: "テストサーバー",
      description: "開発・テスト用サーバー",
      isActive: false,
    },
  ];

  for (const server of servers) {
    await prisma.discordServer.upsert({
      where: {
        id: (
          await prisma.discordServer.findFirst({
            where: { serverName: server.serverName },
          })
        )?.id ?? 0,
      },
      update: server,
      create: server,
    });
  }

  const createdServers = await prisma.discordServer.findMany();
  console.log("✓ Created Discord servers:");
  createdServers.forEach((s) => {
    console.log(`  - ${s.serverName} (${s.isActive ? "Active" : "Inactive"})`);
  });

  console.log("\n✅ Production seed completed!");
  console.log("\nLogin credentials:");
  console.log("  Staff:   staff@example.com / staff123");
  console.log("  Manager: manager@example.com / manager123");
  console.log("\nApplication URL:");
  console.log("  https://discord-monitor-report-528834221704.asia-northeast1.run.app");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
