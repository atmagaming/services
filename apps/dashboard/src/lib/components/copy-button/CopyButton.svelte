<script lang="ts">
import Check from "@lucide/svelte/icons/check";
import Copy from "@lucide/svelte/icons/copy";

interface Props {
  value: string;
  size?: number;
  class?: string;
}

let { value, size = 4, class: className = "" }: Props = $props();

let copied = $state(false);

async function copy() {
  await navigator.clipboard.writeText(value);
  copied = true;
  setTimeout(() => (copied = false), 1500);
}
</script>

<button
  type="button"
  onclick={(e) => {
    e.stopPropagation();
    copy();
  }}
  class="shrink-0 rounded p-0.5 hover:bg-muted {className}"
  aria-label="Copy"
>
  {#if copied}
    <Check class="size-{size} text-green-500" />
  {:else}
    <Copy class="size-{size} text-muted-foreground" />
  {/if}
</button>
