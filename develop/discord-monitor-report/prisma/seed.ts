import { PrismaClient, UserRole, CommentTarget } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.monitoringRecord.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.discordServer.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "山田太郎",
        email: "yamada@example.com",
        passwordHash: "$2a$10$XQqZQqZQqZQqZQqZQqZQqeu5vVJqVJqVJqVJqVJqVJqVJqVJqVJ", // dummy hash
        role: UserRole.STAFF,
      },
    }),
    prisma.user.create({
      data: {
        name: "佐藤花子",
        email: "sato@example.com",
        passwordHash: "$2a$10$XQqZQqZQqZQqZQqZQqZQqeu5vVJqVJqVJqVJqVJqVJqVJqVJqVJ", // dummy hash
        role: UserRole.STAFF,
      },
    }),
    prisma.user.create({
      data: {
        name: "鈴木一郎",
        email: "suzuki@example.com",
        passwordHash: "$2a$10$XQqZQqZQqZQqZQqZQqZQqeu5vVJqVJqVJqVJqVJqVJqVJqVJqVJ", // dummy hash
        role: UserRole.STAFF,
      },
    }),
    prisma.user.create({
      data: {
        name: "田中部長",
        email: "tanaka@example.com",
        passwordHash: "$2a$10$XQqZQqZQqZQqZQqZQqZQqeu5vVJqVJqVJqVJqVJqVJqVJqVJqVJ", // dummy hash
        role: UserRole.MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        name: "高橋課長",
        email: "takahashi@example.com",
        passwordHash: "$2a$10$XQqZQqZQqZQqZQqZQqZQqeu5vVJqVJqVJqVJqVJqVJqVJqVJqVJ", // dummy hash
        role: UserRole.MANAGER,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Discord Servers
  const servers = await Promise.all([
    prisma.discordServer.create({
      data: {
        serverName: "公式ゲームコミュニティ",
        description: "公式ゲームのメインDiscordサーバー",
        isActive: true,
      },
    }),
    prisma.discordServer.create({
      data: {
        serverName: "攻略情報共有サーバー",
        description: "ゲーム攻略情報を共有するコミュニティ",
        isActive: true,
      },
    }),
    prisma.discordServer.create({
      data: {
        serverName: "ファンアートサーバー",
        description: "ファンアートやクリエイティブ作品を共有",
        isActive: true,
      },
    }),
    prisma.discordServer.create({
      data: {
        serverName: "競技シーンサーバー",
        description: "eスポーツ・競技プレイヤー向けサーバー",
        isActive: true,
      },
    }),
    prisma.discordServer.create({
      data: {
        serverName: "雑談・交流サーバー",
        description: "カジュアルな雑談と交流のためのサーバー",
        isActive: true,
      },
    }),
    prisma.discordServer.create({
      data: {
        serverName: "旧イベントサーバー",
        description: "過去のイベント用サーバー（非アクティブ）",
        isActive: false,
      },
    }),
  ]);

  console.log(`✅ Created ${servers.length} Discord servers`);

  // Create Daily Reports with Monitoring Records
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Report 1: 山田太郎 - Today
  const report1 = await prisma.dailyReport.create({
    data: {
      userId: users[0].id,
      reportDate: today,
      problem: "公式ゲームコミュニティでスパム報告が増えています。モデレーターの対応が追いついていない状況です。",
      plan: "スパム対策のためのAutoModルールを設定し、モデレーターチームと対応方針を共有します。",
      monitoringRecords: {
        create: [
          {
            serverId: servers[0].id,
            monitoringContent:
              "アクティブユーザー数: 1,234名。新規質問スレッド15件。スパム報告3件を確認し削除対応完了。",
          },
          {
            serverId: servers[1].id,
            monitoringContent:
              "最新パッチノートについての議論が活発。攻略情報の共有30件。荒らし行為は見られず。",
          },
        ],
      },
    },
  });

  // Report 2: 佐藤花子 - Today
  const report2 = await prisma.dailyReport.create({
    data: {
      userId: users[1].id,
      reportDate: today,
      problem: "ファンアートサーバーで著作権に関する質問が多く寄せられています。ガイドラインの明確化が必要です。",
      plan: "著作権ガイドラインのFAQを作成し、サーバー内に固定投稿として掲載します。",
      monitoringRecords: {
        create: [
          {
            serverId: servers[2].id,
            monitoringContent:
              "新規ファンアート投稿20件。著作権に関する質問5件に回答。優秀作品をピックアップして紹介。",
          },
          {
            serverId: servers[4].id,
            monitoringContent: "雑談チャンネルで交流イベントの企画提案あり。参加者の反応良好。",
          },
        ],
      },
    },
  });

  // Report 3: 鈴木一郎 - Today
  const report3 = await prisma.dailyReport.create({
    data: {
      userId: users[2].id,
      reportDate: today,
      problem: null,
      plan: "競技シーンサーバーで予定されているトーナメントの告知を行い、参加者を募集します。",
      monitoringRecords: {
        create: [
          {
            serverId: servers[3].id,
            monitoringContent:
              "トーナメント参加希望者12名。ルール確認の質問対応。練習マッチのスケジュール調整中。",
          },
        ],
      },
    },
  });

  // Report 4: 山田太郎 - Yesterday
  const report4 = await prisma.dailyReport.create({
    data: {
      userId: users[0].id,
      reportDate: yesterday,
      problem: "公式サーバーでサーバーダウン時の対応について不満の声がありました。",
      plan: "サーバーメンテナンス情報の通知方法を改善し、事前告知を徹底します。",
      monitoringRecords: {
        create: [
          {
            serverId: servers[0].id,
            monitoringContent:
              "アクティブユーザー数: 1,189名。メンテナンス後の問い合わせ対応20件。",
          },
          {
            serverId: servers[1].id,
            monitoringContent: "新パッチの攻略情報が多数投稿される。活発な議論が継続中。",
          },
        ],
      },
    },
  });

  // Report 5: 佐藤花子 - Yesterday
  const report5 = await prisma.dailyReport.create({
    data: {
      userId: users[1].id,
      reportDate: yesterday,
      problem: null,
      plan: "ファンアートコンテストの企画を進めます。",
      monitoringRecords: {
        create: [
          {
            serverId: servers[2].id,
            monitoringContent: "新規ファンアート投稿18件。コンテスト企画への反応を確認中。",
          },
        ],
      },
    },
  });

  // Report 6: 鈴木一郎 - Two days ago
  const report6 = await prisma.dailyReport.create({
    data: {
      userId: users[2].id,
      reportDate: twoDaysAgo,
      problem: "競技シーンサーバーのボイスチャンネルで音質問題の報告が複数ありました。",
      plan: "ボイスチャンネルの設定を見直し、推奨設定ガイドを作成します。",
      monitoringRecords: {
        create: [
          {
            serverId: servers[3].id,
            monitoringContent: "練習マッチ実施3回。音質改善のための設定変更を実施。",
          },
          {
            serverId: servers[4].id,
            monitoringContent: "雑談チャンネルで新メンバー歓迎。自己紹介8件。",
          },
        ],
      },
    },
  });

  console.log(`✅ Created 6 daily reports with monitoring records`);

  // Create Comments from Managers
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        reportId: report1.id,
        userId: users[3].id, // 田中部長
        targetField: CommentTarget.PROBLEM,
        commentText:
          "スパム対策、重要ですね。AutoModの設定内容を確認させてください。必要であれば追加のモデレーター採用も検討しましょう。",
      },
    }),
    prisma.comment.create({
      data: {
        reportId: report1.id,
        userId: users[3].id, // 田中部長
        targetField: CommentTarget.PLAN,
        commentText:
          "良い対応計画です。AutoModルールは段階的に導入し、誤検知がないか慎重に確認してください。",
      },
    }),
    prisma.comment.create({
      data: {
        reportId: report2.id,
        userId: users[4].id, // 高橋課長
        targetField: CommentTarget.PROBLEM,
        commentText:
          "著作権ガイドラインは法務部門と相談して作成しましょう。ドラフトができたら共有してください。",
      },
    }),
    prisma.comment.create({
      data: {
        reportId: report2.id,
        userId: users[4].id, // 高橋課長
        targetField: CommentTarget.PLAN,
        commentText: "FAQの作成、賛成です。視覚的にわかりやすい図解もあると良いですね。",
      },
    }),
    prisma.comment.create({
      data: {
        reportId: report4.id,
        userId: users[3].id, // 田中部長
        targetField: CommentTarget.PROBLEM,
        commentText:
          "メンテナンス時の対応は今後も課題になりそうです。定型文を用意しておくと良いでしょう。",
      },
    }),
    prisma.comment.create({
      data: {
        reportId: report6.id,
        userId: users[4].id, // 高橋課長
        targetField: CommentTarget.PROBLEM,
        commentText: "音質問題の対応お疲れ様です。推奨設定ガイドはナレッジベースに追加しましょう。",
      },
    }),
  ]);

  console.log(`✅ Created ${comments.length} comments`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  - Users: ${users.length} (3 STAFF, 2 MANAGER)`);
  console.log(`  - Discord Servers: ${servers.length} (5 active, 1 inactive)`);
  console.log(`  - Daily Reports: 6`);
  console.log(`  - Monitoring Records: 11`);
  console.log(`  - Comments: ${comments.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
