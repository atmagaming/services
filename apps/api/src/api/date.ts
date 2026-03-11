import "./date-extensions";

const PAYMENT_CUTOFF_DAY = 10;

function toMonthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthStrToDate(m: string): Date {
  const [year, month] = m.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, 1);
}

export function addMonths(monthStr: string, n: number): string {
  return toMonthStr(monthStrToDate(monthStr).add(n, "month"));
}

export function getLastConfirmedMonth(): string {
  const now = new Date();
  const monthsBack = now.getDate() > PAYMENT_CUTOFF_DAY ? 1 : 2;
  return toMonthStr(now.add(-monthsBack, "month"));
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
