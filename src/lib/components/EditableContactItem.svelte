<script lang="ts">
import { Pencil, X } from "@lucide/svelte";
import { tick } from "svelte";

const {
  icon,
  value,
  href = null,
  placeholder,
  onSave = () => {},
  onRemove = null,
  readonly = false,
}: {
  icon: string;
  value: string;
  href?: string | null;
  placeholder: string;
  onSave?: (value: string) => void;
  onRemove?: (() => void) | null;
  readonly?: boolean;
} = $props();

let editing = $state(false);
let editValue = $state("");
let inputEl = $state<HTMLInputElement | null>(null);

async function startEdit() {
  editValue = value;
  editing = true;
  await tick();
  inputEl?.focus();
  inputEl?.select();
}

function commitEdit() {
  editing = false;
  if (editValue !== value) onSave(editValue);
}
</script>

<div class="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
  <img src={icon} alt="" class="size-4 shrink-0 rounded-sm object-contain" />
  {#if editing}
    <input
      bind:this={inputEl}
      bind:value={editValue}
      class="flex-1 bg-transparent text-sm outline-none"
      onblur={commitEdit}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === "Escape") inputEl?.blur(); }}
    />
  {:else if value}
    {#if href}
      <a {href} target="_blank" rel="noopener noreferrer" class="flex-1 truncate text-sm text-primary hover:underline">
        {value}
      </a>
    {:else}
      <span class="flex-1 truncate text-sm">{value}</span>
    {/if}
    {#if !readonly}
      <div class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onclick={startEdit} class="rounded p-0.5 hover:bg-muted" aria-label="Edit">
          <Pencil class="size-3 text-muted-foreground" />
        </button>
        {#if onRemove}
          <button type="button" onclick={onRemove} class="rounded p-0.5 hover:bg-muted" aria-label="Remove">
            <X class="size-3 text-muted-foreground" />
          </button>
        {/if}
      </div>
    {/if}
  {:else if !readonly}
    <button type="button" onclick={startEdit} class="flex-1 text-left text-sm text-muted-foreground hover:text-foreground">
      {placeholder}
    </button>
  {:else}
    <span class="flex-1 text-sm text-muted-foreground">—</span>
  {/if}
</div>
