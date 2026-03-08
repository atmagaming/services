<script lang="ts">
import ExpenseChart from "$components/expense-chart";
import InvestmentChart from "$components/investment-chart";
import RevenueChart from "$components/revenue-chart";
import SummaryCard from "$components/summary-card";
import TeamBreakdownTable from "$components/team-breakdown-table";

const { data } = $props();
const dashboard = $derived(data.data);
</script>

{#if dashboard}
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Financial Overview</h1>
      <p class="mt-1 text-sm text-muted-foreground">Track your team's financial performance and projections.</p>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      {#each dashboard.cards as card (card.label)}
        <SummaryCard label={card.label} value={card.value} color={card.color} bg={card.bg} />
      {/each}
    </div>

    <ExpenseChart historical={dashboard.monthlyExpenses} projections={dashboard.projections} />

    {#if dashboard.isAuthenticated}
      <RevenueChart data={dashboard.revenueShares} />
    {/if}

    <InvestmentChart data={dashboard.investmentTimeline} />

    <TeamBreakdownTable
      rows={dashboard.teamRows}
      currentPersonId={dashboard.currentPersonId}
      isAdmin={dashboard.canViewRevenueShares}
      isAuthenticated={dashboard.isAuthenticated}
      teamCount={dashboard.teamCount}
    />
  </div>
{/if}
