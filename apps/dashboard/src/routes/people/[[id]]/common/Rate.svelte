<script lang="ts">
import DollarSign from "@lucide/svelte/icons/dollar-sign";
import type { PersonFull } from "$lib/api";
import type { RateMode } from "../people-table/RateMode";

const {
  person,
  method,
  duration,
  max,
}: {
  person: PersonFull;
  method: "Paid" | "Accrued";
  duration: RateMode;
  max: number;
} = $props();

const hue = $derived(method === "Paid" ? 30 : 45);
const decimals = $derived(duration === "hourly" ? 2 : 0);
const key = $derived(`${method.toLowerCase()}${duration.capitalize()}` as keyof PersonFull);
const value = $derived(Number(person[key]));

function heatStyle(v: number, m: number): string {
  if (m === 0 || v === 0) return "background:hsl(0,0%,92%);color:hsl(0,0%,58%)";
  const ratio = v / m;
  const light = Math.round(92 - ratio * 28);
  const textLight = light < 76 ? 24 : 40;
  return `background:hsl(${hue},90%,${light}%);color:hsl(${hue},80%,${textLight}%)`;
}
</script>

<div class="flex items-center justify-center">
  <div class="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-xs" style={heatStyle(value, max)}>
    <DollarSign class="size-3 shrink-0" />
    {value.toFixed(decimals)}
  </div>
</div>
