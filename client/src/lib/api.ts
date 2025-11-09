const API_URL = import.meta.env.VITE_API_URL || "/api";

function getAuthHeaders(): HeadersInit {
  const userId = localStorage.getItem("userId");
  return {
    "Content-Type": "application/json",
    ...(userId && { "x-user-id": userId }),
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}
