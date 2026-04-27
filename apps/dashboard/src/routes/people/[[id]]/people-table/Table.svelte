<script lang="ts">
  import { Chip } from "$components/chip";
  import Avatar from "$components/Avatar.svelte";
  import Schedule from "$components/Schedule.svelte";
  import { Table, TableBody, TableCell, TableHeader, TableRow } from "$components/table";
  import { isPersonFull, type Person, type PersonFull } from "$lib/api";
  import Email from "../common/Email.svelte";
  import RateCell from "../common/Rate.svelte";
  import Status from "../common/Status.svelte";
  import Cells from "./Cells.svelte";
  import TableHead from "./Head.svelte";
  import Links from "./Links.svelte";
  import { type RateMode } from "./RateMode";

  const {
    people,
    onEditPerson,
    rateMode,
  }: {
    people: Person[];
    onEditPerson?: (person: PersonFull) => void;
    rateMode: RateMode;
  } = $props();

  const maxPaidRate = $derived(
    Math.max(0, ...people.map((p) => (isPersonFull(p) ? (p[`paid${rateMode}` as keyof PersonFull] as number) : 0))),
  );

  const maxAccruedRate = $derived(
    Math.max(0, ...people.map((p) => (isPersonFull(p) ? (p[`accrued${rateMode}` as keyof PersonFull] as number) : 0))),
  );

  const maxScheduleHours = $derived(Math.max(0, ...people.map((p) => (isPersonFull(p) ? p.hoursPerWeek : 0))));

  const headers = [
    { label: "Person", sticky: true },
    { label: "Roles" },
    { label: "Status" },
    { label: "Schedule" },
    { label: "Paid", tooltip: "Paid - direct compensation to the person" },
    { label: "Accrued", tooltip: "Accrued - value invested into the project" },
    { label: "Email" },
    { label: "Links" },
  ];
</script>

{#snippet schedule(person: PersonFull)}<Schedule value={person.schedule} maxSchedule={maxScheduleHours} />{/snippet}
{#snippet paid(person: PersonFull)}<RateCell {person} method="Paid" duration={rateMode} max={maxPaidRate} />{/snippet}
{#snippet accrued(person: PersonFull)}
  <RateCell {person} method="Accrued" duration={rateMode} max={maxAccruedRate} />
{/snippet}
{#snippet email(person: PersonFull)}<Email email={person.email ?? ""} copyable />{/snippet}
{#snippet links(person: PersonFull)}<Links {person} />{/snippet}

<Table>
  <!-- Header -->
  <TableHeader>
    <TableRow class="hover:bg-transparent">
      {#each headers as header}
        <TableHead {...header} />
      {/each}
    </TableRow>
  </TableHeader>

  <!-- Body -->
  <TableBody>
    {#each people as person (person.id)}
      {@const isFull = isPersonFull(person)}
      <TableRow
        class={isFull && onEditPerson ? "group cursor-pointer" : ""}
        onclick={isFull && onEditPerson ? () => onEditPerson(person) : undefined}
      >
        <TableCell
          class="sticky left-0 z-10 bg-card px-4 py-2 group-hover:bg-card! after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border after:content-['']"
        >
          <div class="flex items-center gap-2">
            <Avatar name={person.name} src={person.image ?? undefined} />
            <p class="text-sm font-medium text-foreground">{person.name}</p>
          </div>
        </TableCell>

        <TableCell class="px-4 py-2">
          <div class="flex flex-wrap gap-1">
            {#each person.roles as role (role.id)}
              <Chip text={role.name} />
            {/each}
          </div>
        </TableCell>

        <TableCell class="px-4 py-2">
          <Status status={person.currentStatus} />
        </TableCell>

        <Cells {person} cells={[schedule, paid, accrued, email, links]} />
      </TableRow>
    {/each}
  </TableBody>
</Table>
