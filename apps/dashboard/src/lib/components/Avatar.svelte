<script lang="ts">
import { api } from "$lib/api";

const SIZES = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

type Size = keyof typeof SIZES;

let {
  src = "",
  name = "",
  size = "md",
  onUpload,
}: {
  src?: string;
  name?: string;
  size?: Size;
  onUpload?: (file: File) => void | Promise<void>;
} = $props();

const url = $derived(src ? `${api.$baseUrl}/images/${src}` : "");
const canEdit = $derived(onUpload !== undefined);
const sizeClass = $derived(SIZES[size]);

let fileInput = $state<HTMLInputElement | null>(null);
let dragOver = $state(false);
let uploading = $state(false);

async function handleFile(file: File) {
  if (!onUpload) return;
  uploading = true;
  try {
    await onUpload(file);
  } finally {
    uploading = false;
  }
}
</script>

<div
  role="button"
  tabindex={canEdit ? 0 : -1}
  class="group relative {sizeClass} shrink-0 {canEdit ? 'cursor-pointer' : ''}"
  onclick={() => {
    if (canEdit) fileInput?.click();
  }}
  onkeydown={(e) => {
    if (canEdit && (e.key === "Enter" || e.key === " ")) fileInput?.click();
  }}
  ondragover={(e) => {
    if (canEdit) {
      e.preventDefault();
      dragOver = true;
    }
  }}
  ondragleave={() => {
    dragOver = false;
  }}
  ondrop={(e) => {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file && canEdit) handleFile(file);
  }}
>
  <div
    class="{sizeClass} overflow-hidden rounded-full border border-border bg-muted {dragOver ? 'ring-2 ring-primary' : ''}"
  >
    {#if uploading}
      <div class="flex size-full items-center justify-center">
        <svg class="size-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    {:else if url}
      <img src={url} alt="" class="size-full object-cover" referrerpolicy="no-referrer" />
    {:else}
      <div class="flex size-full items-center justify-center bg-primary/10 text-xs font-bold text-primary">
        {(name || "?")[0].toUpperCase()}
      </div>
    {/if}
  </div>

  {#if canEdit && !uploading}
    <div
      class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <svg class="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  {/if}

  {#if canEdit}
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      class="hidden"
      onchange={(e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleFile(file);
      }}
    />
  {/if}
</div>
