import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format ISO date string (YYYY-MM-DD) as "24 Jun 2028" */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
