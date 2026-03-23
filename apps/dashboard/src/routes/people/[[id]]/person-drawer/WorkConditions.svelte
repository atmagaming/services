<script lang="ts">
import Schedule from "$components/Schedule.svelte";
import RateInput from "./RateInput.svelte";

const {
  form = $bindable(),
  canEditPeople = false,
}: {
  form: { schedule: string; hourlyRatePaid: number; hourlyRateAccrued: number };
  canEditPeople?: boolean;
} = $props();

const hourlyTotal = $derived((parseFloat(String(form.hourlyRatePaid)) || 0) + (parseFloat(String(form.hourlyRateAccrued)) || 0));
</script>

<section>
  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Work Conditions</h3>

  <span class="mb-1 block text-xs font-medium text-muted-foreground">Schedule (hours)</span>
  <Schedule bind:value={form.schedule} editable={canEditPeople} />

  <div class="mt-4 space-y-2">
    <span class="mb-2 block text-xs font-medium text-muted-foreground">Hourly Rate (USD)</span>
    <div class="flex items-center gap-2">
      <RateInput bind:value={form.hourlyRatePaid} label="Paid" readonly={!canEditPeople} />
      <RateInput bind:value={form.hourlyRateAccrued} label="Accrued" readonly={!canEditPeople} />
      <div class="ml-auto flex flex-col items-end gap-1">
        <div class="flex h-9 items-center">
          <span class="text-sm font-medium">{hourlyTotal.toFixed(2)}</span>
        </div>
        <span class="text-xs text-muted-foreground">Total</span>
      </div>
    </div>
  </div>
</section>
