<script lang="ts">
  import PeoplePage from "$lib/components/PeoplePage.svelte";
  export let data: import("./$types").PageData;
</script>

<PeoplePage {data} />
