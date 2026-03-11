<script lang="ts">
import { goto } from "$app/navigation";
import { onMount } from "svelte";

onMount(() => {
  goto("/finances", { replaceState: true });
});
</script>
