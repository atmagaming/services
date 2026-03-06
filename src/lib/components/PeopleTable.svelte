<script lang="ts">
  import type { Person } from "$lib/types";
  import {
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  } from "$lib/components/ui/table/index.js";

  export let people: Person[] = [];
  export let onEditPerson: (person: Person) => void = () => {};

  const STATUS_LABELS: Record<string, string> = {
    working: "Working",
    vacation: "Vacation",
    sick_leave: "Sick Leave",
    inactive: "Inactive",
  };

  const STATUS_COLORS: Record<string, string> = {
    working: "bg-green-100 text-green-800",
    vacation: "bg-blue-100 text-blue-800",
    sick_leave: "bg-yellow-100 text-yellow-800",
    inactive: "bg-gray-100 text-gray-500",
  };

  function getLatestStatus(person: Person): string {
    const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
    return sorted.at(-1)?.status ?? "inactive";
  }
</script>

<table class="w-full caption-bottom text-sm">
  <TableHeader>
    <TableRow class="hover:bg-transparent">
      <TableHead class="sticky left-0 top-0 z-20 border-b border-border bg-card after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border after:content-['']">Person</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Roles</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Status</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Schedule</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Rate (Paid)</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Rate (Accrued)</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Email</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Telegram</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Discord</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">LinkedIn</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card">Notion</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each people as person (person.id)}
      {@const latestStatus = getLatestStatus(person)}
      <TableRow class="group cursor-pointer" onclick={() => onEditPerson(person)}>
        <TableCell class="sticky left-0 z-10 bg-card px-4 py-2 group-hover:!bg-card after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border after:content-['']">
          <div class="flex items-center gap-2">
            {#if person.image}
              <img
                src={person.image}
                alt={person.nickname || person.name}
                class="size-8 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
            {:else}
              <div class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(person.nickname || person.name)[0]?.toUpperCase() ?? "?"}
              </div>
            {/if}
            <div>
              <p class="text-sm font-medium text-foreground">{person.name}</p>
              {#if person.nickname}
                <p class="text-xs text-muted-foreground">{person.nickname}</p>
              {/if}
            </div>
          </div>
        </TableCell>
        <TableCell class="px-4 py-2">
          <div class="flex flex-wrap gap-1">
            {#each person.roles as role (role.notionId)}
              <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{role.name}</span>
            {/each}
          </div>
        </TableCell>
        <TableCell class="px-4 py-2">
          <span class={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[latestStatus] ?? "bg-gray-100 text-gray-500"}`}>
            {STATUS_LABELS[latestStatus] ?? latestStatus}
          </span>
        </TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.weeklySchedule}</TableCell>
        <TableCell class="px-4 py-2 text-sm">${person.hourlyRatePaid}/hr</TableCell>
        <TableCell class="px-4 py-2 text-sm">${person.hourlyRateAccrued}/hr</TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.email || "—"}</TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.telegramAccount || "—"}</TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.discord || "—"}</TableCell>
        <TableCell class="px-4 py-2">
          {#if person.linkedin}
            <a href={person.linkedin} target="_blank" rel="noopener noreferrer" class="text-xs text-primary hover:underline" onclick={(e) => e.stopPropagation()}>LinkedIn</a>
          {:else}
            <span class="text-sm text-muted-foreground">—</span>
          {/if}
        </TableCell>
        <TableCell class="px-4 py-2">
          {#if person.notionPersonPageId}
            <a
              href={`https://notion.so/${person.notionPersonPageId.replace(/-/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-primary hover:underline"
              onclick={(e) => e.stopPropagation()}
            >
              Notion
            </a>
          {:else}
            <span class="text-sm text-muted-foreground">—</span>
          {/if}
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</table>
