<script lang="ts">
import TrendingUp from "@lucide/svelte/icons/trending-up";
import type { ComponentProps } from "svelte";

const props: ComponentProps<typeof TrendingUp> = $props();
</script>

<TrendingUp {...props} />
