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

export function formatDateLong(d: Date): string {
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]}, ${d.getFullYear()}`;
}
