import "@testing-library/jest-dom";
import { expect, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Validate test environment before running tests
beforeAll(() => {
  // Fail fast if not in test environment
  if (process.env.NODE_ENV && process.env.NODE_ENV !== "test") {
    throw new Error(
      `Tests must run with NODE_ENV=test. Current: ${process.env.NODE_ENV}`
    );
  }

  // Validate DATABASE_URL is not production
  const dbUrl = process.env.DATABASE_URL || "";
  if (
    dbUrl.includes("production") ||
    dbUrl.includes("prod") ||
    dbUrl.includes("neon.tech")
  ) {
    throw new Error(
      "Refusing to run tests against production database. Please use a test database."
    );
  }

  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ||
    "test-jwt-secret-key-that-is-at-least-32-characters-long";
  process.env.NEXT_PUBLIC_API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
});

afterEach(() => {
  cleanup();
});
