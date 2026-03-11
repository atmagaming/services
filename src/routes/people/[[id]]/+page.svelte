<script lang="ts">
import { invalidateAll, pushState, replaceState } from "$app/navigation";
import { Button } from "$components/button";
import * as Dialog from "$components/dialog";
import PeopleTable from "$components/people-table";
import PersonDrawer from "$components/person-drawer";
import { type Person, Rates } from "$lib/types";

const { data }: { data: import("./$types").PageData } = $props();

const ACTIVE_STATUSES = new Set(["working", "vacation", "sick_leave"]);

function isActive(person: Person): boolean {
  const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  return latest !== undefined && ACTIVE_STATUSES.has(latest.status);
}

const overrides = $state<Record<string, Person>>({});
const people = $derived(data.people.map((p) => overrides[p.id] ?? p));

function countMondaysThisMonth(): number {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++)
    if (new Date(now.getFullYear(), now.getMonth(), day).getDay() === 1) count++;
  return count;
}

function onPersonFormChange(
  form: {
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    telegram: string;
    discord: string;
    linkedin: string;
    weeklySchedule: string;
    hourlyRatePaid: number;
    hourlyRateAccrued: number;
    identification: { type: string; number: string; issueDate: string; issuingAuthority: string };
  },
  roles: { notionId: string; name: string }[],
) {
  if (!selectedPersonId) return;
  const base = data.people.find((p) => p.id === selectedPersonId);
  if (!base) return;

  const schedule = form.weeklySchedule.split(",").map((s) => Number(s.trim()) || 0);
  const hoursPerWeek = schedule.reduce((a, b) => a + b, 0);
  const mondays = countMondaysThisMonth();
  const hourlyRate = new Rates(form.hourlyRatePaid, form.hourlyRateAccrued);
  const monthlyPaid = hoursPerWeek * hourlyRate.paid * mondays;
  const monthlyAccrued = hoursPerWeek * hourlyRate.accrued * mondays;

  overrides[selectedPersonId] = {
    ...base,
    name: form.name,
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    telegram: form.telegram,
    discord: form.discord,
    linkedin: form.linkedin,
    weeklySchedule: form.weeklySchedule,
    identification: form.identification as Person["identification"],
    schedule,
    hoursPerWeek,
    hourlyRate,
    monthlyPaid,
    monthlyAccrued,
    monthlyTotal: monthlyPaid + monthlyAccrued,
    roles,
  };
}

function onPersonSaved(updated: Person) {
  overrides[updated.id] = updated;
}

const activePeople = $derived(people.filter(isActive));
const inactivePeople = $derived(people.filter((p) => !isActive(p)));

let creatingPerson = $state(false);
let activeTab = $state<"active" | "inactive">("active");
let rateMode = $state<"hourly" | "sprint" | "monthly">("hourly");
const displayedPeople = $derived(activeTab === "active" ? activePeople : inactivePeople);

// svelte-ignore state_referenced_locally
let selectedPersonId = $state<string | undefined>(data.personId);
let focusName = $state(false);

const drawerPerson = $derived(
  selectedPersonId === undefined ? undefined : people.find((p) => p.id === selectedPersonId),
);

const drawerOpen = $derived(drawerPerson !== undefined);

async function openAddDrawer() {
  creatingPerson = true;
  try {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "New Person" }),
    });
    if (!res.ok) return;
    const { person } = (await res.json()) as { person: Person };
    await invalidateAll();
    focusName = true;
    selectedPersonId = person.id;
    pushState(`/people/${person.id}`, {});
  } finally {
    creatingPerson = false;
  }
}

function openEditDrawer(person: Person) {
  focusName = false;
  const isSwitch = drawerPerson !== undefined;
  selectedPersonId = person.id;
  if (isSwitch) replaceState(`/people/${person.id}`, {});
  else pushState(`/people/${person.id}`, {});
}

function closeDrawer() {
  selectedPersonId = undefined;
  replaceState("/people", {});
}
</script>

<Dialog.Dialog open={creatingPerson}>
  <Dialog.Content showCloseButton={false} class="flex flex-col items-center gap-3 py-8 sm:max-w-xs">
    <div class="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground"></div>
    <p class="text-sm text-muted-foreground">Creating person…</p>
  </Dialog.Content>
</Dialog.Dialog>

<div class="mb-4 flex shrink-0 items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">
      {data.canViewPersonalData ? "HR — People" : "Team"}
    </h1>
    <p class="mt-1 text-sm text-muted-foreground">
      {data.canViewPersonalData
        ? "Full team directory with contact info and HR data."
        : "Active team members."}
    </p>
  </div>
  {#if data.canEditPeople}
    <Button onclick={openAddDrawer}>Add Person</Button>
  {/if}
</div>

<div class="flex shrink-0 items-center justify-between border-b border-border">
  <div class="flex gap-2">
    <button
      class={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
      onclick={() => (activeTab = "active")}
    >
      Active ({activePeople.length})
    </button>
    <button
      class={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "inactive" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
      onclick={() => (activeTab = "inactive")}
    >
      {data.canViewPersonalData ? "Inactive / Candidates" : "Inactive"} ({inactivePeople.length})
    </button>
  </div>
  {#if data.canViewPersonalData}
    <div class="flex rounded-md border border-border bg-muted/50 p-0.5">
      {#each ["hourly", "sprint", "monthly"] as mode}
        <button
          class={`rounded px-3 py-1 text-xs font-medium transition-colors ${rateMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onclick={() => (rateMode = mode as typeof rateMode)}
        >
          {mode === "hourly" ? "Hourly" : mode === "sprint" ? "Sprint" : "Monthly"}
        </button>
      {/each}
    </div>
  {/if}
</div>

<div class="mt-4 flex min-h-0 flex-1 gap-4">
  <div class="min-w-0 flex-1 rounded-lg border border-border bg-card h-fit">
    <PeopleTable
      people={displayedPeople}
      canViewPersonalData={data.canViewPersonalData}
      onEditPerson={data.canViewPersonalData ? openEditDrawer : undefined}
      {rateMode}
    />
  </div>
  {#if drawerOpen}
    <PersonDrawer
      person={drawerPerson ?? null}
      canEditPeople={data.canEditPeople}
      onClose={closeDrawer}
      onSaved={onPersonSaved}
      onFormChange={onPersonFormChange}
      {focusName}
      ndaTemplateUrl={data.ndaTemplateUrl}
      contractTemplateUrl={data.contractTemplateUrl}
    />
  {/if}
</div>
