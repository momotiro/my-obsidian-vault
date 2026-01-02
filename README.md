# Discord監視日報システム - Phase 7: Integration Tests

This directory contains the integration tests implementation for Phase 7 of the Discord監視日報システム project.

## Overview

Phase 7 implements comprehensive integration tests covering all major system functionalities:

- **Issue #31**: Authentication flow integration tests
- **Issue #32**: Report CRUD operations integration tests
- **Issue #33**: Comment functionality integration tests
- **Issue #34**: Master management integration tests
- **Issue #35**: Permission control integration tests

## Test Structure

```
src/tests/
├── integration/          # Integration test suites
│   ├── auth.test.ts      # Authentication flow tests (Issue #31)
│   ├── reports.test.ts   # Report CRUD tests (Issue #32)
│   ├── comments.test.ts  # Comment functionality tests (Issue #33)
│   ├── masters.test.ts   # Master management tests (Issue #34)
│   └── permissions.test.ts # Permission control tests (Issue #35)
└── helpers/              # Test utilities
    ├── test-db.ts        # Database setup and fixtures
    └── test-client.ts    # HTTP client utilities
```

## Test Coverage

### Issue #31: Authentication Flow Tests
- Login with valid credentials (staff and manager)
- Login failure scenarios (invalid password, non-existent user)
- Token validation and verification
- Invalid/expired token handling
- Logout functionality
- Validation error handling

### Issue #32: Report CRUD Tests
- Create reports with monitoring records
- Validation errors (missing monitoring records)
- Get report list (staff sees own, manager sees all)
- Get report details with authorization checks
- Update own reports
- Delete own reports
- Date range filtering
- Pagination

### Issue #33: Comment Functionality Tests
- Manager posts comments on Problem/Plan fields
- Staff cannot post comments (permission check)
- Comments appear in report details
- Comment data integrity
- Cascade deletion with reports

### Issue #34: Master Management Tests
- Get server/user lists
- Create servers and users (manager only)
- Update master data
- Delete unused servers/users
- Prevent deletion of servers/users in use
- Data integrity and referential constraints

### Issue #35: Permission Control Tests
- Staff permission restrictions
  - Can only view/edit own reports
  - Cannot access master management
  - Cannot post comments
- Manager full permissions
  - Can view all reports
  - Can post comments
  - Can access master management
- Unauthorized access (401)
- Forbidden access (403)
- Complete permission matrix verification

## Running Tests

### Prerequisites

1. PostgreSQL database running
2. Test database created
3. Dependencies installed

```bash
npm install
```

### Setup Test Database

```bash
# Set environment variables
cp .env.test .env

# Generate Prisma client
npx prisma generate

# Create test database schema
npx prisma db push
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Authentication tests
npm test auth.test.ts

# Report CRUD tests
npm test reports.test.ts

# Comment tests
npm test comments.test.ts

# Master management tests
npm test masters.test.ts

# Permission control tests
npm test permissions.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

## Test Utilities

### Test Database (`test-db.ts`)

Provides utilities for:
- Database cleanup (`cleanDatabase()`)
- Creating test fixtures (`createTestUsers()`, `createTestServers()`, etc.)
- Seeding test data (`seedTestData()`)
- Database connection management

### Test Client (`test-client.ts`)

Provides utilities for:
- Creating mock HTTP requests (`createTestRequest()`)
- Authenticated API client (`TestApiClient`)
- Response parsing (`parseResponse()`)

## Test Data Fixtures

### Default Test Users

- **Staff**: `staff@test.com` / `staff123`
- **Staff 2**: `staff2@test.com` / `staff123`
- **Manager**: `manager@test.com` / `manager123`

### Default Test Servers

- **Server 1**: Active test server
- **Server 2**: Active test server
- **Server 3**: Inactive test server

## Integration Test Patterns

### Authentication Pattern

```typescript
// Login and get token
const loginResponse = await loginPost(
  createTestRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: { email: "staff@test.com", password: "staff123" },
  })
);
const { token } = await loginResponse.json();

// Use token for authenticated requests
const request = createTestRequest("http://localhost:3000/api/reports", {
  method: "GET",
  token,
});
```

### Database Cleanup Pattern

```typescript
beforeEach(async () => {
  await cleanDatabase();
  // Setup test data
});

afterAll(async () => {
  await cleanDatabase();
  await disconnectTestDb();
});
```

### Permission Testing Pattern

```typescript
// Test forbidden access
const response = await getReport(request, { params: { id: "123" } });
const { status, data } = await parseResponse(response);

expect(status).toBe(403);
expect(data.error.code).toBe("FORBIDDEN");
```

## Test Environment Configuration

The tests use a separate test database configured via `.env.test`:

```env
DATABASE_URL="postgresql://test:test@localhost:5432/discord_monitor_test"
JWT_SECRET="test-jwt-secret-key..."
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="test"
```

## Notes

- All tests use in-memory or separate test database
- Database is cleaned before each test to ensure isolation
- Tests are designed to run in parallel safely
- Mock data is created programmatically, not from fixtures
- All authentication is JWT-based with proper token validation

## Future Enhancements

- E2E tests with actual HTTP server
- Performance tests for large datasets
- Concurrency tests for simultaneous operations
- API rate limiting tests
- Data migration tests

## References

- [Test Specification (テスト仕様書.md)](../../develop/discord-monitor-report/テスト仕様書.md)
- [API Specification (API仕様書.md)](../../develop/discord-monitor-report/API仕様書.md)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
