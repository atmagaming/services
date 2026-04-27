<script lang="ts">
  import { Chip } from "$components/chip";
  import { type PersonStatus } from "$lib/api";

  const { status }: { status: PersonStatus | null } = $props();

  const colors: Record<PersonStatus, string> = {
    working: "green",
    vacation: "blue",
    sick_leave: "yellow",
    inactive: "gray",
  };

  const label = $derived(
    status === null
      ? null
      : status
          .split("_")
          .map((w: string) => w.capitalize())
          .join(" "),
  );

  const color = $derived(status === null ? "gray" : colors[status]);
</script>

<div class="flex justify-center">
  {#if label !== null}
    <Chip text={label} {color} />
  {/if}
</div>
