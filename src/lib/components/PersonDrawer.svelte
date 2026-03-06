<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { fly } from "svelte/transition";
  import { onMount } from "svelte";
  import type { Person } from "$lib/types";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as Command from "$lib/components/ui/command/index.js";

  export let person: Person | null = null; // null = add mode
  export let canEditPeople = false;
  export let onClose: () => void = () => {};

  $: isAddMode = person === null;

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

  function getLatestStatus(p: Person): string {
    const sorted = p.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
    return sorted.at(-1)?.status ?? "inactive";
  }

  // Form state
  $: form = {
    name: person?.name ?? "",
    firstName: person?.firstName ?? "",
    lastName: person?.lastName ?? "",
    nickname: person?.nickname ?? "",
    image: person?.image ?? "",
    email: person?.email ?? "",
    telegramAccount: person?.telegramAccount ?? "",
    discord: person?.discord ?? "",
    linkedin: person?.linkedin ?? "",
    weeklySchedule: person?.weeklySchedule ?? "4,4,4,4,4,0,0",
    hourlyRatePaid: person?.hourlyRatePaid ?? 0,
    hourlyRateAccrued: person?.hourlyRateAccrued ?? 0,
    notionPersonPageId: person?.notionPersonPageId ?? "",
    passportNumber: person?.passportNumber ?? "",
    passportIssueDate: person?.passportIssueDate ?? "",
    passportIssuingAuthority: person?.passportIssuingAuthority ?? "",
  };

  interface RoleOption { notionId: string; name: string; }

  $: roles = person?.roles.map((r) => ({ notionId: r.notionId, name: r.name })) ?? [];
  let availableRoles: RoleOption[] = [];
  let rolePopoverOpen = false;

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

  function toggleRole(role: RoleOption) {
    const index = roles.findIndex((r) => r.notionId === role.notionId);
    if (index >= 0) roles.splice(index, 1);
    else roles.push(role);
  }

  function isRoleSelected(notionId: string) {
    return roles.some((r) => r.notionId === notionId);
  }

  let saving = false;
  let saveError = "";

  async function save() {
    if (!form.name.trim()) { saveError = "Name is required"; return; }
    saving = true;
    saveError = "";
    try {
      const url = isAddMode ? "/api/people" : `/api/people/${person!.id}`;
      const method = isAddMode ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, roles }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        saveError = body.message ?? "Failed to save";
        return;
      }
      await invalidateAll();
      onClose();
    } catch (e) {
      saveError = "Failed to save: " + (e as Error).message;
    } finally {
      saving = false;
    }
  }

  async function deletePerson() {
    if (!person || !confirm("Delete this person? This cannot be undone.")) return;
    const res = await fetch(`/api/people/${person.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      alert(body.message ?? "Failed to delete");
      return;
    }
    await invalidateAll();
    onClose();
  }

  // Status form
  let showStatusForm = false;
  let statusForm = {
    status: "working",
    date: new Date().toISOString().slice(0, 10),
  };

  async function addStatus() {
    if (!person) return;
    const res = await fetch(`/api/people/${person.id}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(statusForm),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      alert(body.message ?? "Failed to update status");
      return;
    }
    showStatusForm = false;
    await invalidateAll();
  }

  // Documents
  let uploading = false;
  let uploadError = "";
  let fileInput: HTMLInputElement;
  let docName = "";

  // PDF viewer overlay
  let viewingDocUrl: string | null = null;

  async function uploadDocument() {
    if (!person || !fileInput?.files?.length) return;
    uploading = true;
    uploadError = "";
    try {
      const file = fileInput.files[0];
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", docName.trim() || file.name);
      const res = await fetch(`/api/people/${person.id}/documents`, { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        uploadError = body.message ?? "Upload failed";
        return;
      }
      docName = "";
      fileInput.value = "";
      await invalidateAll();
    } catch (e) {
      uploadError = "Upload failed: " + (e as Error).message;
    } finally {
      uploading = false;
    }
  }

  async function deleteDocument(docId: string) {
    if (!person || !confirm("Remove this document?")) return;
    const res = await fetch(`/api/people/${person.id}/documents/${docId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      alert(body.message ?? "Failed to delete document");
      return;
    }
    await invalidateAll();
  }
</script>

<!-- Drawer panel -->
<aside
  transition:fly={{ x: 480, duration: 280 }}
  class="flex w-[480px] shrink-0 -mr-4 flex-col rounded-l-lg border border-r-0 border-border bg-card sm:-mr-6 lg:-mr-8"
>
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-border px-6 py-4">
    <h2 class="text-lg font-semibold">{isAddMode ? "Add Person" : "Edit Person"}</h2>
    <button
      class="rounded-md p-1 hover:bg-muted"
      onclick={onClose}
      aria-label="Close"
    >
      <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Scrollable content -->
  <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">

    <!-- Identity -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identity</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-muted-foreground">First Name</span>
            <Input bind:value={form.firstName} placeholder="Jane" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-muted-foreground">Last Name</span>
            <Input bind:value={form.lastName} placeholder="Smith" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Display Name *</span>
          <Input bind:value={form.name} placeholder="Jane Smith" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Nickname</span>
          <Input bind:value={form.nickname} placeholder="jsmith" />
        </label>
        <div>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-muted-foreground">Image URL</span>
            <Input bind:value={form.image} placeholder="https://…" />
          </label>
          {#if form.image}
            <img src={form.image} alt="preview" class="mt-2 size-12 rounded-full object-cover" referrerpolicy="no-referrer" />
          {/if}
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
      <div class="space-y-3">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
          <Input bind:value={form.email} type="email" placeholder="jane@example.com" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Telegram</span>
          <Input bind:value={form.telegramAccount} placeholder="@username" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Discord</span>
          <Input bind:value={form.discord} placeholder="username#0000" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">LinkedIn</span>
          <Input bind:value={form.linkedin} placeholder="https://linkedin.com/in/…" />
        </label>
      </div>
    </section>

    <!-- Roles -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Roles</h3>
      <div class="space-y-2">
        <div class="flex flex-wrap gap-1">
          {#each roles as role (role.notionId)}
            <span class="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {role.name}
              {#if canEditPeople}
                <button
                  class="ml-0.5 hover:text-destructive"
                  onclick={() => toggleRole(role)}
                  aria-label="Remove role"
                >×</button>
              {/if}
            </span>
          {/each}
          {#if roles.length === 0}
            <span class="text-sm text-muted-foreground">No roles assigned.</span>
          {/if}
        </div>
        {#if canEditPeople}
          <Popover.Root bind:open={rolePopoverOpen}>
            <Popover.Trigger>
              <Button size="sm" variant="outline">+ Add role</Button>
            </Popover.Trigger>
            <Popover.Content class="w-64 p-0" align="start">
              <Command.Root>
                <Command.Input placeholder="Search roles…" />
                <Command.List>
                  <Command.Empty>No roles found.</Command.Empty>
                  <Command.Group>
                    {#each availableRoles as role (role.notionId)}
                      <Command.Item
                        value={role.name}
                        onSelect={() => toggleRole(role)}
                        class="flex items-center gap-2"
                      >
                        <span class="size-4 flex items-center justify-center text-primary">
                          {#if isRoleSelected(role.notionId)}✓{/if}
                        </span>
                        {role.name}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
        {/if}
      </div>
    </section>

    <!-- Work -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Work</h3>
      <div class="space-y-3">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Weekly Schedule (comma-separated hours)</span>
          <Input bind:value={form.weeklySchedule} placeholder="4,4,4,4,4,0,0" />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-muted-foreground">Hourly Rate Paid ($/hr)</span>
            <Input bind:value={form.hourlyRatePaid} type="number" min="0" step="0.01" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-muted-foreground">Hourly Rate Accrued ($/hr)</span>
            <Input bind:value={form.hourlyRateAccrued} type="number" min="0" step="0.01" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Notion Person Page ID</span>
          <Input bind:value={form.notionPersonPageId} placeholder="xxxxxxxx-…" />
        </label>
      </div>
    </section>

    <!-- ID Document -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">ID Document</h3>
      <div class="space-y-3">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Passport Number</span>
          <Input bind:value={form.passportNumber} placeholder="AB1234567" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Issue Date</span>
          <Input bind:value={form.passportIssueDate} type="date" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">Issuing Authority</span>
          <Input bind:value={form.passportIssuingAuthority} placeholder="Ministry of Interior" />
        </label>
      </div>
    </section>

    <!-- Status (edit mode only) -->
    {#if !isAddMode && person}
      {@const latestStatus = getLatestStatus(person)}
      <section>
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[latestStatus] ?? "bg-gray-100 text-gray-500"}`}>
              {STATUS_LABELS[latestStatus] ?? latestStatus}
            </span>
            {#if canEditPeople}
              <Button size="sm" variant="outline" onclick={() => (showStatusForm = !showStatusForm)}>
                Change Status
              </Button>
            {/if}
          </div>
          {#if showStatusForm && canEditPeople}
            <div class="flex items-end gap-3 rounded-md border border-border bg-muted/30 p-3">
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-muted-foreground">New Status</span>
                <select
                  bind:value={statusForm.status}
                  class="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                >
                  <option value="working">Working</option>
                  <option value="inactive">Inactive</option>
                  <option value="vacation">Vacation</option>
                  <option value="sick_leave">Sick Leave</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-muted-foreground">Date</span>
                <Input type="date" bind:value={statusForm.date} class="w-40" />
              </label>
              <Button size="sm" onclick={addStatus}>Save</Button>
              <Button size="sm" variant="ghost" onclick={() => (showStatusForm = false)}>Cancel</Button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- Documents (edit mode only) -->
    {#if !isAddMode && person}
      <section>
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Documents</h3>
        <div class="space-y-2">
          {#each person.documents as doc (doc.id)}
            <div class="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
              <button
                class="flex-1 text-left text-sm font-medium text-primary hover:underline"
                onclick={() => (viewingDocUrl = `/api/documents/${doc.url}`)}
              >
                {doc.name}
              </button>
              <div class="flex items-center gap-1">
                <a
                  href={`/api/documents/${doc.url}`}
                  download={doc.name}
                  class="rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Download"
                >
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                {#if canEditPeople}
                  <button
                    class="rounded p-1 text-muted-foreground hover:text-destructive"
                    onclick={() => deleteDocument(doc.id)}
                    aria-label="Delete document"
                  >
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                {/if}
              </div>
            </div>
          {/each}

          {#if person.documents.length === 0}
            <p class="text-sm text-muted-foreground">No documents attached.</p>
          {/if}

          {#if canEditPeople}
            <div class="mt-3 space-y-2 rounded-md border border-dashed border-border p-3">
              <p class="text-xs font-medium text-muted-foreground">Upload Document</p>
              <label class="block">
                <span class="mb-1 block text-xs text-muted-foreground">Display Name (optional)</span>
                <Input bind:value={docName} placeholder="Passport scan" class="text-sm" />
              </label>
              <input
                bind:this={fileInput}
                type="file"
                accept="application/pdf,image/*"
                class="text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:text-primary-foreground hover:file:bg-primary/90"
              />
              {#if uploadError}
                <p class="text-xs text-destructive">{uploadError}</p>
              {/if}
              <Button size="sm" onclick={uploadDocument} disabled={uploading}>
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

  </div>

  <!-- Footer -->
  <div class="border-t border-border px-6 py-4">
    {#if saveError}
      <p class="mb-2 text-sm text-destructive">{saveError}</p>
    {/if}
    <div class="flex items-center justify-between">
      <div>
        {#if canEditPeople && !isAddMode}
          <Button variant="ghost" class="text-destructive hover:text-destructive" onclick={deletePerson}>
            Delete Person
          </Button>
        {/if}
      </div>
      <div class="flex gap-3">
        <Button variant="ghost" onclick={onClose}>Cancel</Button>
        {#if canEditPeople}
          <Button onclick={save} disabled={saving}>
            {saving ? "Saving…" : isAddMode ? "Add Person" : "Save Changes"}
          </Button>
        {/if}
      </div>
    </div>
  </div>
</aside>

<!-- PDF Viewer Overlay -->
{#if viewingDocUrl}
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div class="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-background shadow-2xl">
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <span class="text-sm font-medium">Document Preview</span>
        <button
          class="rounded p-1 hover:bg-muted"
          onclick={() => (viewingDocUrl = null)}
          aria-label="Close preview"
        >
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <iframe src={viewingDocUrl} class="flex-1 rounded-b-lg" title="Document Preview"></iframe>
    </div>
  </div>
{/if}
