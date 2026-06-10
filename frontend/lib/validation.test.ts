import { describe, expect, it } from "vitest";

import { authSchema, taskSchema } from "./validation";

describe("authSchema", () => {
  it("requires a valid email and an 8 character password", () => {
    const result = authSchema.safeParse({ email: "not-an-email", password: "short" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Enter a valid email");
      expect(result.error.flatten().fieldErrors.password?.[0]).toBe(
        "Password must be at least 8 characters",
      );
    }
  });
});

describe("taskSchema", () => {
  it("rejects blank task titles", () => {
    const result = taskSchema.safeParse({
      title: "   ",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title?.[0]).toBe("Title is required");
    }
  });

  it("rejects invalid due dates", () => {
    const result = taskSchema.safeParse({
      title: "Ship it",
      status: "todo",
      priority: "high",
      due_date: "not-a-date",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.due_date?.[0]).toBe("Enter a valid due date");
    }
  });
});
