<script lang="ts">
import { onMount, tick, untrack } from "svelte";
import { fly } from "svelte/transition";
import { apiFetch, apiJson } from "$lib/api";
import { Button } from "$components/button";
import PersonRoles from "$components/person-roles";
import type { Person } from "$lib/types";
import PersonDrawerContact from "./PersonDrawerContact.svelte";
import PersonDrawerHeader from "./PersonDrawerHeader.svelte";
import PersonDrawerLegal from "./PersonDrawerLegal.svelte";
import PersonDrawerStatus from "./PersonDrawerStatus.svelte";
import PersonDrawerWorkConditions from "./PersonDrawerWorkConditions.svelte";

const {
  person = null,
  canEditPeople = false,
  onClose = () => {},
  onSaved = (_person: Person) => {},
  onFormChange = (_form: ReturnType<typeof buildForm>, _roles: RoleOption[]) => {},
  onDataChanged = async () => {},
  focusName = false,
  ndaTemplateUrl,
  contractTemplateUrl,
}: {
  person?: Person | null;
  canEditPeople?: boolean;
  onClose?: () => void;
  onSaved?: (person: Person) => void;
  onFormChange?: (form: ReturnType<typeof buildForm>, roles: RoleOption[]) => void;
  onDataChanged?: () => Promise<void>;
  focusName?: boolean;
  ndaTemplateUrl: string;
  contractTemplateUrl: string;
} = $props();

const isAddMode = $derived(person === null);

interface RoleOption {
  notionId: string;
  name: string;
}

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

// svelte-ignore state_referenced_locally
let form = $state(buildForm(person));
// svelte-ignore state_referenced_locally
let roles = $state<RoleOption[]>(person?.roles.map((r) => ({ notionId: r.notionId, name: r.name })) ?? []);
let availableRoles = $state<RoleOption[]>([]);

onMount(async () => {
  try {
    const data = await apiJson<{ roles: RoleOption[] }>("/roles");
    availableRoles = data.roles;
  } catch (e) {
    console.error(`Failed to fetch roles: ${(e as Error).message}`);
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
    form = buildForm(person);
    roles = person?.roles.map((r) => ({ notionId: r.notionId, name: r.name })) ?? [];
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
  if (!isInitialized || !canEditPeople) return;
  if (!untrack(() => person)) return;
  const current = JSON.stringify({ form, roles });
  if (current !== savedSnapshot) {
    scheduleAutoSave();
    untrack(() => onFormChange(form, roles));
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
    const res = await apiFetch(`/people/${person.id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...form, roles }),
    });
    if (!res.ok) {
      autoSaveStatus = "error";
      return;
    }
    const { person: updatedPerson } = (await res.json()) as { person: Person };
    savedSnapshot = JSON.stringify({ form, roles });
    autoSaveStatus = "saved";
    onSaved(updatedPerson);
    setTimeout(() => {
      if (autoSaveStatus === "saved") autoSaveStatus = "idle";
    }, 2000);
  } catch (e) {
    console.error(`Auto-save failed: ${(e as Error).message}`);
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
    const res = await apiFetch(`/people/${person.id}/image`, { method: "POST", body: fd });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      console.error(`Avatar upload failed: ${body.message ?? "unknown"}`);
      return;
    }
    const { image } = (await res.json()) as { image: string };
    onSaved({ ...person, image });
  } catch (e) {
    console.error(`Avatar upload failed: ${(e as Error).message}`);
  } finally {
    avatarUploading = false;
  }
}

// ── Delete person ─────────────────────────────────────────────────────────

async function deletePerson() {
  if (!person || !confirm("Delete this person? This cannot be undone.")) return;
  const res = await apiFetch(`/people/${person.id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    alert(body.message ?? "Failed to delete");
    return;
  }
  await onDataChanged();
  onClose();
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
</script>

<!-- Drawer panel -->
<aside
  transition:fly={{ x: 480, duration: 280 }}
  class="flex w-120 shrink-0 -mr-4 flex-col rounded-l-lg border border-r-0 border-border bg-card sm:-mr-6 lg:-mr-8"
>
  <PersonDrawerHeader
    bind:form
    notionPersonPageId={person?.notionPersonPageId}
    {isAddMode}
    {canEditPeople}
    {currentImage}
    {avatarUploading}
    {focusName}
    onUpload={uploadAvatar}
    {onClose}
  />

  <!-- Scrollable content -->
  <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">

    <!-- Roles -->
    <section>
      <span class="mb-1 block text-xs font-medium text-muted-foreground">Roles</span>
      <PersonRoles bind:roles {availableRoles} readonly={!canEditPeople} />
    </section>

    <PersonDrawerContact bind:form {canEditPeople} />

    <PersonDrawerWorkConditions bind:form {canEditPeople} />

    {#if !isAddMode && person}
      <PersonDrawerStatus {person} {canEditPeople} {onDataChanged} />
      <PersonDrawerLegal bind:form {canEditPeople} {person} {canSign} {missingSigningFields} {ndaTemplateUrl} {contractTemplateUrl} {onDataChanged} />
    {/if}

    <div class="flex items-center justify-between">
      {#if canEditPeople}
      <Button variant="ghost" class="text-destructive hover:text-destructive" onclick={deletePerson}>
        Delete Person
      </Button>
      {/if}
    </div>
  </div>
</aside>
