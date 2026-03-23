<script lang="ts">
import CopyButton from "$components/copy-button";
import * as Dialog from "$components/dialog";
import ExternalLink from "$components/external-link";
import * as Tooltip from "$components/tooltip";
import type { PersonFull } from "$lib/api";
import { api } from "$lib/api";

let {
  person,
  canEdit = false,
  canSign = false,
  missingSigningFields = [],
  ndaTemplateUrl,
  contractTemplateUrl,
  onDataChanged = async () => {},
  viewingDocUrl = $bindable<string | null>(null),
}: {
  person: PersonFull;
  canEdit?: boolean;
  canSign?: boolean;
  missingSigningFields?: string[];
  ndaTemplateUrl: string;
  contractTemplateUrl: string;
  onDataChanged?: () => Promise<void>;
  viewingDocUrl?: string | null;
} = $props();

type DocCategory = "nda" | "contract" | "other";

// ── Template-based instances (NDA / Contract) ─────────────────────────────

let cloning = $state<"nda" | "contract" | null>(null);
let cloneError = $state<Partial<Record<"nda" | "contract", string>>>({});

let signingInstanceId = $state<string | null>(null);
let signDialogOpen = $state(false);
let signUrls = $state<{ adminUrl: string; personUrl: string } | null>(null);
let signError = $state("");

async function cloneTemplate(templateType: "nda" | "contract") {
  cloning = templateType;
  cloneError = { ...cloneError, [templateType]: "" };
  try {
    await api.people(person.id).documentInstances.$post({ templateType });
    await onDataChanged();
  } catch (e) {
    cloneError = { ...cloneError, [templateType]: `Failed: ${(e as Error).message}` };
  } finally {
    cloning = null;
  }
}

async function deleteInstance(instanceId: string) {
  if (!confirm("Delete this document? This cannot be undone.")) return;
  try {
    await api.people(person.id).documentInstances(instanceId).$delete();
    await onDataChanged();
  } catch (e) {
    alert((e as Error).message ?? "Failed to delete document");
  }
}

async function signInstance(instanceId: string) {
  signingInstanceId = instanceId;
  signError = "";
  signUrls = null;
  signDialogOpen = true;
  try {
    const data = await api.people(person.id).documentInstances(instanceId).sign.$post();
    if (data?.adminUrl && data?.personUrl) signUrls = { adminUrl: data.adminUrl, personUrl: data.personUrl };
    await onDataChanged();
  } catch (e) {
    signError = `Signing failed: ${(e as Error).message}`;
  } finally {
    signingInstanceId = null;
  }
}

// ── Upload-based documents ────────────────────────────────────────────────

let uploading = $state<Record<string, boolean>>({});
let uploadError = $state<Record<string, string>>({});
let fileInputs = $state<Record<string, HTMLInputElement>>({});
let dragOver = $state<Record<string, boolean>>({});

function documentUrl(driveId: string): string {
  return `${api.$baseUrl}/documents/${driveId}`;
}

async function uploadFile(file: File, category: DocCategory, key: string) {
  uploading = { ...uploading, [key]: true };
  uploadError = { ...uploadError, [key]: "" };
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", file.name);
    fd.append("category", category);
    await api.people(person.id).documents.$post(fd);
    const input = fileInputs[key];
    if (input) input.value = "";
    await onDataChanged();
  } catch (e) {
    uploadError = { ...uploadError, [key]: `Upload failed: ${(e as Error).message}` };
  } finally {
    uploading = { ...uploading, [key]: false };
  }
}

async function deleteDocument(docId: string) {
  if (!confirm("Remove this document?")) return;
  try {
    await api.people(person.id).documents(docId).$delete();
    await onDataChanged();
  } catch (e) {
    alert((e as Error).message ?? "Failed to delete document");
  }
}

const templateCategories = $derived.by(() => [
  { key: "nda" as const, label: "NDA", templateUrl: ndaTemplateUrl },
  { key: "contract" as const, label: "Contract", templateUrl: contractTemplateUrl },
]);

const otherDocs = $derived(
  [...person.documents.filter((d) => d.category === "other")].sort((a, b) => b.id.localeCompare(a.id)),
);

function categoryDocs(category: DocCategory) {
  return [...person.documents.filter((d) => d.category === category)].sort((a, b) => b.id.localeCompare(a.id));
}
</script>

<section>
  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Documents</h3>
  <div class="space-y-5">
    <!-- NDA and Contract: template-based instances -->
    {#each templateCategories as { key, label, templateUrl } (key)}
      {@const instances = [...(person.documentInstances ?? []).filter((i) => i.templateType === key)].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )}
      <div>
        <div class="mb-1.5 flex items-center gap-2">
          <ExternalLink href={templateUrl} className="text-xs font-medium">{label}</ExternalLink>

          {#if canEdit}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <button
                      {...props}
                      type="button"
                      onclick={() => {
                        if (cloning !== key) cloneTemplate(key);
                      }}
                      disabled={cloning === key}
                      class="ml-auto rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/70 transition-colors disabled:opacity-50"
                    >
                      {cloning === key ? "Creating…" : "Create from template"}
                    </button>
                  {/snippet}
                </Tooltip.Trigger>
              </Tooltip.Root>
            </Tooltip.Provider>
          {/if}
        </div>

        {#if cloneError[key]}
          <p class="mb-1 text-xs text-destructive">{cloneError[key]}</p>
        {/if}

        <div class="space-y-2">
          {#each instances as instance (instance.id)}
            <div class="rounded-md border border-border bg-card px-3 py-2 space-y-1.5">
              <div class="flex items-center gap-2">
                <a
                  href={`https://docs.google.com/document/d/${instance.driveFileId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 text-sm font-medium text-primary hover:underline truncate"
                >
                  {instance.name}
                </a>

                {#if canEdit}
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        {#snippet child({ props })}
                          <button
                            {...props}
                            type="button"
                            onclick={() => {
                              if (signingInstanceId !== instance.id) signInstance(instance.id);
                            }}
                            disabled={signingInstanceId === instance.id}
                            class="rounded px-2 py-0.5 text-xs font-medium transition-colors {canSign
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'cursor-not-allowed bg-muted text-muted-foreground'}"
                          >
                            {signingInstanceId === instance.id ? "Sending…" : "Sign"}
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

                  <button
                    class="rounded p-1 text-muted-foreground hover:text-destructive"
                    onclick={() => deleteInstance(instance.id)}
                    aria-label="Delete document"
                  >
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                {/if}
              </div>

              {#if instance.signedDocs.length > 0}
                <div class="space-y-1 border-t border-border/50 pt-1.5">
                  {#each [...instance.signedDocs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as doc (doc.id)}
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Signed {new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span class="text-border">·</span>
                      <ExternalLink href={doc.adminUrl} className="text-xs">Admin link</ExternalLink>
                      <CopyButton value={doc.adminUrl} />
                      <ExternalLink href={doc.personUrl} className="text-xs">Person link</ExternalLink>
                      <CopyButton value={doc.personUrl} />
                    </div>
                  {/each}
                </div>
              {/if}

              {#if canEdit}
                <div
                  role="button"
                  tabindex="0"
                  class="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed px-3 py-2 text-center transition-colors {dragOver[instance.id]
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-ring/50 hover:bg-muted/30'}"
                  onclick={() => fileInputs[instance.id]?.click()}
                  onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") fileInputs[instance.id]?.click();
                  }}
                  ondragover={(e) => {
                    e.preventDefault();
                    dragOver = { ...dragOver, [instance.id]: true };
                  }}
                  ondragleave={() => {
                    dragOver = { ...dragOver, [instance.id]: false };
                  }}
                  ondrop={(e) => {
                    e.preventDefault();
                    dragOver = { ...dragOver, [instance.id]: false };
                    const file = e.dataTransfer?.files?.[0];
                    if (file) uploadFile(file, key, instance.id);
                  }}
                >
                  {#if uploading[instance.id]}
                    <svg class="size-3.5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span class="text-xs text-muted-foreground">Uploading…</span>
                  {:else}
                    <svg class="size-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <span class="text-xs text-muted-foreground"
                      >Drop or <span class="text-foreground underline underline-offset-2">browse</span></span
                    >
                  {/if}
                  {#if uploadError[instance.id]}
                    <p class="text-xs text-destructive">{uploadError[instance.id]}</p>
                  {/if}
                  <input
                    bind:this={fileInputs[instance.id]}
                    type="file"
                    accept="application/pdf,image/*"
                    class="hidden"
                    onchange={(e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) uploadFile(file, key, instance.id);
                    }}
                  />
                </div>
              {/if}
            </div>
          {/each}

          {#each categoryDocs(key) as doc (doc.id)}
            <div class="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
              <button
                class="flex-1 text-left text-sm font-medium text-primary hover:underline"
                onclick={() => (viewingDocUrl = documentUrl(doc.url))}
              >
                {doc.name}
              </button>
              <div class="flex items-center gap-1">
                <a
                  href={documentUrl(doc.url)}
                  download={doc.name}
                  class="rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Download"
                >
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>
                {#if canEdit}
                  <button
                    class="rounded p-1 text-muted-foreground hover:text-destructive"
                    onclick={() => deleteDocument(doc.id)}
                    aria-label="Delete document"
                  >
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Other: upload-based -->
    <div>
      <p class="mb-1.5 text-xs font-medium text-muted-foreground">Others</p>

      <div class="space-y-1">
        {#each otherDocs as doc (doc.id)}
          <div class="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
            <button
              class="flex-1 text-left text-sm font-medium text-primary hover:underline"
              onclick={() => (viewingDocUrl = documentUrl(doc.url))}
            >
              {doc.name}
            </button>
            <div class="flex items-center gap-1">
              <a
                href={documentUrl(doc.url)}
                download={doc.name}
                class="rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Download"
              >
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
              {#if canEdit}
                <button
                  class="rounded p-1 text-muted-foreground hover:text-destructive"
                  onclick={() => deleteDocument(doc.id)}
                  aria-label="Delete document"
                >
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
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
          class="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 text-center transition-colors {dragOver['other']
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-ring/50 hover:bg-muted/30'}"
          onclick={() => fileInputs['other']?.click()}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputs['other']?.click();
          }}
          ondragover={(e) => {
            e.preventDefault();
            dragOver = { ...dragOver, other: true };
          }}
          ondragleave={() => {
            dragOver = { ...dragOver, other: false };
          }}
          ondrop={(e) => {
            e.preventDefault();
            dragOver = { ...dragOver, other: false };
            const file = e.dataTransfer?.files?.[0];
            if (file) uploadFile(file, "other", "other");
          }}
        >
          {#if uploading['other']}
            <svg class="size-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-xs text-muted-foreground">Uploading…</span>
          {:else}
            <svg class="size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span class="text-xs text-muted-foreground"
              >Drop or <span class="text-foreground underline underline-offset-2">browse</span></span
            >
          {/if}
          {#if uploadError['other']}
            <p class="text-xs text-destructive">{uploadError['other']}</p>
          {/if}
          <input
            bind:this={fileInputs['other']}
            type="file"
            accept="application/pdf,image/*"
            class="hidden"
            onchange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) uploadFile(file, "other", "other");
            }}
          />
        </div>
      {/if}
    </div>
  </div>
</section>

<!-- Sign dialog -->
<Dialog.Root bind:open={signDialogOpen}>
  <Dialog.Content showCloseButton={signingInstanceId === null}>
    <Dialog.Header>
      <Dialog.Title>Signing Request</Dialog.Title>
    </Dialog.Header>

    {#if signingInstanceId}
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

    {#if signingInstanceId === null}
      <Dialog.Footer>
        <Dialog.Close class="rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >Close</Dialog.Close
        >
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
