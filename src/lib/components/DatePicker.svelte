<script lang="ts">
  import { parseDate, type DateValue } from "@internationalized/date";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as Calendar from "$lib/components/ui/calendar/index.js";
  import { formatDate } from "$lib/utils";

  export let value: string; // YYYY-MM-DD
  export let onchange: (value: string) => void = () => {};
  export let placeholder = "Pick a date";
  export let buttonClass = "";

  let open = false;

  $: dateValue = value ? parseDate(value) : undefined;

  function handleSelect(date: DateValue | undefined) {
    if (!date) return;
    value = date.toString();
    onchange(value);
    open = false;
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    <button
      type="button"
      class="inline-flex w-[130px] items-center justify-between rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground {buttonClass}"
    >
      <svg class="size-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>{value ? formatDate(value) : placeholder}</span>
    </button>
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="start">
    <Calendar.Calendar type="single" value={dateValue} onValueChange={handleSelect} />
  </Popover.Content>
</Popover.Root>
