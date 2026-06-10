export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSort = "created_at" | "due_date" | "priority";
export type SortOrder = "asc" | "desc";

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthResponse = {
  user: User;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskListResponse = {
  items: Task[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type TaskActivity = {
  id: string;
  task_id: string;
  action: string;
  summary: string;
  changes: Record<string, { from?: unknown; to?: unknown }> | Record<string, unknown> | null;
  created_at: string;
};

export type TaskListParams = {
  status?: TaskStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
  sort?: TaskSort;
  order?: SortOrder;
};

export type TaskPayload = {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
};
