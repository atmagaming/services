<script lang="ts">
import WeeklySchedule from "$components/weekly-schedule";

const {
  form = $bindable(),
  canEditPeople = false,
}: {
  form: { weeklySchedule: string; hourlyRatePaid: number; hourlyRateAccrued: number };
  canEditPeople?: boolean;
} = $props();

const hourlyTotal = $derived(+form.hourlyRatePaid + +form.hourlyRateAccrued);

function fmtHourly(n: number) {
  return n.toFixed(2);
}
</script>

<section>
  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Work Conditions</h3>

  <span class="mb-1 block text-xs font-medium text-muted-foreground">Schedule (hours)</span>
  <WeeklySchedule bind:value={form.weeklySchedule} readonly={!canEditPeople} />

  <div class="mt-4 space-y-2">
    <span class="mb-2 block text-xs font-medium text-muted-foreground">Hourly Rate (USD)</span>
    <div class="flex items-center gap-2">
      <div class="flex w-19 flex-col items-center gap-1">
        <div class="flex h-9 w-19 items-center justify-center rounded-md border border-border bg-background shadow-xs">
          <input
            bind:value={form.hourlyRatePaid}
            type="text" inputmode="decimal"
            readonly={!canEditPeople}
            oninput={(e) => { const el = e.target as HTMLInputElement; el.value = el.value.replace(/[^0-9.]/g, "").replace(/(\\..*?)\\..+/g, "$1"); form.hourlyRatePaid = el.value as unknown as number; }}
            onblur={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(v)) form.hourlyRatePaid = v.toFixed(2) as unknown as number; }}
            class="w-full bg-transparent px-2 text-center text-sm font-medium focus:outline-none"
          />
        </div>
        <span class="text-xs text-muted-foreground">Paid</span>
      </div>
      <div class="flex w-19 flex-col items-center gap-1">
        <div class="flex h-9 w-19 items-center justify-center rounded-md border border-border bg-background shadow-xs">
          <input
            bind:value={form.hourlyRateAccrued}
            type="text" inputmode="decimal"
            readonly={!canEditPeople}
            oninput={(e) => { const el = e.target as HTMLInputElement; el.value = el.value.replace(/[^0-9.]/g, "").replace(/(\\..*?)\\..+/g, "$1"); form.hourlyRateAccrued = el.value as unknown as number; }}
            onblur={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(v)) form.hourlyRateAccrued = v.toFixed(2) as unknown as number; }}
            class="w-full bg-transparent px-2 text-center text-sm font-medium focus:outline-none"
          />
        </div>
        <span class="text-xs text-muted-foreground">Accrued</span>
      </div>
      <div class="ml-auto flex flex-col items-end gap-1">
        <div class="flex h-9 items-center">
          <span class="text-sm font-medium">{fmtHourly(hourlyTotal)}</span>
        </div>
        <span class="text-xs text-muted-foreground">Total</span>
      </div>
    </div>
  </div>
</section>
