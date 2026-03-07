<script lang="ts">
  import { pushState, replaceState } from "$app/navigation";
  import type { Person } from "$lib/types";
  import PeopleGrid from "$lib/components/PeopleGrid.svelte";
  import PeopleTable from "$lib/components/PeopleTable.svelte";
  import PersonDrawer from "$lib/components/PersonDrawer.svelte";
  import { Button } from "$lib/components/ui/button/index.js";

  export let data: {
    people: Person[];
    canViewPersonalData: boolean;
    canEditPeople: boolean;
    personId?: string;
  };

  const ACTIVE_STATUSES = new Set(["working", "vacation", "sick_leave"]);

  function isActive(person: Person): boolean {
    const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
    const latest = sorted.at(-1);
    return latest !== undefined && ACTIVE_STATUSES.has(latest.status);
  }

  $: activePeople = data.people.filter(isActive);
  $: inactivePeople = data.people.filter((p) => !isActive(p));

  let activeTab: "active" | "inactive" = "active";
  $: displayedPeople = activeTab === "active" ? activePeople : inactivePeople;

  // Track by ID so drawerPerson auto-updates when data.people refreshes
  let selectedPersonId: string | null | undefined =
    data.personId !== undefined ? data.personId : undefined;

  $: drawerPerson =
    selectedPersonId === undefined ? undefined :
    selectedPersonId === null ? null :
    data.people.find((p) => p.id === selectedPersonId);

  $: drawerOpen = drawerPerson !== undefined;

  function openAddDrawer() {
    selectedPersonId = null;
    pushState("/people/new", {});
  }

  function openEditDrawer(person: Person) {
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

<!-- Page header -->
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

{#if data.canViewPersonalData}
  <!-- Tabs -->
  <div class="flex shrink-0 gap-2 border-b border-border">
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
      Inactive / Candidates ({inactivePeople.length})
    </button>
  </div>

  <div class="mt-4 flex min-h-0 flex-1 gap-4">
    <div class="min-w-0 flex-1 overflow-auto rounded-lg border border-border bg-card">
      <PeopleTable people={displayedPeople} onEditPerson={openEditDrawer} />
    </div>
    {#if drawerOpen}
      <PersonDrawer
        person={drawerPerson ?? null}
        canEditPeople={data.canEditPeople}
        onClose={closeDrawer}
      />
    {/if}
  </div>
{:else}
  <PeopleGrid people={activePeople} />
{/if}
