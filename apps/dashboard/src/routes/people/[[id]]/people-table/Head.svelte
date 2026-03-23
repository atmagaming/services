<script lang="ts">
import { TableHead } from "$components/table";
import * as Tooltip from "$components/tooltip";

const { label, tooltip, sticky = false }: { label: string; tooltip?: string; sticky?: boolean } = $props();
</script>

<TableHead
  class={[
    "sticky top-0 border-b border-border bg-card text-center",
    sticky
      ? "z-20 left-0 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border after:content-['']"
      : "z-10",
  ]}
>
  {#if tooltip}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <span {...props} class="cursor-default">{label}</span>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>{tooltip}</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {:else}
    {label}
  {/if}
</TableHead>
