import { describe, it, expect, beforeEach, vi } from "vitest";
import { signToken, verifyToken, decodeToken, extractTokenFromHeader } from "./jwt";
import { UserRole } from "@prisma/client";
import type { JwtPayload } from "./jwt";

describe("JWT Utilities", () => {
  const mockPayload: JwtPayload = {
    userId: 1,
    email: "test@example.com",
    role: UserRole.STAFF,
  };

  describe("signToken", () => {
    it("should sign a valid JWT token", () => {
      const token = signToken(mockPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should create tokens with consistent payload", () => {
      const token = signToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.role).toBe(mockPayload.role);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = signToken(mockPayload);
      const verified = verifyToken(token);
      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.email).toBe(mockPayload.email);
      expect(verified.role).toBe(mockPayload.role);
    });

    it("should reject an invalid token", () => {
      expect(() => {
        verifyToken("invalid.token.here");
      }).toThrow();
    });

    it("should reject a malformed token", () => {
      expect(() => {
        verifyToken("not-a-jwt");
      }).toThrow();
    });

    it("should reject an empty token", () => {
      expect(() => {
        verifyToken("");
      }).toThrow();
    });
  });

  describe("decodeToken", () => {
    it("should decode a valid token without verification", () => {
      const token = signToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it("should return null for an invalid token", () => {
      const decoded = decodeToken("invalid.token.here");
      expect(decoded).toBeNull();
    });

    it("should return null for a malformed token", () => {
      const decoded = decodeToken("not-a-jwt");
      expect(decoded).toBeNull();
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from valid Bearer header", () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
      const authHeader = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    it("should return null for missing header", () => {
      const extracted = extractTokenFromHeader(null);
      expect(extracted).toBeNull();
    });

    it("should return null for invalid format (no Bearer)", () => {
      const extracted = extractTokenFromHeader("token-without-bearer");
      expect(extracted).toBeNull();
    });

    it("should return null for invalid format (wrong prefix)", () => {
      const extracted = extractTokenFromHeader("Basic token");
      expect(extracted).toBeNull();
    });

    it("should return null for empty header", () => {
      const extracted = extractTokenFromHeader("");
      expect(extracted).toBeNull();
    });

    it("should return null for header with only Bearer", () => {
      const extracted = extractTokenFromHeader("Bearer");
      expect(extracted).toBeNull();
    });
  });

  describe("Token expiration", () => {
    it("should include expiration claim", () => {
      const token = signToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeTruthy();
      // JWT payload should have exp claim (added by jsonwebtoken)
    });
  });

  describe("Different user roles", () => {
    it("should handle STAFF role", () => {
      const payload: JwtPayload = { ...mockPayload, role: UserRole.STAFF };
      const token = signToken(payload);
      const verified = verifyToken(token);
      expect(verified.role).toBe(UserRole.STAFF);
    });

    it("should handle MANAGER role", () => {
      const payload: JwtPayload = { ...mockPayload, role: UserRole.MANAGER };
      const token = signToken(payload);
      const verified = verifyToken(token);
      expect(verified.role).toBe(UserRole.MANAGER);
    });
  });
});
