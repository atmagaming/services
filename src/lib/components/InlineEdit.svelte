<script lang="ts">
import { tick } from "svelte";

let {
  value = $bindable(""),
  placeholder = "",
  className = "",
  showDisplayPlaceholder = true,
}: {
  value?: string;
  placeholder?: string;
  className?: string;
  showDisplayPlaceholder?: boolean;
} = $props();

let editing = $state(false);
let inputEl = $state<HTMLInputElement | null>(null);

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
    onkeydown={(e) => { if (e.key === "Enter" || e.key === "Escape") inputEl?.blur(); }}
  />
{:else}
  <button
    type="button"
    onclick={startEdit}
    class="cursor-text text-left hover:opacity-70 {className}"
  >
    {#if value}
      {value}
    {:else if showDisplayPlaceholder && placeholder}
      <span class="text-muted-foreground/60">{placeholder}</span>
    {/if}
  </button>
{/if}
