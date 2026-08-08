import { supabase } from "./supabase";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export class ApiError extends Error {
  public status: number;
  public details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // Attach token if available — but NOT for public auth endpoints
  const isAuthEndpoint = endpoint.startsWith("/auth/");
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session && session.access_token && !isAuthEndpoint) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    if (session) {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    // No JSON body
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.error || "An API error occurred",
      response.status,
      data?.details
    );
  }

  // The backend wraps everything in { success: true, data: T, message: string }
  if (data && data.success === true) {
    return data.data as T;
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "DELETE" }),
};
