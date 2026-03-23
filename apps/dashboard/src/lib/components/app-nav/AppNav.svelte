<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { Avatar, AvatarFallback, AvatarImage } from "$components/avatar";
import { Button } from "$components/button";
import type { SessionUser } from "$lib/api";
import { logout } from "$lib/auth.svelte";

const { user = null }: { user: SessionUser | null } = $props();

const links = [
  { href: "/finances", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/people", label: "People" },
];

const navLinks = $derived(user?.isSuperAdmin ? [...links, { href: "/admin", label: "Admin" }] : links);
const userInitial = $derived((user?.name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?");

async function signOut() {
  logout();
  await goto("/login");
}
</script>

<nav class="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
  <div class="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
    <a href="/finances" class="text-lg font-bold tracking-tight text-primary">Atma Dashboard</a>
    <div class="flex flex-1 gap-1">
      {#each navLinks as link}
        <a
          href={link.href}
          class={page.url.pathname === link.href
            ? "rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"}
        >
          {link.label}
        </a>
      {/each}
    </div>
    <div class="flex items-center gap-3">
      {#if user}
        <Avatar class="size-8">
          {#if user.image}
            <AvatarImage src={user.image} alt={user.name ?? ""} referrerpolicy="no-referrer" />
          {/if}
          <AvatarFallback class="bg-primary/10 text-primary text-xs font-semibold">{userInitial}</AvatarFallback>
        </Avatar>
        <span class="text-sm font-medium text-foreground">{user.name ?? user.email}</span>
        <Button variant="ghost" class="h-8 px-3 text-muted-foreground" onclick={signOut}>Sign out</Button>
      {:else}
        <Button href="/login">Sign in</Button>
      {/if}
    </div>
  </div>
</nav>
