<script lang="ts">
import CopyButton from "$components/copy-button";
import InlineEdit from "$components/inline-edit";

let {
  email = $bindable(""),
  copyable = false,
  editable = false,
}: {
  email: string;
  copyable?: boolean;
  editable?: boolean;
} = $props();
</script>

<div class="flex items-center gap-1">
  {#if editable}
    <InlineEdit bind:value={email} placeholder="Add email…" className="flex-1 truncate text-sm" />
  {:else if email}
    <a
      href="mailto:{email}"
      class="text-sm text-muted-foreground hover:text-foreground hover:underline"
      onclick={(e) => e.stopPropagation()}>{email}</a
    >
  {:else}
    <span class="text-sm text-muted-foreground">—</span>
  {/if}
  {#if copyable && email}
    <CopyButton value={email} size={3} />
  {/if}
</div>
