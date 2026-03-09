<script lang="ts">
import DollarSign from "@lucide/svelte/icons/dollar-sign";
import CopyButton from "$components/copy-button";
import Sensitive from "$components/sensitive";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$components/table";
import type { Person } from "$lib/types";

const {
  people = [],
  canViewPersonalData = false,
  onEditPerson,
}: {
  people: Person[];
  canViewPersonalData?: boolean;
  onEditPerson?: (person: Person) => void;
} = $props();

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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getLatestStatus(person: Person): string {
  const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
  return sorted.at(-1)?.status ?? "inactive";
}

const maxPaidRate = $derived(Math.max(0, ...people.map((p) => p.hourlyRate.paid)));
const maxAccruedRate = $derived(Math.max(0, ...people.map((p) => p.hourlyRate.accrued)));
const maxScheduleHours = $derived(Math.max(0, ...people.flatMap((p) => p.weeklySchedule.split(",").map(Number))));

function heatStyle(value: number, max: number, hue: number): string {
  if (max === 0 || value === 0) return "background:hsl(0,0%,92%);color:hsl(0,0%,58%)";
  const ratio = value / max;
  const light = Math.round(92 - ratio * 28);
  const textLight = light < 76 ? 24 : 40;
  return `background:hsl(${hue},90%,${light}%);color:hsl(${hue},80%,${textLight}%)`;
}
</script>

<Table>
  <TableHeader>
    <TableRow class="hover:bg-transparent">
      <TableHead class="sticky left-0 top-0 z-20 border-b border-border bg-card text-center after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border after:content-['']">Person</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card text-center">Roles</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card text-center">Status</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card text-center">Schedule</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card text-center">Rate (Paid)</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card text-center">Rate (Accrued)</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card text-center">Email</TableHead>
      <TableHead class="sticky top-0 z-10 border-b border-border bg-card text-center">Links</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each people as person (person.id)}
      {@const latestStatus = getLatestStatus(person)}
      <TableRow
        class={onEditPerson ? "group cursor-pointer" : ""}
        onclick={onEditPerson ? () => onEditPerson(person) : undefined}
      >
        <TableCell class="sticky left-0 z-10 bg-card px-4 py-2 group-hover:bg-card! after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border after:content-['']">
          <div class="flex items-center gap-2">
            {#if person.image}
              <img src={person.image} alt={person.name} class="size-8 rounded-full object-cover" referrerpolicy="no-referrer" />
            {:else}
              <div class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {person.name[0]?.toUpperCase() ?? "?"}
              </div>
            {/if}
            <p class="text-sm font-medium text-foreground">{person.name}</p>
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
        <TableCell class="px-4 py-2">
          <Sensitive visible={canViewPersonalData}>
            <div class="flex gap-0.5">
              {#each person.weeklySchedule.split(",").map(Number) as hours, i}
                <div
                  title="{hours} hour{hours === 1 ? '' : 's'} on {DAYS[i]}"
                  class="flex size-6 items-center justify-center rounded text-xs font-medium"
                  style={heatStyle(hours, maxScheduleHours, 230)}
                >
                  {hours}
                </div>
              {/each}
            </div>
          </Sensitive>
        </TableCell>
        <TableCell class="px-4 py-2">
          <Sensitive visible={canViewPersonalData}>
            <div class="flex items-center justify-center">
              <div class="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-xs" style={heatStyle(person.hourlyRate.paid, maxPaidRate, 30)}>
                <DollarSign class="size-3 shrink-0" />
                {person.hourlyRate.paid.toFixed(2)}
              </div>
            </div>
          </Sensitive>
        </TableCell>
        <TableCell class="px-4 py-2">
          <Sensitive visible={canViewPersonalData}>
            <div class="flex items-center justify-center">
              <div class="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-xs" style={heatStyle(person.hourlyRate.accrued, maxAccruedRate, 45)}>
                <DollarSign class="size-3 shrink-0" />
                {person.hourlyRate.accrued.toFixed(2)}
              </div>
            </div>
          </Sensitive>
        </TableCell>
        <TableCell class="px-4 py-2">
          <Sensitive visible={canViewPersonalData}>
            {#if person.email}
              <div class="flex items-center gap-1">
                <a href="mailto:{person.email}" class="text-sm text-muted-foreground hover:text-foreground hover:underline" onclick={(e) => e.stopPropagation()}>{person.email}</a>
                <CopyButton value={person.email} size={3} />
              </div>
            {/if}
          </Sensitive>
        </TableCell>
        <TableCell class="px-4 py-2">
          <Sensitive visible={canViewPersonalData}>
            {@const links = [
              person.notionPersonPageId ? { href: `https://notion.so/${person.notionPersonPageId.replace(/-/g, "")}`, icon: "/icons/notion.webp", label: "Notion" } : null,
              person.telegram ? { href: `https://t.me/${person.telegram.replace(/^@/, "")}`, icon: "/icons/telegram.webp", label: "Telegram" } : null,
              person.discord ? { href: null, icon: "/icons/discord.webp", label: `Discord: ${person.discord}` } : null,
              person.linkedin ? { href: person.linkedin, icon: "/icons/linkedin.webp", label: "LinkedIn" } : null,
            ].filter((l) => l !== null)}
            <div class="flex flex-wrap justify-center gap-1" style="width: 52px">
              {#each links as link}
                {#if link.href}
                  <a href={link.href} target="_blank" rel="noopener noreferrer" title={link.label} onclick={(e) => e.stopPropagation()}>
                    <img src={link.icon} alt={link.label} class="size-5 rounded opacity-70 transition-opacity hover:opacity-100" />
                  </a>
                {:else}
                  <span title={link.label}>
                    <img src={link.icon} alt={link.label} class="size-5 rounded opacity-70" />
                  </span>
                {/if}
              {/each}
            </div>
          </Sensitive>
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
