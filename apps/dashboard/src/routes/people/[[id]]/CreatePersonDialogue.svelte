<script lang="ts">
import { Content, Dialog } from "$components/dialog";

const { open } = $props();
</script>

<Dialog {open}>
  <Content showCloseButton={false} class="flex flex-col items-center gap-3 py-8 sm:max-w-xs">
    <div class="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground"></div>
    <p class="text-sm text-muted-foreground">Creating person…</p>
  </Content>
</Dialog>
