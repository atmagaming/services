<script lang="ts">
import ArrowDownToLine from "@lucide/svelte/icons/arrow-down-to-line";
import type { ComponentProps } from "svelte";

const props: ComponentProps<typeof ArrowDownToLine> = $props();
</script>

<ArrowDownToLine {...props} />
