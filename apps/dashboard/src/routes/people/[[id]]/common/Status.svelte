<script lang="ts">
import { Chip } from "$components/chip";
import { type PersonStatus } from "$lib/api";

const { status }: { status: PersonStatus } = $props();

const label = $derived(
  status
    .split("_")
    .map((w) => w.capitalize())
    .join(" "),
);

const colors = {
  working: "green",
  vacation: "blue",
  sick_leave: "yellow",
  inactive: "gray",
};
</script>

<div class="flex justify-center">
  <Chip text={label} color={colors[status]} />
</div>
