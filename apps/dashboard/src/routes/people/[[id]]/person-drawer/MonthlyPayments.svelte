<script lang="ts">
import { onMount } from "svelte";
import { api } from "$lib/api";

type MonthlyPayment = { id: string; personId: string; month: number; year: number; amountPaid: number; amountAccrued: number };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const {
  personId,
  canEdit = false,
}: {
  personId: string;
  canEdit?: boolean;
} = $props();

let payments = $state<MonthlyPayment[]>([]);
let editingId = $state<string | null>(null);
let addingNew = $state(false);

type Draft = { month: number; year: number; amountPaid: string; amountAccrued: string };

let draft = $state<Draft>({ month: 1, year: new Date().getFullYear(), amountPaid: "", amountAccrued: "" });

onMount(async () => {
  try {
    payments = (await api.people(personId).monthlyPayments.$get()) as MonthlyPayment[];
  } catch (e) {
    console.error(`Failed to load monthly payments: ${(e as Error).message}`);
  }
});

function startAdd() {
  editingId = null;
  draft = { month: new Date().getMonth() + 1, year: new Date().getFullYear(), amountPaid: "", amountAccrued: "" };
  addingNew = true;
}

function startEdit(p: MonthlyPayment) {
  addingNew = false;
  editingId = p.id;
  draft = { month: p.month, year: p.year, amountPaid: String(p.amountPaid), amountAccrued: String(p.amountAccrued) };
}

function cancelEdit() {
  editingId = null;
  addingNew = false;
}

async function saveNew() {
  const body = { month: draft.month, year: draft.year, amountPaid: Number(draft.amountPaid), amountAccrued: Number(draft.amountAccrued) };
  try {
    const id = (await api.people(personId).monthlyPayments.$post(body)) as string;
    payments = [{ id, personId, ...body }, ...payments];
    addingNew = false;
  } catch (e) {
    alert((e as Error).message ?? "Failed to save");
  }
}

async function saveEdit(id: string) {
  const body = { month: draft.month, year: draft.year, amountPaid: Number(draft.amountPaid), amountAccrued: Number(draft.amountAccrued) };
  try {
    await api.people(personId).monthlyPayments(id).$patch(body);
    payments = payments.map((p) => (p.id === id ? { ...p, ...body } : p));
    editingId = null;
  } catch (e) {
    alert((e as Error).message ?? "Failed to save");
  }
}

const canSave = $derived(draft.amountPaid !== "" && draft.amountAccrued !== "");
</script>

<section>
  <div class="mb-3 flex items-center justify-between">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Monthly Payments</h3>
    {#if canEdit && !addingNew}
      <button
        type="button"
        class="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        onclick={startAdd}
        aria-label="Add monthly payment"
      >
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    {/if}
  </div>

  <div class="space-y-1">
    {#if addingNew}
      <div class="rounded-md border border-border bg-muted/30 p-2 space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted-foreground">Month</span>
            <select
              bind:value={draft.month}
              class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {#each MONTH_NAMES as name, i}
                <option value={i + 1}>{name}</option>
              {/each}
            </select>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted-foreground">Year</span>
            <input
              type="number"
              bind:value={draft.year}
              class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted-foreground">Paid ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              bind:value={draft.amountPaid}
              placeholder="0.00"
              class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted-foreground">Accrued ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              bind:value={draft.amountAccrued}
              placeholder="0.00"
              class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            onclick={cancelEdit}
            class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >Cancel</button>
          <button
            type="button"
            onclick={saveNew}
            disabled={!canSave}
            class="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
          >Save</button>
        </div>
      </div>
    {/if}

    {#each payments as p (p.id)}
      {#if editingId === p.id}
        <div class="rounded-md border border-border bg-muted/30 p-2 space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-muted-foreground">Month</span>
              <select
                bind:value={draft.month}
                class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {#each MONTH_NAMES as name, i}
                  <option value={i + 1}>{name}</option>
                {/each}
              </select>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-muted-foreground">Year</span>
              <input
                type="number"
                bind:value={draft.year}
                class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-muted-foreground">Paid ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                bind:value={draft.amountPaid}
                placeholder="0.00"
                class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-muted-foreground">Accrued ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                bind:value={draft.amountAccrued}
                placeholder="0.00"
                class="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              onclick={cancelEdit}
              class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >Cancel</button>
            <button
              type="button"
              onclick={() => saveEdit(p.id)}
              disabled={!canSave}
              class="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
            >Save</button>
          </div>
        </div>
      {:else}
        <div class="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
          <span class="w-16 shrink-0 text-sm text-muted-foreground">{MONTH_NAMES[p.month - 1]} {p.year}</span>
          <span class="flex-1 font-mono text-sm text-(--red)">${p.amountPaid.toLocaleString()}</span>
          <span class="flex-1 font-mono text-sm text-amber-600">${p.amountAccrued.toLocaleString()}</span>
          {#if canEdit}
            <button
              type="button"
              onclick={() => startEdit(p)}
              class="invisible rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:visible"
              aria-label="Edit"
            >
              <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          {/if}
        </div>
      {/if}
    {/each}

    {#if payments.length === 0 && !addingNew}
      <p class="px-2 text-sm text-muted-foreground">No records yet.</p>
    {/if}
  </div>
</section>
