<script lang="ts">
import { type DateValue, parseDate } from "@internationalized/date";
import * as Calendar from "$components/calendar";
import * as Popover from "$components/popover";
import "$lib/date-extensions";

const {
  value,
  onchange = () => {},
  placeholder = "Pick a date",
  buttonClass = "",
}: {
  value: string;
  onchange?: (value: string) => void;
  placeholder?: string;
  buttonClass?: string;
} = $props();

let open = $state(false);

const dateValue = $derived(value ? parseDate(value) : undefined);

// Parse current value into parts
const parsed = $derived(value ? Date.fromIso(value) : null);
let dayInput = $state(parsed ? String(parsed.getDate()).padStart(2, "0") : "");
let monthInput = $state(parsed ? String(parsed.getMonth() + 1).padStart(2, "0") : "");
let yearInput = $state(parsed ? String(parsed.getFullYear()) : "");

let dayEl = $state<HTMLInputElement | null>(null);
let monthEl = $state<HTMLInputElement | null>(null);
let yearEl = $state<HTMLInputElement | null>(null);

function tryEmit() {
  const d = Number(dayInput);
  const m = Number(monthInput);
  const y = Number(yearInput);
  if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1000 && y <= 9999) {
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onchange(iso);
  }
}

function onDayInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 2);
  dayInput = raw;
  if (raw.length === 2) monthEl?.focus();
  tryEmit();
}

function onMonthInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 2);
  monthInput = raw;
  if (raw.length === 2) yearEl?.focus();
  tryEmit();
}

function onYearInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4);
  yearInput = raw;
  tryEmit();
}

function onDayKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowRight" && (e.target as HTMLInputElement).selectionStart === dayInput.length) monthEl?.focus();
}

function onMonthKeydown(e: KeyboardEvent) {
  const input = e.target as HTMLInputElement;
  if (e.key === "ArrowLeft" && input.selectionStart === 0) dayEl?.focus();
  if (e.key === "ArrowRight" && input.selectionStart === monthInput.length) yearEl?.focus();
  if (e.key === "Backspace" && monthInput === "") dayEl?.focus();
}

function onYearKeydown(e: KeyboardEvent) {
  const input = e.target as HTMLInputElement;
  if (e.key === "ArrowLeft" && input.selectionStart === 0) monthEl?.focus();
  if (e.key === "Backspace" && yearInput === "") monthEl?.focus();
}

function handleSelect(date: DateValue | undefined) {
  if (!date) return;
  const iso = date.toString();
  onchange(iso);
  const d = Date.fromIso(iso);
  dayInput = String(d.getDate()).padStart(2, "0");
  monthInput = String(d.getMonth() + 1).padStart(2, "0");
  yearInput = String(d.getFullYear());
  open = false;
}
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div
        {...props}
        class="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground {buttonClass}"
        role="group"
      >
        <!-- Calendar icon opens the popover -->
        <svg class="mr-1 size-3.5 shrink-0 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>

        {#if !value && !dayInput && !monthInput && !yearInput}
          <span class="text-muted-foreground/60">{placeholder}</span>
        {/if}

        <input
          bind:this={dayEl}
          type="text"
          inputmode="numeric"
          placeholder="DD"
          maxlength="2"
          value={dayInput}
          oninput={onDayInput}
          onkeydown={onDayKeydown}
          onclick={(e) => e.stopPropagation()}
          onfocus={() => { open = false; }}
          class="w-6 bg-transparent text-center outline-none placeholder:text-muted-foreground/40 focus:text-foreground"
        />
        <span class="select-none">/</span>
        <input
          bind:this={monthEl}
          type="text"
          inputmode="numeric"
          placeholder="MM"
          maxlength="2"
          value={monthInput}
          oninput={onMonthInput}
          onkeydown={onMonthKeydown}
          onclick={(e) => e.stopPropagation()}
          onfocus={() => { open = false; }}
          class="w-6 bg-transparent text-center outline-none placeholder:text-muted-foreground/40 focus:text-foreground"
        />
        <span class="select-none">/</span>
        <input
          bind:this={yearEl}
          type="text"
          inputmode="numeric"
          placeholder="YYYY"
          maxlength="4"
          value={yearInput}
          oninput={onYearInput}
          onkeydown={onYearKeydown}
          onclick={(e) => e.stopPropagation()}
          onfocus={() => { open = false; }}
          class="w-10 bg-transparent text-center outline-none placeholder:text-muted-foreground/40 focus:text-foreground"
        />
      </div>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="start">
    <Calendar.Calendar type="single" value={dateValue} onValueChange={handleSelect} />
  </Popover.Content>
</Popover.Root>
