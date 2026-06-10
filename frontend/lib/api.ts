import type { AuthResponse, Task, TaskActivity, TaskListParams, TaskListResponse, TaskPayload } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? "Something went wrong",
      body.error?.details,
    );
  }

  return body as T;
}

export const api = {
  signup(email: string, password: string) {
    return request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  logout() {
    return request<void>("/auth/logout", { method: "POST" });
  },
  me() {
    return request<AuthResponse>("/auth/me");
  },
  listTasks(params: TaskListParams) {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "all") searchParams.set("status", params.status);
    if (params.search?.trim()) searchParams.set("search", params.search.trim());
    searchParams.set("page", String(params.page ?? 1));
    searchParams.set("limit", String(params.limit ?? 8));
    searchParams.set("sort", params.sort ?? "created_at");
    searchParams.set("order", params.order ?? "desc");
    return request<TaskListResponse>(`/tasks?${searchParams.toString()}`);
  },
  createTask(payload: TaskPayload) {
    return request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateTask(id: string, payload: Partial<TaskPayload>) {
    return request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteTask(id: string) {
    return request<void>(`/tasks/${id}`, { method: "DELETE" });
  },
  taskActivity(id: string) {
    return request<TaskActivity[]>(`/tasks/${id}/activity`);
  },
};
