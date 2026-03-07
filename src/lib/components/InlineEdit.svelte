<script lang="ts">
  import { tick } from "svelte";

  export let value: string;
  export let placeholder = "";
  export let className = "";
  /** When false, empty display state shows nothing instead of placeholder text.
   *  When true (default), placeholder is shown muted like a real HTML placeholder. */
  export let showDisplayPlaceholder = true;

  let editing = false;
  let inputEl: HTMLInputElement;

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
    class="[field-sizing:content] bg-transparent outline-none {className}"
    onblur={stopEdit}
    onkeydown={(e) => { if (e.key === "Enter" || e.key === "Escape") inputEl.blur(); }}
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
