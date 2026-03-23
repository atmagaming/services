<script lang="ts">
import { onMount, tick, untrack } from "svelte";
import { fly } from "svelte/transition";
import { Button } from "$components/button";
import PersonRoles from "$components/person-roles";
import type { PersonFull } from "$lib/api";
import { api } from "$lib/api";
import PersonDrawerContact from "./Contact.svelte";
import PersonDrawerHeader from "./Header.svelte";
import PersonDrawerLegal from "./Legal.svelte";
import PersonDrawerStatus from "./Status.svelte";
import PersonDrawerWorkConditions from "./WorkConditions.svelte";

const {
  person = null,
  canEditPeople = false,
  onClose = () => {},
  onSaved = (_person: PersonFull) => {},
  onFormChange = (_form: ReturnType<typeof buildForm>, _roles: RoleOption[]) => {},
  onDataChanged = async () => {},
  focusName = false,
  ndaTemplateUrl,
  contractTemplateUrl,
}: {
  person?: PersonFull | null;
  canEditPeople?: boolean;
  onClose?: () => void;
  onSaved?: (person: PersonFull) => void;
  onFormChange?: (form: ReturnType<typeof buildForm>, roles: RoleOption[]) => void;
  onDataChanged?: () => Promise<void>;
  focusName?: boolean;
  ndaTemplateUrl: string;
  contractTemplateUrl: string;
} = $props();

const isAddMode = $derived(person === null);

interface RoleOption {
  id: string;
  name: string;
}

function buildForm(p: PersonFull | null) {
  return {
    name: p?.name ?? "",
    firstName: p?.firstName ?? "",
    lastName: p?.lastName ?? "",
    email: p?.email ?? "",
    telegram: p?.telegram ?? "",
    discord: p?.discord ?? "",
    linkedin: p?.linkedin ?? "",
    schedule: p?.schedule ?? "4,4,4,4,4,0,0",
    hourlyRatePaid: p?.paidHourly ?? 0,
    hourlyRateAccrued: p?.accruedHourly ?? 0,
    identification: {
      type: p?.idType ?? "",
      number: p?.idNumber ?? "",
      issueDate: p?.idIssueDate ?? "",
      issuingAuthority: p?.idIssuingAuthority ?? "",
    },
  };
}

let form = $state(buildForm(null));
let roles = $state<RoleOption[]>([]);
let availableRoles = $state<RoleOption[]>([]);

onMount(async () => {
  try {
    availableRoles = await api.roles.$get();
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
    roles = person?.roles.map((r) => ({ id: r.id, name: r.name })) ?? [];
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
    const { hourlyRatePaid, hourlyRateAccrued, ...rest } = form;
    await api.people(person.id).$patch({ ...rest, paidHourly: hourlyRatePaid, accruedHourly: hourlyRateAccrued, roles });
    savedSnapshot = JSON.stringify({ form, roles });
    autoSaveStatus = "saved";
    setTimeout(() => {
      if (autoSaveStatus === "saved") autoSaveStatus = "idle";
    }, 2000);
  } catch (e) {
    console.error(`Auto-save failed: ${(e as Error).message}`);
    autoSaveStatus = "error";
  }
}

// ── Drive folder ──────────────────────────────────────────────────────────

async function createFolder() {
  if (!person) return;
  try {
    await api.people(person.id).folder.$post();
    await onDataChanged();
  } catch (e) {
    console.error(`Failed to create Drive folder: ${(e as Error).message}`);
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
    await api.people(person.id).image.$post(fd);
    await onDataChanged();
  } catch (e) {
    console.error(`Avatar upload failed: ${(e as Error).message}`);
  } finally {
    avatarUploading = false;
  }
}

// ── Delete person ─────────────────────────────────────────────────────────

async function deletePerson() {
  if (!person || !confirm("Delete this person? This cannot be undone.")) return;
  try {
    await api.people(person.id).$delete();
  } catch (e) {
    alert((e as Error).message ?? "Failed to delete");
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
    notionId={person?.id}
    {isAddMode}
    {canEditPeople}
    {currentImage}
    {avatarUploading}
    {focusName}
    driveFolderId={person?.driveFolderId}
    onUpload={uploadAvatar}
    {onClose}
    onCreateFolder={createFolder}
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
      <PersonDrawerLegal
        bind:form
        {canEditPeople}
        {person}
        {canSign}
        {missingSigningFields}
        {ndaTemplateUrl}
        {contractTemplateUrl}
        {onDataChanged}
      />
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
