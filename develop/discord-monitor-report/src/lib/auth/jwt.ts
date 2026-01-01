import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import { UserRole } from "@prisma/client";

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

/**
 * JWT token expiration time (24 hours)
 */
const TOKEN_EXPIRATION = "24h";

/**
 * Sign a JWT token with user information
 * @param payload - User information to encode in the token
 * @returns Signed JWT token string
 */
export function signToken(payload: JwtPayload): string {
  try {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
      issuer: "discord-monitor-report",
      audience: "discord-monitor-report-api",
    });
  } catch (error) {
    throw new Error(`Failed to sign JWT token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "discord-monitor-report",
      audience: "discord-monitor-report-api",
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw new Error(`Failed to verify JWT token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Decode a JWT token without verification (for debugging purposes only)
 * @param token - JWT token string to decode
 * @returns Decoded JWT payload or null if invalid
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Extracted token or null if invalid format
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
