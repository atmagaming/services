<script lang="ts">
import { onMount } from "svelte";
import TransactionsTable from "$components/transactions-table";
import { apiJson } from "$lib/api";
import type { Transaction } from "$lib/types";

interface TransactionsData {
  transactions: Transaction[];
  highlightPersonIds: string[];
  maskedPersonIds: string[];
}

let payload = $state<TransactionsData | null>(null);

onMount(async () => {
  payload = await apiJson<TransactionsData>("/finances/transactions");
});
</script>

{#if payload}
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Transactions</h1>
      <p class="mt-1 text-sm text-muted-foreground">Browse and filter all recorded transactions.</p>
    </div>
    <TransactionsTable
      transactions={payload.transactions}
      highlightPersonIds={payload.highlightPersonIds}
      maskedPersonIds={payload.maskedPersonIds}
    />
  </div>
{/if}
