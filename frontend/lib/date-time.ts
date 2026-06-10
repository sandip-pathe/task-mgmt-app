export function toLocalDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function defaultDueDateInput(now = new Date()) {
  return toLocalDateTimeValue(new Date(now.getTime() + 5 * 60_000));
}

export function toDateInput(value: string | null) {
  if (!value) return "";
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return value.slice(0, 16);
  }
  return toLocalDateTimeValue(new Date(value));
}

export function toApiDate(value?: string) {
  return value ? new Date(value).toISOString() : null;
}

export function dateFromLocalInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function timeFromLocalInput(value: string) {
  return value?.slice(11, 16) || defaultDueDateInput().slice(11, 16);
}

export function combineDateAndTime(date: Date, time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return toLocalDateTimeValue(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Number(hours),
      Number(minutes),
    ),
  );
}

export function formatDateTime(value: string) {
  const date = dateFromLocalInput(value);
  if (!date) return "Pick due date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
