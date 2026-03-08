<script lang="ts">
import { Mail } from "@lucide/svelte";
import { onMount, tick } from "svelte";
import { fly } from "svelte/transition";
import { invalidateAll } from "$app/navigation";
import AvatarUpload from "$lib/components/AvatarUpload.svelte";
import CopyButton from "$lib/components/CopyButton.svelte";
import DatePicker from "$lib/components/DatePicker.svelte";
import EditableContactItem from "$lib/components/EditableContactItem.svelte";
import InlineEdit from "$lib/components/InlineEdit.svelte";
import PersonDocuments from "$lib/components/PersonDocuments.svelte";
import PersonRoles from "$lib/components/PersonRoles.svelte";
import StatusChangeRow from "$lib/components/StatusChangeRow.svelte";
import { Button } from "$lib/components/ui/button/index.js";
import * as Select from "$lib/components/ui/select/index.js";
import WeeklySchedule from "$lib/components/WeeklySchedule.svelte";
import type { Person } from "$lib/types";
import "$lib/date-extensions";

const NOTION_ICON = "/icons/notion.webp";
const DISCORD_ICON = "/icons/discord.webp";
const TELEGRAM_ICON = "/icons/telegram.webp";
const LINKEDIN_ICON = "/icons/linkedin.webp";

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

const {
  person = null,
  canEditPeople = false,
  onClose = () => {},
  focusName = false,
}: {
  person?: Person | null;
  canEditPeople?: boolean;
  onClose?: () => void;
  focusName?: boolean;
} = $props();

const isAddMode = $derived(person === null);

function buildForm(p: Person | null) {
  return {
    name: p?.name ?? "",
    firstName: p?.firstName ?? "",
    lastName: p?.lastName ?? "",
    email: p?.email ?? "",
    telegram: p?.telegram ?? "",
    discord: p?.discord ?? "",
    linkedin: p?.linkedin ?? "",
    weeklySchedule: p?.weeklySchedule ?? "4,4,4,4,4,0,0",
    hourlyRatePaid: p?.hourlyRate.paid ?? 0,
    hourlyRateAccrued: p?.hourlyRate.accrued ?? 0,
    identification: {
      type: p?.identification.type ?? "",
      number: p?.identification.number ?? "",
      issueDate: p?.identification.issueDate ?? "",
      issuingAuthority: p?.identification.issuingAuthority ?? "",
    },
  };
}

interface RoleOption {
  notionId: string;
  name: string;
}

// svelte-ignore state_referenced_locally
let form = $state(buildForm(person));
// svelte-ignore state_referenced_locally
let roles = $state<RoleOption[]>(person?.roles.map((r) => ({ notionId: r.notionId, name: r.name })) ?? []);
let availableRoles = $state<RoleOption[]>([]);

// Reset form and roles when person changes
$effect(() => {
  form = buildForm(person);
  roles = person?.roles.map((r) => ({ notionId: r.notionId, name: r.name })) ?? [];
});

onMount(async () => {
  try {
    const res = await fetch("/api/roles");
    if (res.ok) {
      const data = (await res.json()) as { roles: RoleOption[] };
      availableRoles = data.roles;
    }
  } catch (e) {
    console.error("Failed to fetch roles: " + (e as Error).message);
  }
});

// ── Auto-save (edit mode only) ────────────────────────────────────────────

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let autoSaveStatus = $state<"idle" | "saving" | "saved" | "error">("idle");
let savedSnapshot = $state("");
let isInitialized = $state(false);
let currentPersonId = $state<string | undefined>(undefined);

$effect(() => {
  if (person?.id !== currentPersonId) {
    currentPersonId = person?.id;
    isInitialized = false;
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    if (canEditPeople) {
      tick().then(() => {
        savedSnapshot = JSON.stringify({ form, roles });
        isInitialized = true;
      });
    }
  }
});

$effect(() => {
  if (isInitialized && canEditPeople && person) {
    const current = JSON.stringify({ form, roles });
    if (current !== savedSnapshot) scheduleAutoSave();
  }
});

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(doAutoSave, 1000);
}

async function doAutoSave() {
  if (!person) return;
  autoSaveTimer = null;
  autoSaveStatus = "saving";
  try {
    const res = await fetch(`/api/people/${person.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, roles }),
    });
    if (!res.ok) {
      autoSaveStatus = "error";
      return;
    }
    savedSnapshot = JSON.stringify({ form, roles });
    autoSaveStatus = "saved";
    setTimeout(() => {
      if (autoSaveStatus === "saved") autoSaveStatus = "idle";
    }, 2000);
  } catch (e) {
    console.error("Auto-save failed: " + (e as Error).message);
    autoSaveStatus = "error";
  }
}

// ── Avatar upload ─────────────────────────────────────────────────────────

let avatarUploading = $state(false);
const currentImage = $derived(person?.image ?? "");

async function uploadAvatar(file: File) {
  if (!person) return;
  avatarUploading = true;
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/people/${person.id}/image`, { method: "POST", body: fd });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      console.error("Avatar upload failed: " + (body.message ?? "unknown"));
      return;
    }
    await invalidateAll();
  } catch (e) {
    console.error("Avatar upload failed: " + (e as Error).message);
  } finally {
    avatarUploading = false;
  }
}

const telegramHref = $derived(form.telegram ? `https://t.me/${form.telegram.replace(/^@/, "")}` : null);

// ── Delete person ─────────────────────────────────────────────────────────

async function deletePerson() {
  if (!person || !confirm("Delete this person? This cannot be undone.")) return;
  const res = await fetch(`/api/people/${person.id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    alert(body.message ?? "Failed to delete");
    return;
  }
  await invalidateAll();
  onClose();
}

// ── Status changes ────────────────────────────────────────────────────────

async function addStatus() {
  if (!person) return;
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
  if (!person) return;
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
  if (!person) return;
  const res = await fetch(`/api/people/${person.id}/status/${statusId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    alert(body.message ?? "Failed to delete status");
    return;
  }
  await invalidateAll();
}

// ── Payment calculations ─────────────────────────────────────────────────

const weeklyHours = $derived(form.weeklySchedule.split(",").reduce((sum, v) => sum + (parseInt(v) || 0), 0));
const hourlyTotal = $derived(+form.hourlyRatePaid + +form.hourlyRateAccrued);

function fmtHourly(n: number) {
  return n.toFixed(2);
}

// ── Signing ───────────────────────────────────────────────────────────────

const missingSigningFields = $derived(
  [
    !form.name.trim() && "Display name",
    !form.firstName.trim() && "First name",
    !form.lastName.trim() && "Last name",
    !form.email.trim() && "Email",
    !form.identification.number.trim() && "ID number",
    !form.identification.issueDate.trim() && "ID issue date",
    !form.identification.issuingAuthority.trim() && "Issuing authority",
  ].filter(Boolean) as string[],
);

const canSign = $derived(missingSigningFields.length === 0);

// ── PDF viewer ────────────────────────────────────────────────────────────

let viewingDocUrl = $state<string | null>(null);
</script>

<!-- Drawer panel -->
<aside
  transition:fly={{ x: 480, duration: 280 }}
  class="flex w-120 shrink-0 -mr-4 flex-col rounded-l-lg border border-r-0 border-border bg-card sm:-mr-6 lg:-mr-8"
>
  <!-- Header -->
  <div class="flex items-center gap-3 border-b border-border px-6 py-4">
    <AvatarUpload
      src={currentImage}
      initials={form.name || form.firstName}
      canEdit={!isAddMode && canEditPeople}
      uploading={avatarUploading}
      onUpload={uploadAvatar}
    />

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <InlineEdit bind:value={form.name} placeholder="Display name" className="text-lg font-semibold" autofocus={focusName} />
        {#if person?.notionPersonPageId}
          <a
            href={`https://www.notion.so/${person.notionPersonPageId.replace(/-/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Notion"
            class="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          >
            <img src={NOTION_ICON} alt="Notion" class="size-4" />
          </a>
        {/if}
      </div>
    </div>

    <button class="shrink-0 rounded-md p-1 hover:bg-muted" onclick={onClose} aria-label="Close">
      <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Scrollable content -->
  <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">

    <!-- Roles -->
    <section>
      <span class="mb-1 block text-xs font-medium text-muted-foreground">Roles</span>
      <PersonRoles bind:roles {availableRoles} readonly={!canEditPeople} />
    </section>

    <!-- Contact -->
    <section>
      <div class="-mx-2">
        <div class="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40">
          <Mail class="size-4 shrink-0 text-muted-foreground" />
          {#if canEditPeople}
            <InlineEdit bind:value={form.email} placeholder="Add email…" className="flex-1 truncate text-sm" />
          {:else if form.email}
            <span class="flex-1 truncate text-sm">{form.email}</span>
          {:else}
            <span class="flex-1 text-sm text-muted-foreground">—</span>
          {/if}
          {#if form.email}
            <CopyButton value={form.email} size={3} />
          {/if}
        </div>
        <EditableContactItem icon={TELEGRAM_ICON} value={form.telegram} href={telegramHref} placeholder="Add Telegram…" readonly={!canEditPeople} onSave={(v) => (form.telegram = v)} onRemove={canEditPeople ? () => (form.telegram = "") : null} />
        <EditableContactItem icon={DISCORD_ICON} value={form.discord} href={null} placeholder="Add Discord…" readonly={!canEditPeople} onSave={(v) => (form.discord = v)} onRemove={canEditPeople ? () => (form.discord = "") : null} />
        <EditableContactItem icon={LINKEDIN_ICON} value={form.linkedin} href={form.linkedin || null} placeholder="Add LinkedIn…" readonly={!canEditPeople} onSave={(v) => (form.linkedin = v)} onRemove={canEditPeople ? () => (form.linkedin = "") : null} />
      </div>
    </section>

    <!-- WORK CONDITIONS -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Work Conditions</h3>

      <span class="mb-1 block text-xs font-medium text-muted-foreground">Schedule (hours)</span>
      <WeeklySchedule bind:value={form.weeklySchedule} readonly={!canEditPeople} />

      <!-- Payment table -->
      <div class="mt-4 space-y-2">
        <span class="mb-2 block text-xs font-medium text-muted-foreground">Hourly Rate (USD)</span>
        <div class="flex items-center gap-2">
          <div class="flex w-19 flex-col items-center gap-1">
            <div class="flex h-9 w-19 items-center justify-center rounded-md border border-border bg-background shadow-xs">
              <input
                bind:value={form.hourlyRatePaid}
                type="text" inputmode="decimal"
                readonly={!canEditPeople}
                oninput={(e) => { const el = e.target as HTMLInputElement; el.value = el.value.replace(/[^0-9.]/g, "").replace(/(\..*?)\.+/g, "$1"); form.hourlyRatePaid = el.value as unknown as number; }}
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
                oninput={(e) => { const el = e.target as HTMLInputElement; el.value = el.value.replace(/[^0-9.]/g, "").replace(/(\..*?)\.+/g, "$1"); form.hourlyRateAccrued = el.value as unknown as number; }}
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

    <!-- STATUS (edit mode only) -->
    {#if !isAddMode && person}
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
    {/if}

    <!-- LEGAL (edit mode only) -->
    {#if !isAddMode && person}
      <section>
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Legal</h3>

        <!-- First / Last name inline -->
        <div class="mb-4 flex items-center gap-2 text-sm">
          <InlineEdit bind:value={form.firstName} placeholder="First name" className="rounded-md border border-border/50 px-2 py-1 hover:bg-muted/50" />
          <InlineEdit bind:value={form.lastName} placeholder="Last name" className="rounded-md border border-border/50 px-2 py-1 hover:bg-muted/50" />
        </div>

        <!-- Identification -->
        {#if canEditPeople}
          <div class="flex flex-wrap items-center gap-1.5 text-sm">
            <Select.Root type="single" value={form.identification.type || undefined} onValueChange={(v) => (form.identification.type = v as typeof form.identification.type)}>
              <Select.Trigger
                class="h-auto w-auto border border-border/50 px-2 py-0.5 text-sm shadow-none hover:bg-muted/50 focus-visible:ring-1 [&>svg]:hidden"
              >
                {#if form.identification.type === "passport"}Passport
                {:else if form.identification.type === "national_id"}National ID
                {:else if form.identification.type === "drivers_license"}Driver's License
                {:else if form.identification.type === "residence_permit"}Residence Permit
                {:else}<span class="text-muted-foreground/60">ID type</span>
                {/if}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="passport">Passport</Select.Item>
                <Select.Item value="national_id">National ID Card</Select.Item>
                <Select.Item value="drivers_license">Driver's License</Select.Item>
                <Select.Item value="residence_permit">Residence Permit</Select.Item>
              </Select.Content>
            </Select.Root>
            <InlineEdit bind:value={form.identification.number} placeholder="AB1234567" className="min-w-20 rounded-md border border-border/50 px-2 py-1 text-sm hover:bg-muted/50" />
            <span class="text-muted-foreground">issued by</span>
            <InlineEdit bind:value={form.identification.issuingAuthority} placeholder="Authority" className="min-w-24 rounded-md border border-border/50 px-2 py-1 text-sm hover:bg-muted/50" />
            <span class="text-muted-foreground">on</span>
            <DatePicker value={form.identification.issueDate} placeholder="date…" onchange={(v) => (form.identification.issueDate = v)} buttonClass="!w-auto border border-border/50" />
          </div>
        {:else}
          <p class="text-sm leading-relaxed">
            {#if form.identification.type === "passport"}Passport
            {:else if form.identification.type === "national_id"}National ID
            {:else if form.identification.type === "drivers_license"}Driver's License
            {:else if form.identification.type === "residence_permit"}Residence Permit
            {:else}—{/if}
            {#if form.identification.number}&nbsp;{form.identification.number}{/if}
            {#if form.identification.issuingAuthority}&nbsp;<span class="text-muted-foreground">issued by</span> {form.identification.issuingAuthority}{/if}
            {#if form.identification.issueDate}&nbsp;<span class="text-muted-foreground">on</span> {Date.fromIso(form.identification.issueDate).toShort()}{/if}
          </p>
        {/if}

        <!-- Documents -->
        <div class="mt-5">
          <PersonDocuments {person} canEdit={canEditPeople} {canSign} {missingSigningFields} bind:viewingDocUrl />
        </div>
      </section>

    {/if}

  </div>

  <!-- Footer -->
  <div class="border-t border-border px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        {#if canEditPeople}
          <Button variant="ghost" class="text-destructive hover:text-destructive" onclick={deletePerson}>
            Delete Person
          </Button>
        {/if}
      </div>
      <div class="flex items-center gap-3">
        {#if canEditPeople}
          <span class="text-xs text-muted-foreground">
            {#if autoSaveStatus === "saving"}Saving…
            {:else if autoSaveStatus === "saved"}Saved ✓
            {:else if autoSaveStatus === "error"}<span class="text-destructive">Save failed</span>
            {/if}
          </span>
        {/if}
        <Button variant="ghost" onclick={onClose}>Close</Button>
      </div>
    </div>
  </div>
</aside>

<!-- PDF Viewer Overlay -->
{#if viewingDocUrl}
  <div class="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
    <div class="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-background shadow-2xl">
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <span class="text-sm font-medium">Document Preview</span>
        <button class="rounded p-1 hover:bg-muted" onclick={() => (viewingDocUrl = null)} aria-label="Close preview">
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <iframe src={viewingDocUrl} class="flex-1 rounded-b-lg" title="Document Preview"></iframe>
    </div>
  </div>
{/if}
