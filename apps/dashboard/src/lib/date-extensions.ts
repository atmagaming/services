const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

declare global {
  interface Date {
    /** "24 Jan 2026" */
    toShort(): string;
    /** "24 January, 2026" */
    toLong(): string;
    add(value: number, kind: "day" | "month" | "year"): Date;
  }
  interface DateConstructor {
    /** Parse "YYYY-MM-DD" */
    fromIso(iso: string): Date;
  }
}

Date.prototype.toShort = function (this: Date) {
  return `${this.getDate()} ${MONTHS_SHORT[this.getMonth()]} ${this.getFullYear()}`;
};

Date.prototype.toLong = function (this: Date) {
  return `${this.getDate()} ${MONTHS_LONG[this.getMonth()]}, ${this.getFullYear()}`;
};

Date.prototype.add = function (this: Date, value: number, kind: "day" | "month" | "year") {
  const d = new Date(this.getTime());
  if (kind === "day") d.setDate(d.getDate() + value);
  else if (kind === "month") d.setMonth(d.getMonth() + value);
  else d.setFullYear(d.getFullYear() + value);
  return d;
};

Date.fromIso = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

export {};
