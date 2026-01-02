/**
 * Test HTTP client for integration tests
 * Provides utilities for making authenticated API requests
 */

import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing
 */
export function createTestRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    token?: string;
  }
): NextRequest {
  const headers = new Headers(options?.headers || {});

  // Add Content-Type for POST/PUT requests
  if ((options?.method === "POST" || options?.method === "PUT") && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Add Authorization header if token provided
  if (options?.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const requestInit: RequestInit = {
    method: options?.method || "GET",
    headers,
  };

  // Add body for POST/PUT/DELETE requests
  if (options?.body) {
    requestInit.body = JSON.stringify(options.body);
  }

  return new NextRequest(url, requestInit);
}

/**
 * Parse JSON response from NextResponse
 */
export async function parseResponse<T = unknown>(response: Response): Promise<{
  status: number;
  data: T;
}> {
  const data = await response.json();
  return {
    status: response.status,
    data,
  };
}

/**
 * Test API client with authentication support
 */
export class TestApiClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = undefined;
  }

  /**
   * Make authenticated request
   */
  request(path: string, options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }): NextRequest {
    return createTestRequest(`${this.baseUrl}${path}`, {
      ...options,
      token: this.token,
    });
  }

  /**
   * Login and store token
   */
  async login(email: string, password: string): Promise<{
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  }> {
    const request = this.request("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(request);
    const data = await response.json();

    if (response.status === 200) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    this.clearToken();
  }

  /**
   * GET request
   */
  get(path: string, headers?: Record<string, string>): NextRequest {
    return this.request(path, { method: "GET", headers });
  }

  /**
   * POST request
   */
  post(path: string, body?: unknown, headers?: Record<string, string>): NextRequest {
    return this.request(path, { method: "POST", body, headers });
  }

  /**
   * PUT request
   */
  put(path: string, body?: unknown, headers?: Record<string, string>): NextRequest {
    return this.request(path, { method: "PUT", body, headers });
  }

  /**
   * DELETE request
   */
  delete(path: string, headers?: Record<string, string>): NextRequest {
    return this.request(path, { method: "DELETE", headers });
  }
}

/**
 * Create a new test API client
 */
export function createTestClient(): TestApiClient {
  return new TestApiClient();
}
