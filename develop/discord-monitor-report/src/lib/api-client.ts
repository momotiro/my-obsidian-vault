/**
 * API Client utility for making authenticated requests
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "リクエストに失敗しました",
    }));

    throw new ApiError(
      errorData.error || errorData.message || "リクエストに失敗しました",
      response.status,
      errorData.code
    );
  }

  return response.json();
}
