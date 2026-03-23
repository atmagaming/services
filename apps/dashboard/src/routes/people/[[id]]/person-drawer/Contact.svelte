<script lang="ts">
import { Mail } from "@lucide/svelte";
import EditableContactItem from "$components/editable-contact-item";
import Email from "../common/Email.svelte";

const TELEGRAM_ICON = "/icons/telegram.webp";
const DISCORD_ICON = "/icons/discord.webp";
const LINKEDIN_ICON = "/icons/linkedin.webp";

let {
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
      <Email bind:email={form.email} copyable editable={canEditPeople} />
    </div>
    <EditableContactItem
      icon={TELEGRAM_ICON}
      bind:value={form.telegram}
      href={telegramHref}
      placeholder="Add Telegram…"
      readonly={!canEditPeople}
      onRemove={canEditPeople ? () => (form.telegram = "") : null}
    />
    <EditableContactItem
      icon={DISCORD_ICON}
      bind:value={form.discord}
      href={null}
      placeholder="Add Discord…"
      readonly={!canEditPeople}
      onRemove={canEditPeople ? () => (form.discord = "") : null}
    />
    <EditableContactItem
      icon={LINKEDIN_ICON}
      bind:value={form.linkedin}
      href={form.linkedin || null}
      placeholder="Add LinkedIn…"
      readonly={!canEditPeople}
      onRemove={canEditPeople ? () => (form.linkedin = "") : null}
    />
  </div>
</section>
