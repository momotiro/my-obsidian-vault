import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { verifyToken } from "@/lib/auth/jwt";
import { UserRole } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown): NextRequest => {
    return new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Successful login", () => {
    it("should login with valid credentials", async () => {
      const password = "password123";
      const passwordHash = await hashPassword(password);

      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        role: UserRole.STAFF,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const request = createRequest({
        email: "test@example.com",
        password: password,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBeTruthy();
      expect(data.user).toBeTruthy();
      expect(data.user.id).toBe(mockUser.id);
      expect(data.user.name).toBe(mockUser.name);
      expect(data.user.email).toBe(mockUser.email);
      expect(data.user.role).toBe(mockUser.role);
      expect(data.user.passwordHash).toBeUndefined(); // Should not return password hash

      // Verify token is valid
      const decoded = verifyToken(data.token);
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it("should login MANAGER user", async () => {
      const password = "managerpass";
      const passwordHash = await hashPassword(password);

      const mockManager = {
        id: 2,
        name: "Manager User",
        email: "manager@example.com",
        passwordHash,
        role: UserRole.MANAGER,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockManager);

      const request = createRequest({
        email: "manager@example.com",
        password: password,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe(UserRole.MANAGER);

      const decoded = verifyToken(data.token);
      expect(decoded.role).toBe(UserRole.MANAGER);
    });
  });

  describe("Failed login", () => {
    it("should reject invalid email", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = createRequest({
        email: "nonexistent@example.com",
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid email or password");
      expect(data.token).toBeUndefined();
    });

    it("should reject invalid password", async () => {
      const correctPassword = "correctpass";
      const passwordHash = await hashPassword(correctPassword);

      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        role: UserRole.STAFF,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const request = createRequest({
        email: "test@example.com",
        password: "wrongpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid email or password");
      expect(data.token).toBeUndefined();
    });
  });

  describe("Validation errors", () => {
    it("should reject missing email", async () => {
      const request = createRequest({
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeTruthy();
    });

    it("should reject missing password", async () => {
      const request = createRequest({
        email: "test@example.com",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeTruthy();
    });

    it("should reject invalid email format", async () => {
      const request = createRequest({
        email: "invalid-email",
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject empty password", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject missing body", async () => {
      const request = createRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });
  });

  describe("Database errors", () => {
    it("should handle database connection errors", async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = createRequest({
        email: "test@example.com",
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("Security", () => {
    it("should not reveal if email exists for invalid password", async () => {
      const password = "correctpass";
      const passwordHash = await hashPassword(password);

      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        role: UserRole.STAFF,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const request = createRequest({
        email: "test@example.com",
        password: "wrongpassword",
      });

      const response = await POST(request);
      const data = await response.json();

      // Should return same error message as non-existent email
      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid email or password");
    });

    it("should not reveal if email exists for non-existent user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = createRequest({
        email: "nonexistent@example.com",
        password: "password123",
      });

      const response = await POST(request);
      const data = await response.json();

      // Should return same error message as invalid password
      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid email or password");
    });
  });
});
