<script lang="ts">
import { onMount } from "svelte";
import { api, type Transaction } from "$lib/api";
import TransactionsTable from "./TransactionsTable.svelte";

let transactions = $state<Transaction[] | null>(null);

onMount(async () => {
  try {
    transactions = (await api.transactions.$get()) as Transaction[];
  } catch {
    transactions = [];
  }
});
</script>

{#if transactions}
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Transactions</h1>
      <p class="mt-1 text-sm text-muted-foreground">Browse and filter all recorded transactions.</p>
    </div>
    <TransactionsTable {transactions} highlightPersonIds={[]} maskedPersonIds={[]} />
  </div>
{/if}
