<script lang="ts">
import { invalidateAll } from "$app/navigation";
import { PUBLIC_CONTRACT_TEMPLATE_URL, PUBLIC_NDA_TEMPLATE_URL } from "$env/static/public";
import CopyButton from "$lib/components/CopyButton.svelte";
import ExternalLink from "$lib/components/ExternalLink.svelte";
import * as Dialog from "$lib/components/ui/dialog/index.js";
import * as Tooltip from "$lib/components/ui/tooltip/index.js";
import type { Person } from "$lib/types";

let {
  person,
  canEdit = false,
  canSign = false,
  missingSigningFields = [],
  viewingDocUrl = $bindable<string | null>(null),
}: {
  person: Person;
  canEdit?: boolean;
  canSign?: boolean;
  missingSigningFields?: string[];
  viewingDocUrl?: string | null;
} = $props();

type DocCategory = "nda" | "contract" | "other";
const CATEGORIES: { key: DocCategory; label: string; templateUrl?: string }[] = [
  { key: "nda", label: "NDA", templateUrl: PUBLIC_NDA_TEMPLATE_URL },
  { key: "contract", label: "Contract", templateUrl: PUBLIC_CONTRACT_TEMPLATE_URL },
  { key: "other", label: "Others" },
];

let uploading = $state<DocCategory | null>(null);
let uploadErrors = $state<Partial<Record<DocCategory, string>>>({});
let fileInputs = $state<Partial<Record<DocCategory, HTMLInputElement>>>({});
let dragOver = $state<DocCategory | null>(null);
let signing = $state<DocCategory | null>(null);
let signError = $state("");
let signDialogOpen = $state(false);
let signDialogCategory = $state<"nda" | "contract" | null>(null);
let signUrls = $state<{ adminUrl: string; personUrl: string } | null>(null);

async function uploadFile(file: File, category: DocCategory) {
  uploading = category;
  uploadErrors = { ...uploadErrors, [category]: "" };
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", file.name);
    fd.append("category", category);
    const res = await fetch(`/api/people/${person.id}/documents`, { method: "POST", body: fd });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      uploadErrors = { ...uploadErrors, [category]: body.message ?? "Upload failed" };
      return;
    }
    const input = fileInputs[category];
    if (input) input.value = "";
    await invalidateAll();
  } catch (e) {
    uploadErrors = { ...uploadErrors, [category]: "Upload failed: " + (e as Error).message };
  } finally {
    uploading = null;
  }
}

async function deleteDocument(docId: string) {
  if (!confirm("Remove this document?")) return;
  const res = await fetch(`/api/people/${person.id}/documents/${docId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    alert(body.message ?? "Failed to delete document");
    return;
  }
  await invalidateAll();
}

async function signDocument(category: "nda" | "contract") {
  const existing = person.documents.filter((d) => d.category === category);
  if (existing.length > 0 && !confirm(`A ${category.toUpperCase()} already exists. Add a new version anyway?`)) return;
  signing = category;
  signError = "";
  signUrls = null;
  signDialogCategory = category;
  signDialogOpen = true;
  try {
    const res = await fetch(`/api/people/${person.id}/sign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category }),
    });
    const data = (await res.json()) as { adminUrl?: string; personUrl?: string; message?: string };
    if (!res.ok) {
      signError = data.message ?? "Signing failed";
      return;
    }
    if (data.adminUrl && data.personUrl) signUrls = { adminUrl: data.adminUrl, personUrl: data.personUrl };
  } catch (e) {
    signError = "Signing failed: " + (e as Error).message;
  } finally {
    signing = null;
  }
}
</script>

<section>
  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Documents</h3>
  <div class="space-y-4">
    {#each CATEGORIES as { key, label, templateUrl } (key)}
      {@const categoryDocs = [...person.documents.filter((d) => d.category === key)].sort((a, b) => b.id.localeCompare(a.id))}
      <div>
        <div class="mb-1.5 flex items-center gap-2">
          {#if templateUrl}
            <ExternalLink href={templateUrl} className="text-xs font-medium">{label}</ExternalLink>
          {:else}
            <p class="text-xs font-medium text-muted-foreground">{label}</p>
          {/if}
          {#if templateUrl && canEdit}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <button
                      {...props}
                      type="button"
                      onclick={() => { if (canSign && signing !== key) signDocument(key as "nda" | "contract"); }}
                      disabled={signing === key}
                      class="ml-auto rounded px-2 py-0.5 text-xs font-medium transition-colors {canSign ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'cursor-not-allowed bg-muted text-muted-foreground'}"
                    >
                      {signing === key ? "Sending…" : "Sign"}
                    </button>
                  {/snippet}
                </Tooltip.Trigger>
                {#if !canSign}
                  <Tooltip.Content side="left" class="max-w-48">
                    <p class="mb-1 font-medium">Missing required fields:</p>
                    {#each missingSigningFields as field}
                      <p class="text-muted-foreground">· {field}</p>
                    {/each}
                  </Tooltip.Content>
                {/if}
              </Tooltip.Root>
            </Tooltip.Provider>
          {/if}
        </div>

        <div class="space-y-1">
          {#each categoryDocs as doc (doc.id)}
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
                {#if canEdit}
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
        </div>

        {#if canEdit}
          <div
            role="button"
            tabindex="0"
            class="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 text-center transition-colors {dragOver === key ? 'border-primary bg-primary/5' : 'border-border hover:border-ring/50 hover:bg-muted/30'}"
            onclick={() => fileInputs[key]?.click()}
            onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputs[key]?.click(); }}
            ondragover={(e) => { e.preventDefault(); dragOver = key; }}
            ondragleave={() => { dragOver = null; }}
            ondrop={(e) => { e.preventDefault(); dragOver = null; const file = e.dataTransfer?.files?.[0]; if (file) uploadFile(file, key); }}
          >
            {#if uploading === key}
              <svg class="size-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-xs text-muted-foreground">Uploading…</span>
            {:else}
              <svg class="size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span class="text-xs text-muted-foreground">Drop or <span class="text-foreground underline underline-offset-2">browse</span></span>
            {/if}
            {#if uploadErrors[key]}
              <p class="text-xs text-destructive">{uploadErrors[key]}</p>
            {/if}
            <input
              bind:this={fileInputs[key]}
              type="file"
              accept="application/pdf,image/*"
              class="hidden"
              onchange={(e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) uploadFile(file, key); }}
            />
          </div>
        {/if}
      </div>
    {/each}

  </div>
</section>

<Dialog.Root bind:open={signDialogOpen}>
  <Dialog.Content showCloseButton={!signing}>
    <Dialog.Header>
      <Dialog.Title>
        {signDialogCategory?.toUpperCase()} Signing Request
      </Dialog.Title>
    </Dialog.Header>

    {#if signing}
      <div class="flex items-center gap-3 py-4">
        <svg class="size-5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-sm text-muted-foreground">Sending signing request…</span>
      </div>
    {:else if signError}
      <p class="py-2 text-sm text-destructive">{signError}</p>
    {:else if signUrls}
      <div class="space-y-2 py-2">
        <p class="text-sm text-muted-foreground">The signing request was sent.</p>
        <div class="flex items-center gap-2">
          <ExternalLink href={signUrls.adminUrl} className="flex-1 text-sm">Link for me</ExternalLink>
          <CopyButton value={signUrls.adminUrl} />
        </div>
        <div class="flex items-center gap-2">
          <ExternalLink href={signUrls.personUrl} className="flex-1 text-sm">Link for them</ExternalLink>
          <CopyButton value={signUrls.personUrl} />
        </div>
      </div>
    {/if}

    {#if !signing}
      <Dialog.Footer>
        <Dialog.Close class="rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">Close</Dialog.Close>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
