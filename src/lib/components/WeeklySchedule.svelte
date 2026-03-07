<script lang="ts">
  import { tick } from "svelte";

  export let value: string; // "4,4,4,4,4,0,0"
  export let readonly = false;

  const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  let inputs: HTMLInputElement[] = [];

  $: parts = value.split(",").map((v) => v.trim());
  $: total = parts.reduce((sum, v) => sum + (parseInt(v) || 0), 0);

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
</script>

<div class="flex w-full items-end gap-2">
  {#each DAYS as day, i}
    <div class="flex flex-col items-center gap-1">
      <input
        bind:this={inputs[i]}
        value={parts[i] ?? "0"}
        maxlength="1"
        {readonly}
        class="size-8 rounded-md border border-input bg-background text-center text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring {readonly ? 'opacity-60' : ''}"
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
