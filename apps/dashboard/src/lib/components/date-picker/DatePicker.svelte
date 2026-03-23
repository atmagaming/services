<script lang="ts">
import { CalendarDate, type DateValue, getLocalTimeZone, parseDate } from "@internationalized/date";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import { untrack } from "svelte";
import { Button } from "$components/button";
import { Calendar } from "$components/calendar";
import { Input } from "$components/input";
import * as Popover from "$components/popover";
import { cn } from "$lib/utils";

let {
  value = $bindable(""),
  placeholder = "Pick a date",
  class: className = "",
}: {
  value: string;
  placeholder?: string;
  class?: string;
} = $props();

let open = $state(false);

const calendarValue = $derived(value ? parseDate(value.slice(0, 10)) : undefined);

function toDisplayValue(v: typeof calendarValue) {
  return v
    ? v.toDate(getLocalTimeZone()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
}

let inputValue = $state(untrack(() => (value ? toDisplayValue(parseDate(value.slice(0, 10))) : "")));

$effect(() => {
  inputValue = toDisplayValue(calendarValue);
});

function handleInput(raw: string) {
  inputValue = raw;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()))
    value = new CalendarDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()).toString();
}

function handleSelect(date: DateValue | undefined) {
  if (!date) return;
  value = date.toString();
  open = false;
}
</script>

<div class={cn("relative flex", className)}>
  <Input
    value={inputValue}
    oninput={(e) => handleInput((e.target as HTMLInputElement).value)}
    {placeholder}
    class="pe-9 bg-background"
    onkeydown={(e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        open = true;
      }
    }}
  />
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="absolute inset-e-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
        >
          <CalendarIcon class="size-3.5" />
          <span class="sr-only">Select date</span>
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-auto overflow-hidden p-0" align="end">
      <Calendar type="single" value={calendarValue} onValueChange={handleSelect} captionLayout="dropdown" />
    </Popover.Content>
  </Popover.Root>
</div>
