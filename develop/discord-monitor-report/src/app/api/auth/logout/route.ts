import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/middleware/auth";

/**
 * POST /api/auth/logout
 * Logout user (client-side token invalidation)
 *
 * Note: Since we're using stateless JWT tokens, the actual logout is handled
 * client-side by removing the token from storage. This endpoint primarily
 * validates the token and provides a consistent API interface.
 *
 * For production systems, consider implementing:
 * - Token blacklist/revocation list in Redis or database
 * - Short-lived access tokens with refresh tokens
 * - Token versioning in user table
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate the user to ensure they have a valid token
    const { user, error } = await authenticate(request);

    if (error || !user) {
      // If token is already invalid, consider it a successful logout
      return NextResponse.json(
        { message: "Logged out successfully" },
        { status: 200 }
      );
    }

    // Token is valid, instruct client to remove it
    // In a production system, you might add the token to a blacklist here
    return NextResponse.json(
      {
        message: "Logged out successfully",
        userId: user.userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Optional: Token blacklist implementation
 *
 * For enhanced security, you can implement a token blacklist:
 *
 * 1. Store blacklisted tokens in Redis with TTL matching token expiration:
 *    await redis.setex(`blacklist:${token}`, expiresInSeconds, '1');
 *
 * 2. Check blacklist in authenticate middleware:
 *    const isBlacklisted = await redis.exists(`blacklist:${token}`);
 *    if (isBlacklisted) throw new Error("Token has been revoked");
 *
 * 3. On logout, add token to blacklist:
 *    const decoded = decodeToken(token);
 *    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
 *    await redis.setex(`blacklist:${token}`, expiresIn, '1');
 */
