"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api, ApiError } from "@/lib/api";
import type {
  AuthResponse,
  SortOrder,
  Task,
  TaskListParams,
  TaskListResponse,
  TaskPayload,
  TaskPriority,
  TaskSort,
  TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().max(5000).optional(),
  status: z.enum(["todo", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;
type TaskFormValues = z.infer<typeof taskSchema>;

const statusLabels: Record<TaskStatus | "all", string> = {
  all: "All",
  todo: "Todo",
  in_progress: "In progress",
  completed: "Completed",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const sortLabels: Record<TaskSort, string> = {
  created_at: "Created",
  due_date: "Due date",
  priority: "Priority",
};

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toApiDate(value?: string) {
  return value ? new Date(value).toISOString() : null;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function statusTone(status: TaskStatus) {
  if (status === "completed") return "emerald" as const;
  if (status === "in_progress") return "sky" as const;
  return "slate" as const;
}

function priorityTone(priority: TaskPriority) {
  if (priority === "high") return "rose" as const;
  if (priority === "medium") return "amber" as const;
  return "slate" as const;
}

export function TaskApp() {
  const queryClient = useQueryClient();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TaskSort>("created_at");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Signed out");
    },
  });

  if (meQuery.isLoading) {
    return <FullPageLoader />;
  }

  if (!meQuery.data) {
    return (
      <AuthScreen
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthed={(data) => queryClient.setQueryData(["me"], data)}
      />
    );
  }

  const user = meQuery.data.user;
  const params: TaskListParams = {
    status: statusFilter,
    search,
    page,
    limit: 8,
    sort,
    order,
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Rival Task Manager
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
              Tasks that stay accountable
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut />
              Sign out
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_170px]">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                  placeholder="Search by title"
                />
              </div>
            </div>
            <SelectField
              label="Sort"
              value={sort}
              onChange={(value) => {
                setSort(value as TaskSort);
                setPage(1);
              }}
              options={Object.entries(sortLabels).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              label="Order"
              value={order}
              onChange={(value) => {
                setOrder(value as SortOrder);
                setPage(1);
              }}
              options={[
                { value: "desc", label: "Descending" },
                { value: "asc", label: "Ascending" },
              ]}
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New task
          </Button>
        </section>

        <StatusTabs
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />

        <TaskList
          params={params}
          onEdit={setEditingTask}
          onPageChange={setPage}
        />
      </div>

      <TaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        task={null}
      />
      <TaskDialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        mode="edit"
        task={editingTask}
      />
    </main>
  );
}

function FullPageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="size-8 animate-spin text-emerald-600" />
    </main>
  );
}

function AuthScreen({
  mode,
  onModeChange,
  onAuthed,
}: {
  mode: "login" | "signup";
  onModeChange: (mode: "login" | "signup") => void;
  onAuthed: (data: AuthResponse) => void;
}) {
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: AuthFormValues) =>
      mode === "login" ? api.login(values.email, values.password) : api.signup(values.email, values.password),
    onSuccess: (data) => {
      onAuthed(data);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50 lg:grid-cols-[1fr_460px]">
      <section className="flex min-h-[38vh] flex-col justify-between bg-emerald-700 px-6 py-8 text-white dark:bg-emerald-900 lg:min-h-screen lg:px-10">
        <div className="text-sm font-semibold">Rival Task Manager</div>
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
            Own the work from idea to shipped.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50">
            A focused task workspace with scoped accounts, searchable lists, and visible change history.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <form
          className="w-full max-w-sm space-y-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <h2 className="text-2xl font-semibold">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "login" ? "Continue to your tasks." : "Start with a clean workspace."}
            </p>
          </div>

          <FieldError message={form.formState.errors.email?.message}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </FieldError>

          <FieldError message={form.formState.errors.password?.message}>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              {...form.register("password")}
            />
          </FieldError>

          <Button className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>

          <button
            type="button"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300"
            onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Need an account?" : "Already have an account?"}
          </button>
        </form>
      </section>
    </main>
  );
}

function StatusTabs({
  value,
  onChange,
}: {
  value: TaskStatus | "all";
  onChange: (value: TaskStatus | "all") => void;
}) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
      {(Object.keys(statusLabels) as Array<TaskStatus | "all">).map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={cn(
            "h-9 min-w-24 rounded-md px-3 text-sm font-medium transition-colors",
            value === status
              ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
          )}
        >
          {statusLabels[status]}
        </button>
      ))}
    </div>
  );
}

function TaskList({
  params,
  onEdit,
  onPageChange,
}: {
  params: TaskListParams;
  onEdit: (task: Task) => void;
  onPageChange: (page: number) => void;
}) {
  const tasksQuery = useQuery({
    queryKey: ["tasks", params],
    queryFn: () => api.listTasks(params),
  });

  if (tasksQuery.isLoading) {
    return (
      <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950">
        <Loader2 className="size-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
        {errorMessage(tasksQuery.error)}
      </div>
    );
  }

  const data = tasksQuery.data;
  if (!data?.items.length) {
    return (
      <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h2 className="text-lg font-semibold">No tasks found</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create a task or adjust the current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
      <Pagination data={data} onPageChange={onPageChange} />
    </section>
  );
}

function TaskCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () => api.updateTask(task.id, { status: "completed" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshots = queryClient.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<TaskListResponse>(key, {
          ...data,
          items: data.items.map((item) =>
            item.id === task.id ? { ...item, status: "completed" } : item,
          ),
        });
      });
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(errorMessage(error));
    },
    onSuccess: () => toast.success("Task completed"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteTask(task.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const snapshots = queryClient.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<TaskListResponse>(key, {
          ...data,
          total: Math.max(0, data.total - 1),
          items: data.items.filter((item) => item.id !== task.id),
        });
      });
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(errorMessage(error));
    },
    onSuccess: () => toast.success("Task deleted"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <article className="flex min-h-56 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <button type="button" className="text-left" onClick={() => onEdit(task)}>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone(task.status)}>{statusLabels[task.status]}</Badge>
          <Badge tone={priorityTone(task.priority)}>{priorityLabels[task.priority]}</Badge>
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
          {task.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {task.description || "No description"}
        </p>
      </button>
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-900">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <CalendarDays className="size-4 shrink-0" />
          <span className="truncate">{formatDate(task.due_date)}</span>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            title="Mark complete"
            disabled={task.status === "completed" || completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            <Check />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Delete task"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}

function TaskDialog({
  open,
  onOpenChange,
  mode,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  task: Task | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New task" : "Edit task"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a task with priority and due date." : "Update task details and review recent changes."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          key={task?.id ?? "new"}
          task={task}
          onSaved={() => onOpenChange(false)}
        />
        {task && <ActivityPanel taskId={task.id} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, onSaved }: { task: Task | null; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      due_date: toDateInput(task?.due_date ?? null),
    },
  });
  const watchedStatus = useWatch({ control: form.control, name: "status" });
  const watchedPriority = useWatch({ control: form.control, name: "priority" });

  const mutation = useMutation({
    mutationFn: (values: TaskFormValues) => {
      const payload: TaskPayload = {
        title: values.title,
        description: values.description?.trim() || null,
        status: values.status,
        priority: values.priority,
        due_date: toApiDate(values.due_date),
      };
      return task ? api.updateTask(task.id, payload) : api.createTask(payload);
    },
    onSuccess: () => {
      toast.success(task ? "Task updated" : "Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (task) queryClient.invalidateQueries({ queryKey: ["activity", task.id] });
      onSaved();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <FieldError message={form.formState.errors.title?.message}>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
      </FieldError>

      <FieldError message={form.formState.errors.description?.message}>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </FieldError>

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Status"
          value={watchedStatus}
          onChange={(value) => form.setValue("status", value as TaskStatus, { shouldDirty: true })}
          options={[
            { value: "todo", label: "Todo" },
            { value: "in_progress", label: "In progress" },
            { value: "completed", label: "Completed" },
          ]}
        />
        <SelectField
          label="Priority"
          value={watchedPriority}
          onChange={(value) => form.setValue("priority", value as TaskPriority, { shouldDirty: true })}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
        />
        <FieldError message={form.formState.errors.due_date?.message}>
          <Label htmlFor="due-date">Due date</Label>
          <Input id="due-date" type="datetime-local" {...form.register("due_date")} />
        </FieldError>
      </div>

      <Button className="justify-self-end" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="animate-spin" />}
        {task ? "Save changes" : "Create task"}
      </Button>
    </form>
  );
}

function ActivityPanel({ taskId }: { taskId: string }) {
  const activityQuery = useQuery({
    queryKey: ["activity", taskId],
    queryFn: () => api.taskActivity(taskId),
  });

  return (
    <section className="border-t border-slate-200 pt-4 dark:border-slate-800">
      <h3 className="text-sm font-semibold">Activity</h3>
      {activityQuery.isLoading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Loading activity
        </div>
      )}
      {activityQuery.isError && (
        <p className="mt-3 text-sm text-rose-600">{errorMessage(activityQuery.error)}</p>
      )}
      {activityQuery.data && (
        <ol className="mt-3 space-y-3">
          {activityQuery.data.map((activity) => (
            <li key={activity.id} className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{activity.summary}</p>
                <time className="shrink-0 text-xs text-slate-500">
                  {new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(activity.created_at))}
                </time>
              </div>
              {activity.changes && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {Object.keys(activity.changes).join(", ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Pagination({
  data,
  onPageChange,
}: {
  data: TaskListResponse;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-slate-500 dark:text-slate-400">
        Page {data.page} of {Math.max(data.pages, 1)} · {data.total} tasks
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={data.page <= 1}
          onClick={() => onPageChange(data.page - 1)}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={data.pages === 0 || data.page >= data.pages}
          onClick={() => onPageChange(data.page + 1)}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = useMemo(() => label.toLowerCase().replace(/\s+/g, "-"), [label]);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldError({
  children,
  message,
}: {
  children: React.ReactNode;
  message?: string;
}) {
  return (
    <div className="space-y-2">
      {children}
      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
