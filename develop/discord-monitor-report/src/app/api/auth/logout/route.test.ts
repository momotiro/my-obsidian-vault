import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { signToken } from "@/lib/auth/jwt";
import { UserRole } from "@prisma/client";
import type { JwtPayload } from "@/lib/auth/jwt";

describe("POST /api/auth/logout", () => {
  const mockUser: JwtPayload = {
    userId: 1,
    email: "test@example.com",
    role: UserRole.STAFF,
  };

  const createRequest = (authHeader: string | null): NextRequest => {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (authHeader) {
      headers.set("Authorization", authHeader);
    }

    return new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers,
    });
  };

  describe("Successful logout", () => {
    it("should logout with valid token", async () => {
      const token = signToken(mockUser);
      const request = createRequest(`Bearer ${token}`);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logged out successfully");
      expect(data.userId).toBe(mockUser.userId);
    });

    it("should logout MANAGER user", async () => {
      const managerUser: JwtPayload = {
        ...mockUser,
        userId: 2,
        role: UserRole.MANAGER,
      };
      const token = signToken(managerUser);
      const request = createRequest(`Bearer ${token}`);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logged out successfully");
      expect(data.userId).toBe(managerUser.userId);
    });
  });

  describe("Logout without valid token", () => {
    it("should succeed even with invalid token", async () => {
      const request = createRequest("Bearer invalid.token.here");

      const response = await POST(request);
      const data = await response.json();

      // Should still return success (client-side logout)
      expect(response.status).toBe(200);
      expect(data.message).toBe("Logged out successfully");
      expect(data.userId).toBeUndefined();
    });

    it("should succeed without Authorization header", async () => {
      const request = createRequest(null);

      const response = await POST(request);
      const data = await response.json();

      // Should still return success (client-side logout)
      expect(response.status).toBe(200);
      expect(data.message).toBe("Logged out successfully");
    });

    it("should succeed with malformed Authorization header", async () => {
      const request = createRequest("InvalidFormat");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logged out successfully");
    });
  });

  describe("Idempotency", () => {
    it("should allow multiple logout requests with same token", async () => {
      const token = signToken(mockUser);
      const request1 = createRequest(`Bearer ${token}`);
      const request2 = createRequest(`Bearer ${token}`);

      const response1 = await POST(request1);
      const response2 = await POST(request2);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe("Response format", () => {
    it("should return correct response structure with valid token", async () => {
      const token = signToken(mockUser);
      const request = createRequest(`Bearer ${token}`);

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("userId");
      expect(typeof data.message).toBe("string");
      expect(typeof data.userId).toBe("number");
    });

    it("should return correct response structure without token", async () => {
      const request = createRequest(null);

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("message");
      expect(typeof data.message).toBe("string");
    });
  });
});
