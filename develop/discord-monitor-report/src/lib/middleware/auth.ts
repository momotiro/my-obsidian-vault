import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader, JwtPayload } from "@/lib/auth/jwt";
import { UserRole } from "@prisma/client";

/**
 * Extended request type with authenticated user information
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: JwtPayload;
}

/**
 * Authentication error response
 */
function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Forbidden error response
 */
function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Authentication middleware for Next.js API routes
 * Extracts and verifies JWT token from Authorization header
 * @param request - Next.js request object
 * @returns Object containing user payload and any errors
 */
export async function authenticate(
  request: NextRequest
): Promise<{ user: JwtPayload | null; error: NextResponse | null }> {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        user: null,
        error: unauthorizedResponse("Missing or invalid Authorization header"),
      };
    }

    // Verify token
    const user = verifyToken(token);

    return {
      user,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: unauthorizedResponse(
        error instanceof Error ? error.message : "Authentication failed"
      ),
    };
  }
}

/**
 * Authorization middleware to check user role
 * @param user - Authenticated user payload
 * @param allowedRoles - Array of roles allowed to access the resource
 * @returns null if authorized, error response if not
 */
export function authorize(
  user: JwtPayload | null,
  allowedRoles: UserRole[]
): NextResponse | null {
  if (!user) {
    return unauthorizedResponse("User not authenticated");
  }

  if (!allowedRoles.includes(user.role)) {
    return forbiddenResponse("Insufficient permissions");
  }

  return null;
}

/**
 * Combined authentication and authorization middleware
 * @param request - Next.js request object
 * @param allowedRoles - Array of roles allowed to access the resource
 * @returns Object containing user payload and any errors
 */
export async function authenticateAndAuthorize(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: JwtPayload | null; error: NextResponse | null }> {
  const { user, error } = await authenticate(request);

  if (error) {
    return { user: null, error };
  }

  const authError = authorize(user, allowedRoles);
  if (authError) {
    return { user: null, error: authError };
  }

  return { user, error: null };
}

/**
 * Middleware wrapper for protecting API routes
 * @param handler - API route handler that receives authenticated user
 * @param options - Optional configuration for allowed roles
 */
export function withAuth(
  handler: (req: NextRequest, user: JwtPayload) => Promise<NextResponse>,
  options?: { allowedRoles?: UserRole[] }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const allowedRoles = options?.allowedRoles || [UserRole.STAFF, UserRole.MANAGER];

    const { user, error } = await authenticateAndAuthorize(request, allowedRoles);

    if (error || !user) {
      return error || unauthorizedResponse();
    }

    return handler(request, user);
  };
}
