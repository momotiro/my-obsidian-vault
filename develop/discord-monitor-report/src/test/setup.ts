import "@testing-library/jest-dom";
import { expect, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Set up environment variables for testing
beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.JWT_SECRET = "test-jwt-secret-key-that-is-at-least-32-characters-long";
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  cleanup();
});
