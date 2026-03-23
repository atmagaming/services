<script lang="ts">
let {
    value = $bindable(),
    label,
    readonly = false,
}: {
    value: number;
    label: string;
    readonly?: boolean;
} = $props();

let display = $state(value.toFixed(2));
let focused = $state(false);

$effect(() => {
    if (!focused) display = (Number(value) || 0).toFixed(2);
});
</script>

<div class="flex w-19 flex-col items-center gap-1">
    <div class="flex h-9 w-19 items-center justify-center rounded-md border border-border bg-background shadow-xs">
        <input
            value={display}
            type="text"
            inputmode="decimal"
            {readonly}
            onfocus={(e) => { focused = true; (e.target as HTMLInputElement).select(); }}
            oninput={(e) => {
                const el = e.target as HTMLInputElement;
                el.value = el.value.replace(/[^0-9.]/g, "").replace(/(\..*?)\..+/g, "$1");
                display = el.value;
                value = parseFloat(el.value) || 0;
            }}
            onblur={(e) => {
                focused = false;
                const el = e.target as HTMLInputElement;
                const v = parseFloat(el.value);
                value = isNaN(v) ? 0 : v;
                display = value.toFixed(2);
                el.value = display;
            }}
            class="w-full bg-transparent px-2 text-center text-sm font-medium focus:outline-none"
        />
    </div>
    <span class="text-xs text-muted-foreground">{label}</span>
</div>
