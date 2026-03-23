const PAYMENT_CUTOFF_DAY = 10;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function addToDate(d: Date, value: number, kind: "day" | "month" | "year"): Date {
  const result = new Date(d.getTime());
  if (kind === "day") result.setDate(result.getDate() + value);
  else if (kind === "month") result.setMonth(result.getMonth() + value);
  else result.setFullYear(result.getFullYear() + value);
  return result;
}

function toMonthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthStrToDate(m: string): Date {
  const [year, month] = m.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, 1);
}

export function addMonths(monthStr: string, n: number): string {
  return toMonthStr(addToDate(monthStrToDate(monthStr), n, "month"));
}

export function getLastConfirmedMonth(): string {
  const now = new Date();
  const monthsBack = now.getDate() > PAYMENT_CUTOFF_DAY ? 1 : 2;
  return toMonthStr(addToDate(now, -monthsBack, "month"));
}

export function getMonthRange(start: string, end: string): string[] {
  const months: string[] = [];
  let current = start;
  while (current <= end) {
    months.push(current);
    current = addMonths(current, 1);
  }
  return months;
}
