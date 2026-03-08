<script lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";

const { label, value, color, bg }: { label: string; value: number; color: string; bg: string } = $props();
</script>

<Card class="gap-2 py-5" style={`background: ${bg};`}>
  <CardHeader class="px-5 pb-0">
    <CardTitle class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
  </CardHeader>
  <CardContent class="px-5">
    <p class="text-2xl font-bold tabular-nums" style={`color: ${color};`}>${value.toLocaleString()}</p>
  </CardContent>
</Card>
