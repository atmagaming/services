<script lang="ts">
import { Mail } from "@lucide/svelte";
import CopyButton from "$components/copy-button";
import EditableContactItem from "$components/editable-contact-item";
import InlineEdit from "$components/inline-edit";

const TELEGRAM_ICON = "/icons/telegram.webp";
const DISCORD_ICON = "/icons/discord.webp";
const LINKEDIN_ICON = "/icons/linkedin.webp";

const {
  form = $bindable(),
  canEditPeople = false,
}: {
  form: { email: string; telegram: string; discord: string; linkedin: string };
  canEditPeople?: boolean;
} = $props();

const telegramHref = $derived(form.telegram ? `https://t.me/${form.telegram.replace(/^@/, "")}` : null);
</script>

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
