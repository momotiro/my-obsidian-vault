import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, validatePasswordStrength, getPasswordRequirements } from "./password";

describe("Password Utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(password);
    });

    it("should create different hashes for the same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2); // bcrypt uses random salt
    });

    it("should hash empty string", async () => {
      const hash = await hashPassword("");
      expect(hash).toBeTruthy();
    });

    it("should hash long password", async () => {
      const longPassword = "a".repeat(100);
      const hash = await hashPassword(longPassword);
      expect(hash).toBeTruthy();
    });

    it("should hash password with special characters", async () => {
      const password = "Test@123!#$%^&*()";
      const hash = await hashPassword(password);
      expect(hash).toBeTruthy();
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword456";
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });

    it("should be case sensitive", async () => {
      const password = "TestPassword";
      const hash = await hashPassword(password);
      const isMatch = await comparePassword("testpassword", hash);
      expect(isMatch).toBe(false);
    });

    it("should handle empty password comparison", async () => {
      const password = "";
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it("should return false for invalid hash", async () => {
      const isMatch = await comparePassword("password", "invalid-hash");
      expect(isMatch).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    it("should accept password with 8+ characters", () => {
      expect(validatePasswordStrength("12345678")).toBe(true);
      expect(validatePasswordStrength("password123")).toBe(true);
    });

    it("should reject password with less than 8 characters", () => {
      expect(validatePasswordStrength("1234567")).toBe(false);
      expect(validatePasswordStrength("pass")).toBe(false);
      expect(validatePasswordStrength("")).toBe(false);
    });

    it("should accept long passwords", () => {
      const longPassword = "a".repeat(100);
      expect(validatePasswordStrength(longPassword)).toBe(true);
    });

    it("should accept password with special characters", () => {
      expect(validatePasswordStrength("Test@123!")).toBe(true);
    });
  });

  describe("getPasswordRequirements", () => {
    it("should return password requirements message", () => {
      const requirements = getPasswordRequirements();
      expect(requirements).toBeTruthy();
      expect(typeof requirements).toBe("string");
      expect(requirements).toContain("8");
    });
  });

  describe("Integration: Full password flow", () => {
    it("should validate, hash, and verify password correctly", async () => {
      const password = "SecurePass123!";

      // Validate strength
      const isStrong = validatePasswordStrength(password);
      expect(isStrong).toBe(true);

      // Hash password
      const hash = await hashPassword(password);
      expect(hash).toBeTruthy();

      // Verify correct password
      const isCorrect = await comparePassword(password, hash);
      expect(isCorrect).toBe(true);

      // Verify incorrect password
      const isIncorrect = await comparePassword("WrongPass456!", hash);
      expect(isIncorrect).toBe(false);
    });

    it("should reject weak password in flow", async () => {
      const weakPassword = "weak";

      // Validate strength
      const isStrong = validatePasswordStrength(weakPassword);
      expect(isStrong).toBe(false);

      // Should not proceed to hashing in real application
      // But technically can still hash it
      const hash = await hashPassword(weakPassword);
      const isMatch = await comparePassword(weakPassword, hash);
      expect(isMatch).toBe(true);
    });
  });
});
