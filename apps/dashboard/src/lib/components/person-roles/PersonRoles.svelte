<script lang="ts">
import { Chip } from "$components/chip";
import * as Command from "$components/command";
import * as Popover from "$components/popover";

interface RoleOption {
  id: string;
  name: string;
}

let {
  roles = $bindable<RoleOption[]>([]),
  availableRoles = [],
  readonly = false,
}: {
  roles?: RoleOption[];
  availableRoles?: RoleOption[];
  readonly?: boolean;
} = $props();

let open = $state(false);

function toggle(role: RoleOption) {
  const index = roles.findIndex((r) => r.id === role.id);
  if (index >= 0) roles = roles.filter((_, i) => i !== index);
  else roles = [...roles, role];
}
</script>

{#if readonly}
  <div class="flex flex-wrap gap-1.5">
    {#each roles as role (role.id)}
      <Chip text={role.name} />
    {/each}
    {#if roles.length === 0}
      <span class="text-sm text-muted-foreground">No roles assigned.</span>
    {/if}
  </div>
{:else}
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <div
          {...props}
          class="flex min-h-[38px] w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-left hover:border-ring/50"
        >
          {#each roles as role (role.id)}
            <Chip text={role.name} onremove={() => toggle(role)} />
          {/each}
          {#if roles.length === 0}
            <span class="text-sm text-muted-foreground">Add roles…</span>
          {/if}
        </div>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-64 p-0" align="start">
      <Command.Root>
        <Command.Input placeholder="Search roles…" />
        <Command.List>
          <Command.Empty>No roles found.</Command.Empty>
          <Command.Group>
            {#each availableRoles as role (role.id)}
              <Command.Item value={role.name} onSelect={() => toggle(role)} class="flex items-center gap-2">
                <span class="size-4 flex items-center justify-center text-primary">
                  {#if roles.some((r) => r.id === role.id)}✓{/if}
                </span>
                {role.name}
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.List>
      </Command.Root>
    </Popover.Content>
  </Popover.Root>
{/if}
