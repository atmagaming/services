<script lang="ts">
import AvatarUpload from "$components/avatar-upload";
import InlineEdit from "$components/inline-edit";

const NOTION_ICON = "/icons/notion.webp";

const {
  form = $bindable(),
  notionPersonPageId = undefined,
  isAddMode = false,
  canEditPeople = false,
  currentImage = "",
  avatarUploading = false,
  focusName = false,
  onUpload,
  onClose,
}: {
  form: { name: string; firstName: string };
  notionPersonPageId?: string;
  isAddMode?: boolean;
  canEditPeople?: boolean;
  currentImage?: string;
  avatarUploading?: boolean;
  focusName?: boolean;
  onUpload?: (file: File) => void;
  onClose?: () => void;
} = $props();
</script>

<div class="flex items-center gap-3 border-b border-border px-6 py-4">
  <AvatarUpload
    src={currentImage}
    initials={form.name || form.firstName}
    canEdit={!isAddMode && canEditPeople}
    uploading={avatarUploading}
    onUpload={onUpload ?? (() => {})}
  />

  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2">
      <InlineEdit bind:value={form.name} placeholder="Display name" className="text-lg font-semibold" autofocus={focusName} />
      {#if notionPersonPageId}
        <a
          href={`https://www.notion.so/${notionPersonPageId.replace(/-/g, "")}`}
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
