<script lang="ts">
import PeoplePage from "$components/people-page";

const { data }: { data: import("./$types").PageData } = $props();
</script>

<PeoplePage {data} />
