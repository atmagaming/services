<script lang="ts">
import { onMount } from "svelte";
import { pushState, replaceState } from "$app/navigation";
import { page } from "$app/state";
import { Button } from "$components/button";
import PeopleTable from "$components/people-table";
import { api, isPersonFull, type Person, type PersonFull } from "$lib/api";
import { getUser } from "$lib/auth.svelte";
import CreatePersonDialogue from "./CreatePersonDialogue.svelte";
import type { RateMode } from "./people-table/RateMode";
import PersonDrawer from "./person-drawer";

const user = $derived(getUser());
const canViewPersonalData = $derived(user?.canViewPersonalData ?? false);
const canEditPeople = $derived(user?.canEditPeople ?? false);

let basePeople = $state<Person[]>([]);
let ndaTemplateUrl = $state("");
let contractTemplateUrl = $state("");

function isActive(person: Person): boolean {
  return person.currentStatus !== "inactive";
}

const overrides = $state<Record<string, Person>>({});
const people = $derived(basePeople.map((p) => overrides[p.id] ?? p));

async function loadPeople() {
  try {
    basePeople = await api.people.$get();
  } catch {
    basePeople = [];
  }
}

onMount(async () => {
  const [people, config] = await Promise.all([
    api.people.$get().catch(() => [] as Person[]),
    api.documents.templates.$get().catch(() => null),
  ]);
  basePeople = people;
  if (config) {
    ndaTemplateUrl = config.ndaTemplateUrl;
    contractTemplateUrl = config.contractTemplateUrl;
  }
});

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
    schedule: string;
    hourlyRatePaid: number;
    hourlyRateAccrued: number;
    identification: {
      type: string;
      number: string;
      issueDate: string;
      issuingAuthority: string;
    };
  },
  roles: { id: string; name: string }[],
) {
  if (!selectedPersonId) return;
  const base = basePeople.find((p) => p.id === selectedPersonId);
  if (!base || !isPersonFull(base)) return;

  const scheduleHours = form.schedule.split(",").map((s) => Number(s.trim()) || 0);
  const hoursPerWeek = scheduleHours.reduce((a, b) => a + b, 0);
  const mondays = countMondaysThisMonth();
  const paidHourly = form.hourlyRatePaid;
  const accruedHourly = form.hourlyRateAccrued;

  overrides[selectedPersonId] = {
    ...base,
    name: form.name,
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    telegram: form.telegram,
    discord: form.discord,
    linkedin: form.linkedin,
    schedule: form.schedule,
    idType: (form.identification.type || null) as PersonFull["idType"],
    idNumber: form.identification.number || null,
    idIssueDate: form.identification.issueDate || null,
    idIssuingAuthority: form.identification.issuingAuthority || null,
    hoursPerWeek,
    paidHourly,
    accruedHourly,
    paidWeekly: paidHourly * hoursPerWeek,
    accruedWeekly: accruedHourly * hoursPerWeek,
    paidMonthly: paidHourly * hoursPerWeek * mondays,
    accruedMonthly: accruedHourly * hoursPerWeek * mondays,
    roles,
  };
}

function onPersonSaved(updated: PersonFull) {
  overrides[updated.id] = updated;
}

const activePeople = $derived(people.filter(isActive));
const inactivePeople = $derived(people.filter((p) => !isActive(p)));

let creatingPerson = $state(false);
let activeTab = $state<"active" | "inactive">("active");
let rateMode = $state<RateMode>("hourly");
const displayedPeople = $derived(activeTab === "active" ? activePeople : inactivePeople);

const personIdFromUrl = $derived(page.params.id);
// svelte-ignore state_referenced_locally
let selectedPersonId = $state<string | undefined>(undefined);

$effect(() => {
  if (personIdFromUrl) selectedPersonId = personIdFromUrl;
});

let focusName = $state(false);

const drawerPerson = $derived(
  selectedPersonId === undefined
    ? undefined
    : (people.find((p) => p.id === selectedPersonId && isPersonFull(p)) as PersonFull | undefined),
);

const drawerOpen = $derived(drawerPerson !== undefined);

async function openAddDrawer() {
  creatingPerson = true;
  try {
    const id = await api.people.$post({ name: "New Person" });
    await loadPeople();
    focusName = true;
    selectedPersonId = id;
    pushState(`/people/${id}`, {});
  } finally {
    creatingPerson = false;
  }
}

function openEditDrawer(person: PersonFull) {
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

async function onDataChanged() {
  await loadPeople();
}
</script>

<CreatePersonDialogue open={creatingPerson} />

<div class="mb-4 flex shrink-0 items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-foreground">
      {canViewPersonalData ? "HR — People" : "Team"}
    </h1>
    <p class="mt-1 text-sm text-muted-foreground">
      {canViewPersonalData ? "Full team directory with contact info and HR data." : "Active team members."}
    </p>
  </div>
  {#if canEditPeople}
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
      {canViewPersonalData ? "Inactive / Candidates" : "Inactive"} ({inactivePeople.length})
    </button>
  </div>
  {#if canViewPersonalData}
    <div class="flex rounded-md border border-border bg-muted/50 p-0.5">
      {#each ["hourly", "weekly", "monthly"] as mode}
        <button
          class={`rounded px-3 py-1 text-xs font-medium transition-colors ${rateMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onclick={() => (rateMode = mode as typeof rateMode)}
        >
          {mode === "hourly" ? "Hourly" : mode === "weekly" ? "Weekly" : "Monthly"}
        </button>
      {/each}
    </div>
  {/if}
</div>

<div class="mt-4 flex min-h-0 flex-1 gap-4">
  <div class="min-w-0 flex-1 rounded-lg border border-border bg-card h-fit">
    <PeopleTable people={displayedPeople} onEditPerson={canViewPersonalData ? openEditDrawer : undefined} {rateMode} />
  </div>
  {#if drawerOpen}
    <PersonDrawer
      person={drawerPerson ?? null}
      {canEditPeople}
      onClose={closeDrawer}
      onSaved={onPersonSaved}
      onFormChange={onPersonFormChange}
      {onDataChanged}
      {focusName}
      {ndaTemplateUrl}
      {contractTemplateUrl}
    />
  {/if}
</div>
