<script lang="ts">
import "../app.css";
import type { Snippet } from "svelte";
import { page } from "$app/state";
import AppNav from "$components/app-nav";

const {
  data,
  children,
}: {
  data: { user: import("$lib/types").SessionUser | null };
  children: Snippet;
} = $props();

const isAuthPage = $derived(page.url.pathname === "/login" || page.url.pathname === "/reset-password");
</script>

<svelte:head>
  <title>Atma Dashboard</title>
  <meta name="description" content="Dashboard for Atma Gaming" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  />
</svelte:head>

{#if isAuthPage}
  {@render children()}
{:else}
  <div class="flex h-screen flex-col overflow-hidden">
    <AppNav user={data.user} />
    <main class="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto flex h-full max-w-7xl flex-col">
        {@render children()}
      </div>
    </main>
  </div>
{/if}
