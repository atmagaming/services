<script lang="ts">
import FolderOpen from "@lucide/svelte/icons/folder-open";
import FolderPlus from "@lucide/svelte/icons/folder-plus";
import PersonAvatar from "$components/PersonAvatar.svelte";

const NOTION_ICON = "/icons/notion.webp";

const {
  form = $bindable(),
  notionId = undefined,
  isAddMode = false,
  canEditPeople = false,
  currentImage = "",
  avatarUploading = false,
  focusName = false,
  driveFolderId = null,
  onUpload,
  onClose,
  onCreateFolder,
}: {
  form: { name: string; firstName: string };
  notionId?: string;
  isAddMode?: boolean;
  canEditPeople?: boolean;
  currentImage?: string;
  avatarUploading?: boolean;
  focusName?: boolean;
  driveFolderId?: string | null;
  onUpload?: (file: File) => void;
  onClose?: () => void;
  onCreateFolder?: () => void;
} = $props();
</script>

<div class="flex items-center gap-3 border-b border-border px-6 py-4">
  <PersonAvatar
    bind:name={form.name}
    image={currentImage}
    uploading={avatarUploading}
    autofocus={focusName}
    onUpload={!isAddMode && canEditPeople ? onUpload : undefined}
  />

  {#if notionId}
    <a
      href={`https://www.notion.so/${notionId.replace(/-/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Notion"
      class="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
    >
      <img src={NOTION_ICON} alt="Notion" class="size-4" />
    </a>
  {/if}

  {#if driveFolderId}
    <a
      href={`https://drive.google.com/drive/folders/${driveFolderId}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Open personal Drive folder"
      class="shrink-0 opacity-40 hover:opacity-100 transition-opacity text-muted-foreground"
    >
      <FolderOpen class="size-4" />
    </a>
  {:else if canEditPeople && !isAddMode}
    <button
      onclick={onCreateFolder}
      title="Create personal Drive folder"
      class="shrink-0 opacity-40 hover:opacity-100 transition-opacity text-muted-foreground"
    >
      <FolderPlus class="size-4" />
    </button>
  {/if}

  <button class="ml-auto shrink-0 rounded-md p-1 hover:bg-muted" onclick={onClose} aria-label="Close">
    <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>
