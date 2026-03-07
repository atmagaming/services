<script lang="ts">
  export let href: string;
  export let className = "";
</script>

<a
  {href}
  target="_blank"
  rel="noopener noreferrer"
  class="inline-flex items-center gap-0.5 text-muted-foreground underline underline-offset-2 hover:text-foreground {className}"
>
  <slot />
  <svg class="size-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
</a>
