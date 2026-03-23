<script lang="ts">
import { onMount, tick, untrack } from "svelte";

let {
  value = $bindable(""),
  placeholder = "",
  className = "",
  showDisplayPlaceholder = true,
  autofocus = false,
}: {
  value?: string;
  placeholder?: string;
  className?: string;
  showDisplayPlaceholder?: boolean;
  autofocus?: boolean;
} = $props();

let editing = $state(untrack(() => autofocus));
let inputEl = $state<HTMLInputElement | null>(null);

onMount(async () => {
  if (autofocus) {
    await tick();
    inputEl?.focus();
    inputEl?.select();
  }
});

async function startEdit() {
  editing = true;
  await tick();
  inputEl?.focus();
  inputEl?.select();
}

function stopEdit() {
  editing = false;
}
</script>

{#if editing}
  <input
    bind:this={inputEl}
    bind:value
    {placeholder}
    class="field-sizing-content bg-transparent outline-none {className}"
    onblur={stopEdit}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === "Escape") inputEl?.blur();
    }}
  />
{:else}
  <button
    type="button"
    onclick={startEdit}
    onfocus={startEdit}
    class="cursor-text text-left hover:opacity-70 {className}"
  >
    {#if value}
      {value}
    {:else if showDisplayPlaceholder && placeholder}
      <span class="text-muted-foreground/60">{placeholder}</span>
    {/if}
  </button>
{/if}
