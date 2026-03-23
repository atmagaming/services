<script lang="ts">
const colorClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  gray: "bg-gray-100 text-gray-500",
  red: "bg-red-100 text-red-700",
};

const {
  text,
  color = "primary",
  onremove,
}: {
  text: string;
  color?: keyof typeof colorClasses;
  onremove?: () => void;
} = $props();

const classes = $derived(colorClasses[color] ?? colorClasses.primary);
</script>

<span class="flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {classes}">
  {text}
  {#if onremove}
    <button
      type="button"
      class="ml-0.5 hover:text-destructive"
      onclick={(e) => {
        e.stopPropagation();
        onremove();
      }}
      aria-label="Remove">×</button
    >
  {/if}
</span>
