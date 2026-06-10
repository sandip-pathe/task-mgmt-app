import { describe, expect, it } from "vitest";

import { combineDateAndTime, dateFromLocalInput, defaultDueDateInput } from "./date-time";

describe("date-time helpers", () => {
  it("defaults new due dates to five minutes from now", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    const dueDate = defaultDueDateInput(now);

    expect(new Date(dueDate).getTime() - now.getTime()).toBe(5 * 60 * 1000);
  });

  it("combines a selected calendar date with a selected time", () => {
    const date = dateFromLocalInput("2026-06-10T12:05");

    expect(date).toBeDefined();
    expect(combineDateAndTime(date!, "14:30").endsWith("14:30")).toBe(true);
  });
});
