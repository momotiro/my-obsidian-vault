import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { authenticate, authorize, authenticateAndAuthorize, withAuth } from "./auth";
import { signToken } from "@/lib/auth/jwt";
import { UserRole } from "@prisma/client";
import type { JwtPayload } from "@/lib/auth/jwt";

// Helper to create mock NextRequest with Authorization header
function createMockRequest(authHeader: string | null): NextRequest {
  const headers = new Headers();
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  return new NextRequest("http://localhost:3000/api/test", {
    method: "GET",
    headers,
  });
}

describe("Authentication Middleware", () => {
  const mockUser: JwtPayload = {
    userId: 1,
    email: "test@example.com",
    role: UserRole.STAFF,
  };

  describe("authenticate", () => {
    it("should authenticate valid token", async () => {
      const token = signToken(mockUser);
      const request = createMockRequest(`Bearer ${token}`);
      const { user, error } = await authenticate(request);

      expect(error).toBeNull();
      expect(user).toBeTruthy();
      expect(user?.userId).toBe(mockUser.userId);
      expect(user?.email).toBe(mockUser.email);
      expect(user?.role).toBe(mockUser.role);
    });

    it("should reject request without Authorization header", async () => {
      const request = createMockRequest(null);
      const { user, error } = await authenticate(request);

      expect(user).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.status).toBe(401);
    });

    it("should reject invalid token format", async () => {
      const request = createMockRequest("InvalidToken");
      const { user, error } = await authenticate(request);

      expect(user).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.status).toBe(401);
    });

    it("should reject malformed JWT", async () => {
      const request = createMockRequest("Bearer invalid.jwt.token");
      const { user, error } = await authenticate(request);

      expect(user).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.status).toBe(401);
    });

    it("should reject token without Bearer prefix", async () => {
      const token = signToken(mockUser);
      const request = createMockRequest(token); // Missing "Bearer "
      const { user, error } = await authenticate(request);

      expect(user).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe("authorize", () => {
    it("should authorize user with correct role", () => {
      const error = authorize(mockUser, [UserRole.STAFF]);
      expect(error).toBeNull();
    });

    it("should authorize user with one of multiple allowed roles", () => {
      const error = authorize(mockUser, [UserRole.STAFF, UserRole.MANAGER]);
      expect(error).toBeNull();
    });

    it("should reject user with incorrect role", () => {
      const error = authorize(mockUser, [UserRole.MANAGER]);
      expect(error).toBeTruthy();
      expect(error?.status).toBe(403);
    });

    it("should reject null user", () => {
      const error = authorize(null, [UserRole.STAFF]);
      expect(error).toBeTruthy();
      expect(error?.status).toBe(401);
    });

    it("should authorize MANAGER for MANAGER-only routes", () => {
      const managerUser: JwtPayload = { ...mockUser, role: UserRole.MANAGER };
      const error = authorize(managerUser, [UserRole.MANAGER]);
      expect(error).toBeNull();
    });

    it("should reject STAFF from MANAGER-only routes", () => {
      const error = authorize(mockUser, [UserRole.MANAGER]);
      expect(error).toBeTruthy();
      expect(error?.status).toBe(403);
    });
  });

  describe("authenticateAndAuthorize", () => {
    it("should succeed for valid token and correct role", async () => {
      const token = signToken(mockUser);
      const request = createMockRequest(`Bearer ${token}`);
      const { user, error } = await authenticateAndAuthorize(request, [UserRole.STAFF]);

      expect(error).toBeNull();
      expect(user).toBeTruthy();
      expect(user?.userId).toBe(mockUser.userId);
    });

    it("should fail for valid token but incorrect role", async () => {
      const token = signToken(mockUser);
      const request = createMockRequest(`Bearer ${token}`);
      const { user, error } = await authenticateAndAuthorize(request, [UserRole.MANAGER]);

      expect(user).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.status).toBe(403);
    });

    it("should fail for invalid token", async () => {
      const request = createMockRequest("Bearer invalid.token");
      const { user, error } = await authenticateAndAuthorize(request, [UserRole.STAFF]);

      expect(user).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.status).toBe(401);
    });

    it("should fail for missing token", async () => {
      const request = createMockRequest(null);
      const { user, error } = await authenticateAndAuthorize(request, [UserRole.STAFF]);

      expect(user).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.status).toBe(401);
    });
  });

  describe("withAuth wrapper", () => {
    it("should call handler with authenticated user", async () => {
      const token = signToken(mockUser);
      const request = createMockRequest(`Bearer ${token}`);

      const mockHandler = vi.fn(async (req, user) => {
        return new Response(JSON.stringify({ success: true, userId: user.userId }));
      });

      const wrappedHandler = withAuth(mockHandler, { allowedRoles: [UserRole.STAFF] });
      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(response).toBeTruthy();
    });

    it("should reject without calling handler for invalid token", async () => {
      const request = createMockRequest("Bearer invalid.token");

      const mockHandler = vi.fn(async (req, user) => {
        return new Response(JSON.stringify({ success: true }));
      });

      const wrappedHandler = withAuth(mockHandler, { allowedRoles: [UserRole.STAFF] });
      const response = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });

    it("should use default allowed roles if not specified", async () => {
      const token = signToken(mockUser);
      const request = createMockRequest(`Bearer ${token}`);

      const mockHandler = vi.fn(async (req, user) => {
        return new Response(JSON.stringify({ success: true }));
      });

      const wrappedHandler = withAuth(mockHandler); // No allowedRoles specified
      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledOnce();
    });

    it("should reject STAFF from MANAGER-only endpoint", async () => {
      const token = signToken(mockUser);
      const request = createMockRequest(`Bearer ${token}`);

      const mockHandler = vi.fn(async (req, user) => {
        return new Response(JSON.stringify({ success: true }));
      });

      const wrappedHandler = withAuth(mockHandler, { allowedRoles: [UserRole.MANAGER] });
      const response = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });
});
