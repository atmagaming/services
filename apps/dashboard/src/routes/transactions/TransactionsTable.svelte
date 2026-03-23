<script lang="ts">
import * as Select from "$components/select";
import type { Transaction } from "$lib/api";
import "$lib/date-extensions";
import CircleHelp from "@lucide/svelte/icons/circle-help";
import { Badge } from "$components/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$components/table";

const {
  transactions = [],
  highlightPersonIds = [],
  maskedPersonIds = [],
}: {
  transactions?: Transaction[];
  highlightPersonIds?: string[];
  maskedPersonIds?: string[];
} = $props();

let methodFilter = $state("all");
let categoryFilter = $state("all");
let tooltip = $state<{ x: number; y: number } | null>(null);
let tooltipTimeout: ReturnType<typeof setTimeout> | undefined;

const highlightSet = $derived(new Set(highlightPersonIds));
const maskedSet = $derived(new Set(maskedPersonIds));

const categories = $derived([...new Set(transactions.map((t) => t.category).filter(Boolean))].sort());
const methods = ["Paid", "Accrued", "Invested"];

const filtered = $derived(
  (() => {
    let result = transactions;
    if (methodFilter !== "all") result = result.filter((t) => t.method === methodFilter);
    if (categoryFilter !== "all") result = result.filter((t) => t.category === categoryFilter);
    return result;
  })(),
);

function showTooltip(event: MouseEvent) {
  clearTimeout(tooltipTimeout);
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  tooltip = { x: rect.left + rect.width / 2, y: rect.top };
}

function hideTooltip() {
  tooltipTimeout = setTimeout(() => {
    tooltip = null;
  }, 50);
}
</script>

<div class="rounded-xl border border-border bg-card shadow-sm">
  <div class="flex flex-wrap gap-3 border-b border-border p-4">
    <Select.Root type="single" value={methodFilter} onValueChange={(v) => (methodFilter = v)}>
      <Select.Trigger>{methodFilter === "all" ? "All Methods" : methodFilter}</Select.Trigger>
      <Select.Content>
        <Select.Item value="all">All Methods</Select.Item>
        {#each methods as method}
          <Select.Item value={method}>{method}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <Select.Root type="single" value={categoryFilter} onValueChange={(v) => (categoryFilter = v)}>
      <Select.Trigger>{categoryFilter === "all" ? "All Categories" : categoryFilter}</Select.Trigger>
      <Select.Content>
        <Select.Item value="all">All Categories</Select.Item>
        {#each categories as category}
          <Select.Item value={category}>{category}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <span class="ml-auto self-center text-sm text-muted-foreground">{filtered.length} transactions</span>
  </div>

  <Table>
    <TableHeader>
      <TableRow class="border-b border-border hover:bg-transparent">
        <TableHead>Date</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Payee</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Method</TableHead>
        <TableHead>USD</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each filtered as tx (tx.id)}
        <TableRow
          class={highlightSet.has(tx.personId ?? "")
            ? "bg-primary/5"
            : maskedSet.has(tx.personId ?? "")
              ? "bg-muted/40"
              : ""}
        >
          <TableCell class="whitespace-nowrap px-3 py-2.5 text-sm">{Date.fromIso(tx.logicalDate).toShort()}</TableCell>
          <TableCell
            class={`max-w-xs truncate px-3 py-2.5 text-sm ${maskedSet.has(tx.personId ?? "") ? "text-muted-foreground" : ""}`}
          >
            {tx.note}
          </TableCell>
          <TableCell class={`px-3 py-2.5 text-sm ${maskedSet.has(tx.personId ?? "") ? "text-muted-foreground" : ""}`}>
            {tx.payeeName}
          </TableCell>
          <TableCell class={`px-3 py-2.5 text-sm ${maskedSet.has(tx.personId ?? "") ? "text-muted-foreground" : ""}`}>
            {tx.category}
          </TableCell>
          <TableCell class="px-3 py-2.5 text-sm">
            <Badge
              variant={tx.method === "Paid" ? "destructive" : tx.method === "Accrued" ? "outline" : "secondary"}
              class={tx.method === "Accrued"
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : tx.method === "Invested"
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : ""}
            >
              {tx.method}
            </Badge>
          </TableCell>
          <TableCell
            class={`whitespace-nowrap px-3 py-2.5 text-sm font-mono ${
              maskedSet.has(tx.personId ?? "")
                ? "cursor-help text-muted-foreground"
                : tx.amount > 0
                  ? "text-(--green)"
                  : "text-(--red)"
            }`}
            onmouseenter={maskedSet.has(tx.personId ?? "") ? showTooltip : undefined}
            onmouseleave={maskedSet.has(tx.personId ?? "") ? hideTooltip : undefined}
          >
            {#if maskedSet.has(tx.personId ?? "")}
              <CircleHelp size={16} class="inline opacity-40" />
            {:else}
              ${Math.abs(tx.amount).toLocaleString()}
            {/if}
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>

{#if tooltip}
  <div
    class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
    style={`left: ${tooltip.x}px; top: ${tooltip.y - 6}px;`}
  >
    Other team members' salaries are hidden
  </div>
{/if}
