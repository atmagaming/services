<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";
  import DatePicker from "$lib/components/DatePicker.svelte";

  export let statusChange: { id: string; date: string; status: string };
  export let onUpdate: (field: "status" | "date", value: string) => void;
  export let onDelete: () => void;

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

  // Local state so Select always reflects the correct value immediately
  let localStatus = statusChange.status;
  $: localStatus = statusChange.status;

  function handleStatusChange(value: string) {
    localStatus = value;
    onUpdate("status", value);
  }
</script>

<div class="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40">
  <DatePicker value={statusChange.date} onchange={(v) => onUpdate("date", v)} />
  <Select.Root type="single" value={localStatus} onValueChange={handleStatusChange}>
    <Select.Trigger size="sm" class="flex-1 border-none shadow-none focus-visible:ring-0">
      <span class={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[localStatus] ?? "bg-gray-100 text-gray-500"}`}>
        {STATUS_LABELS[localStatus] ?? localStatus}
      </span>
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="working">Working</Select.Item>
      <Select.Item value="vacation">Vacation</Select.Item>
      <Select.Item value="sick_leave">Sick Leave</Select.Item>
      <Select.Item value="inactive">Inactive</Select.Item>
    </Select.Content>
  </Select.Root>
  <button
    type="button"
    onclick={onDelete}
    class="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
    aria-label="Delete status"
  >
    <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>
