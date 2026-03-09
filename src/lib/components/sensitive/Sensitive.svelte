<script lang="ts">
import type { Snippet } from "svelte";

const { visible, children }: { visible: boolean; children: Snippet } = $props();
</script>

{#if visible}
  {@render children()}
{:else}
  <img src="/question.png" alt="Hidden" width="16" height="16" class="inline opacity-40" />
{/if}
