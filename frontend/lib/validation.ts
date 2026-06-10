import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().max(5000).optional(),
  status: z.enum(["todo", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid due date",
    }),
});

export type AuthFormValues = z.infer<typeof authSchema>;
export type TaskFormValues = z.infer<typeof taskSchema>;
