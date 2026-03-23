<script lang="ts">
import DatePicker from "$components/date-picker";
import InlineEdit from "$components/inline-edit";
import PersonDocuments from "$components/person-documents";
import * as Select from "$components/select";
import type { PersonFull } from "$lib/api";
import "$lib/date-extensions";

const {
  form = $bindable(),
  canEditPeople = false,
  person,
  canSign = false,
  missingSigningFields = [],
  ndaTemplateUrl,
  contractTemplateUrl,
  onDataChanged = async () => {},
}: {
  form: {
    firstName: string;
    lastName: string;
    identification: { type: string; number: string; issueDate: string; issuingAuthority: string };
  };
  canEditPeople?: boolean;
  person: PersonFull;
  canSign?: boolean;
  missingSigningFields?: string[];
  ndaTemplateUrl: string;
  contractTemplateUrl: string;
  onDataChanged?: () => Promise<void>;
} = $props();

let viewingDocUrl = $state<string | null>(null);
</script>

<section>
  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Legal</h3>

  <div class="mb-4 flex items-center gap-2 text-sm">
    <InlineEdit
      bind:value={form.firstName}
      placeholder="First name"
      className="rounded-md border border-border/50 px-2 py-1 hover:bg-muted/50"
    />
    <InlineEdit
      bind:value={form.lastName}
      placeholder="Last name"
      className="rounded-md border border-border/50 px-2 py-1 hover:bg-muted/50"
    />
  </div>

  {#if canEditPeople}
    <div class="flex flex-wrap items-center gap-1.5 text-sm">
      <Select.Root
        type="single"
        value={form.identification.type || undefined}
        onValueChange={(v) => (form.identification.type = v as typeof form.identification.type)}
      >
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
      <InlineEdit
        bind:value={form.identification.number}
        placeholder="AB1234567"
        className="min-w-20 rounded-md border border-border/50 px-2 py-1 text-sm hover:bg-muted/50"
      />
      <span class="text-muted-foreground">issued by</span>
      <InlineEdit
        bind:value={form.identification.issuingAuthority}
        placeholder="Authority"
        className="min-w-24 rounded-md border border-border/50 px-2 py-1 text-sm hover:bg-muted/50"
      />
      <span class="text-muted-foreground">on</span>
      <DatePicker bind:value={form.identification.issueDate} placeholder="date…" class="w-36" />
    </div>
  {:else}
    <p class="text-sm leading-relaxed">
      {#if form.identification.type === "passport"}Passport
      {:else if form.identification.type === "national_id"}National ID
      {:else if form.identification.type === "drivers_license"}Driver's License
      {:else if form.identification.type === "residence_permit"}Residence Permit
      {:else}—{/if}
      {#if form.identification.number}&nbsp;{form.identification.number}{/if}
      {#if form.identification.issuingAuthority}&nbsp;<span class="text-muted-foreground">issued by</span>
        {form.identification.issuingAuthority}{/if}
      {#if form.identification.issueDate}&nbsp;<span class="text-muted-foreground">on</span>
        {Date.fromIso(form.identification.issueDate).toShort()}{/if}
    </p>
  {/if}

  <div class="mt-5">
    <PersonDocuments
      {person}
      canEdit={canEditPeople}
      {canSign}
      {missingSigningFields}
      {ndaTemplateUrl}
      {contractTemplateUrl}
      {onDataChanged}
      bind:viewingDocUrl
    />
  </div>
</section>

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
