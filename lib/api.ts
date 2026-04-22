import { NextResponse } from "next/server";

// Generic API fetch helper with error handling
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || json.message || `Erreur HTTP ${res.status}`);
  }

  return json;
}

// Helper for POST requests
export async function apiPost<T = any>(
  url: string,
  body: any,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
}

// Helper for PUT requests
export async function apiPut<T = any>(
  url: string,
  body: any,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(url, {
    method: "PUT",
    body: JSON.stringify(body),
    ...options,
  });
}

// Helper for DELETE requests
export async function apiDelete<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(url, {
    method: "DELETE",
    ...options,
  });
}

// Helper for GET requests
export async function apiGet<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch<T>(url, {
    method: "GET",
    ...options,
  });
}