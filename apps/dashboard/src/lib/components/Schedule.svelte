<script lang="ts">
import { tick } from "svelte";

const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

let {
  value = $bindable("4,4,4,4,4,0,0"),
  editable = false,
  maxSchedule,
}: {
  value: string;
  editable?: boolean;
  maxSchedule?: number;
} = $props();

const parts = $derived(value.split(",").map((v) => v.trim()));
const total = $derived(parts.reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0));

let inputs = $state<HTMLInputElement[]>([]);

function setValue(index: number, digit: string) {
  const updated = [...parts];
  updated[index] = digit;
  value = updated.join(",");
}

function handleInput(index: number, e: Event) {
  const input = e.target as HTMLInputElement;
  const raw = input.value.replace(/[^0-9]/g, "").slice(-1);
  setValue(index, raw);
  input.value = raw;
  if (raw && index < 6) inputs[index + 1]?.focus();
}

function handleKeydown(index: number, e: KeyboardEvent) {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    if (index < 6) inputs[index + 1]?.focus();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (index > 0) inputs[index - 1]?.focus();
  } else if (e.key === "Backspace") {
    e.preventDefault();
    setValue(index, "0");
    if (index > 0) inputs[index - 1]?.focus();
  }
}

async function handleFocus(index: number) {
  await tick();
  inputs[index]?.select();
}

function heatStyle(v: number, max: number): string {
  if (max === 0 || v === 0) return "background:hsl(0,0%,92%);color:hsl(0,0%,58%)";
  const ratio = v / max;
  const light = Math.round(92 - ratio * 28);
  const textLight = light < 76 ? 24 : 40;
  return `background:hsl(230,90%,${light}%);color:hsl(230,80%,${textLight}%)`;
}
</script>

{#if editable}
  <div class="flex w-full items-end gap-2">
    {#each DAYS_SHORT as day, i}
      <div class="flex flex-col items-center gap-1">
        <input
          bind:this={inputs[i]}
          value={parts[i] ?? "0"}
          maxlength="1"
          class="size-8 rounded-md border border-input bg-background text-center text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          oninput={(e) => handleInput(i, e)}
          onkeydown={(e) => handleKeydown(i, e)}
          onfocus={() => handleFocus(i)}
        />
        <span class="text-xs text-muted-foreground">{day}</span>
      </div>
    {/each}

    <div class="ml-auto flex flex-col items-end gap-1 pb-px">
      <span class="text-sm font-medium leading-8">{total}</span>
      <span class="text-xs text-muted-foreground">Total</span>
    </div>
  </div>
{:else}
  <div class="flex gap-0.5">
    {#each parts.map(Number) as hours, i}
      <div
        title="{hours} hour{hours === 1 ? '' : 's'} on {DAYS_LONG[i]}"
        class="flex size-6 items-center justify-center rounded text-xs font-medium"
        style={maxSchedule !== undefined ? heatStyle(hours, maxSchedule) : ""}
      >
        {hours}
      </div>
    {/each}
  </div>
{/if}
