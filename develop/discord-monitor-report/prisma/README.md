# Database Setup Guide

This directory contains the Prisma schema, migrations, and seed data for the Discord Monitor Report system.

## Files

- `schema.prisma` - Database schema definition
- `migrations/` - Database migration files
- `seed.ts` - Seed data for development/testing
- `../prisma.config.ts` - Prisma 7 configuration file

## Prerequisites

- PostgreSQL 12 or higher
- Node.js 18 or higher
- npm or pnpm

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/discord_monitor_report?schema=public"
JWT_SECRET="your-secret-key-here"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Setup Instructions

### 1. Generate Prisma Client

```bash
npm run db:generate
```

### 2. Run Migrations

```bash
npm run db:migrate
```

This will create all tables, indexes, and constraints in your database.

### 3. Seed the Database

```bash
npm run db:seed
```

This will populate the database with sample data:
- 5 users (3 STAFF, 2 MANAGER)
- 6 Discord servers (5 active, 1 inactive)
- 6 daily reports with monitoring records
- 6 manager comments

### 4. Reset Database (Optional)

To reset the database and re-run all migrations:

```bash
npm run db:reset
```

This will drop the database, recreate it, run all migrations, and execute the seed script.

## Database Schema

### Tables

1. **users** - Staff and managers
   - user_id (PK)
   - name, email, password_hash
   - role (STAFF | MANAGER)

2. **discord_servers** - Server master data
   - server_id (PK)
   - server_name, description
   - is_active

3. **daily_reports** - Daily reports
   - report_id (PK)
   - user_id (FK → users)
   - report_date
   - problem, plan

4. **monitoring_records** - Server monitoring entries
   - record_id (PK)
   - report_id (FK → daily_reports, CASCADE)
   - server_id (FK → discord_servers)
   - monitoring_content

5. **comments** - Manager comments
   - comment_id (PK)
   - report_id (FK → daily_reports, CASCADE)
   - user_id (FK → users)
   - target_field (PROBLEM | PLAN)
   - comment_text

### Relationships

- User → DailyReports (1:N)
- User → Comments (1:N)
- DailyReport → MonitoringRecords (1:N, CASCADE DELETE)
- DailyReport → Comments (1:N, CASCADE DELETE)
- DiscordServer → MonitoringRecords (1:N)

## Migration History

- `20260101000000_init` - Initial schema with all 5 models

## Development

To create a new migration:

```bash
npx prisma migrate dev --name <migration_name>
```

To view database in Prisma Studio:

```bash
npx prisma studio
```

## Testing

Database connection tests are located in `src/lib/__tests__/prisma.test.ts`.

Run tests with:

```bash
npm test
```

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Ensure the database exists: `createdb discord_monitor_report_test`

### Migration Issues

If migrations fail:
1. Check for existing data conflicts
2. Use `npm run db:reset` to start fresh
3. Verify database user has proper permissions

### Seed Issues

If seeding fails:
1. Ensure migrations are up to date
2. Check for unique constraint violations
3. Verify tsx is installed: `npm install tsx --save-dev`
