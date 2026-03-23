<script lang="ts" generics="T">
import { CircleQuestionMark } from "lucide-svelte";
import type { Snippet } from "svelte";
import { TableCell } from "$components/table";
import { isPersonFull, type Person, type PersonFull } from "$lib/api";

const {
  cells,
  person,
}: {
  cells: Snippet<[PersonFull]>[];
  person: Person;
} = $props();

const isFull = $derived(isPersonFull(person));
</script>

{#each cells as cell}
  <TableCell class="px-4 py-2 text-center">
    {#if isFull}
      {@render cell(person as PersonFull)}
    {:else}
      <CircleQuestionMark size={16} class="inline opacity-40" />
    {/if}
  </TableCell>
{/each}
