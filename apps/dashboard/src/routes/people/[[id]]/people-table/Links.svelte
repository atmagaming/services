<script lang="ts">
import type { PersonFull } from "$lib/api";

const { person }: { person: PersonFull } = $props();

const notion = $derived(person.id ? `https://notion.so/${person.id.replace(/-/g, "")}` : null);
const telegram = $derived(person.telegram ? `https://t.me/${person.telegram.replace(/^@/, "")}` : null);
const discord = $derived(person.discord ? `Discord: ${person.discord}` : null);
const linkedin = $derived(person.linkedin ?? null);
const links = $derived({ notion, telegram, discord, linkedin });
</script>

<div class="flex flex-wrap justify-center gap-1" style="width: 52px">
  {#each Object.entries(links) as [link, url]}
    {#if url}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={link.capitalize()}
        onclick={(e) => e.stopPropagation()}
      >
        <img
          src={`/icons/${link}.webp`}
          alt={link.capitalize()}
          class="size-5 rounded opacity-70 transition-opacity hover:opacity-100"
        />
      </a>
    {/if}
  {/each}
</div>
