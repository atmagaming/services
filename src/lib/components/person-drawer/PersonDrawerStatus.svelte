<script lang="ts">
import { invalidateAll } from "$app/navigation";
import StatusChangeRow from "$components/status-change-row";
import type { Person } from "$lib/types";
import "$lib/date-extensions";

const STATUS_COLORS: Record<string, string> = {
  working: "bg-green-100 text-green-800",
  vacation: "bg-blue-100 text-blue-800",
  sick_leave: "bg-yellow-100 text-yellow-800",
  inactive: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  working: "Working",
  vacation: "Vacation",
  sick_leave: "Sick Leave",
  inactive: "Inactive",
};

const { person, canEditPeople = false }: { person: Person; canEditPeople?: boolean } = $props();

async function addStatus() {
  const res = await fetch(`/api/people/${person.id}/status`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "inactive", date: new Date().toISOString().slice(0, 10) }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    alert(body.message ?? "Failed to add status");
    return;
  }
  await invalidateAll();
}

async function updateStatus(statusId: string, field: "status" | "date", value: string) {
  const res = await fetch(`/api/people/${person.id}/status/${statusId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    alert(body.message ?? "Failed to update status");
  }
  await invalidateAll();
}

async function deleteStatus(statusId: string) {
  const res = await fetch(`/api/people/${person.id}/status/${statusId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    alert(body.message ?? "Failed to delete status");
    return;
  }
  await invalidateAll();
}
</script>

<section>
  <div class="mb-3 flex items-center justify-between">
    <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status</h3>
    {#if canEditPeople}
      <button
        type="button"
        class="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        onclick={addStatus}
        aria-label="Add status change"
      >
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    {/if}
  </div>
  <div class="space-y-1">
    {#each [...person.statusChanges].sort((a, b) => b.date.localeCompare(a.date)) as sc (sc.id)}
      {#if canEditPeople}
        <StatusChangeRow statusChange={sc} onUpdate={(field, value) => updateStatus(sc.id, field, value)} onDelete={() => deleteStatus(sc.id)} />
      {:else}
        <div class="flex items-center gap-2 px-2 py-1">
          <span class="w-32.5 text-sm text-muted-foreground">{Date.fromIso(sc.date).toShort()}</span>
          <span class={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[sc.status] ?? "bg-gray-100 text-gray-500"}`}>
            {STATUS_LABELS[sc.status] ?? sc.status}
          </span>
        </div>
      {/if}
    {/each}
  </div>
</section>
