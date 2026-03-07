<script lang="ts">
import PeoplePage from "$lib/components/PeoplePage.svelte";

const { data }: { data: import("./$types").PageData } = $props();
</script>

<PeoplePage {data} />
