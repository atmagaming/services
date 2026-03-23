<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { Button } from "$components/button";
import { Card, CardContent, CardHeader, CardTitle } from "$components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$components/table";
import { api } from "$lib/api";
import { getUser } from "$lib/auth.svelte";

type UserRecord = Awaited<ReturnType<typeof api.admin.$get>>[number];

let users = $state<UserRecord[]>([]);
let loading = $state(false);
let error = $state("");

async function loadData() {
  const user = getUser();
  if (!user?.isSuperAdmin) {
    await goto("/finances", { replaceState: true });
    return;
  }
  users = await api.admin.$get();
}

onMount(loadData);

const PERMISSIONS = [
  { key: "canViewTransactions", label: "Transactions" },
  { key: "canViewRevenueShares", label: "Revenue Shares" },
  { key: "canViewPersonalData", label: "Personal Data" },
  { key: "canEditPeople", label: "Edit People" },
] as const;

async function togglePermission(email: string, permission: string, value: boolean) {
  loading = true;
  error = "";
  try {
    await api.admin.$post({ email, permission, value });
    await loadData();
  } catch (e) {
    error = (e as Error).message ?? "Failed to update permission";
  } finally {
    loading = false;
  }
}

async function removeAllPermissions(userEmail: string) {
  loading = true;
  error = "";
  try {
    await api.admin.$delete({ email: userEmail });
    await loadData();
  } catch (e) {
    error = (e as Error).message ?? "Failed to remove permissions";
  } finally {
    loading = false;
  }
}
</script>

{#if users.length > 0}
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Admin Management</h1>
      <p class="mt-1 text-sm text-muted-foreground">Manage dashboard access and permissions per user.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Users & Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow class="border-b border-border hover:bg-transparent">
                <TableHead>User</TableHead>
                {#each PERMISSIONS as perm}
                  <TableHead class="text-center text-xs">{perm.label}</TableHead>
                {/each}
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each users as user (user.id)}
                <TableRow>
                  <TableCell class="px-4 py-2">
                    <div class="text-sm font-medium text-foreground">
                      {user.name ?? user.email}
                    </div>
                    {#if user.name}
                      <div class="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    {/if}
                  </TableCell>
                  {#each PERMISSIONS as perm}
                    <TableCell class="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={user[perm.key]}
                        disabled={loading}
                        onchange={(e) => togglePermission(user.email, perm.key, (e.target as HTMLInputElement).checked)}
                        class="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </TableCell>
                  {/each}
                  <TableCell class="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      class="text-destructive hover:text-destructive"
                      onclick={() => removeAllPermissions(user.email)}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </div>

        {#if error}
          <p class="mt-3 text-sm text-destructive">{error}</p>
        {/if}
      </CardContent>
    </Card>
  </div>
{/if}
