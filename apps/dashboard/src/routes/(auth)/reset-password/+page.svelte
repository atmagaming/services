<script lang="ts">
import { page } from "$app/state";
import { Button } from "$components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$components/card";
import { Input } from "$components/input";

const token = $derived(page.url.searchParams.get("token") ?? "");
let password = $state("");
let confirmPassword = $state("");
let error = $state("");
let success = $state(false);
let loading = $state(false);

async function handleSubmit() {
  error = "";

  if (password !== confirmPassword) {
    error = "Passwords do not match";
    return;
  }

  loading = true;
  try {
    const { apiFetch } = await import("$lib/api");
    const res = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      const responsePayload = await res.json().catch(() => ({}));
      error = responsePayload?.message ?? "Something went wrong. Please try again.";
      return;
    }
    success = true;
  } finally {
    loading = false;
  }
}
</script>

<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-background to-purple-50/30 px-4">
  {#if !token}
    <p class="text-muted-foreground">Invalid reset link.</p>
  {:else if success}
    <Card class="w-full max-w-sm text-center shadow-lg">
      <CardContent class="space-y-3 pt-6">
        <p class="text-sm text-green-600 font-medium">Password reset successfully.</p>
        <a href="/login" class="text-sm text-primary hover:underline">Back to sign in</a>
      </CardContent>
    </Card>
  {:else}
    <Card class="w-full max-w-sm shadow-lg">
      <CardHeader class="pb-2">
        <a href="/" class="mb-1 text-xl font-bold text-primary">Atma Finances</a>
        <CardTitle class="text-lg">Set New Password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if error}
          <p class="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
        {/if}

        <form class="space-y-3" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Input bind:value={password} type="password" placeholder="New password" required minlength={8} />
          <Input bind:value={confirmPassword} type="password" placeholder="Confirm password" required minlength={8} />
          <Button type="submit" class="w-full" disabled={loading}>{loading ? "Please wait..." : "Reset Password"}</Button>
        </form>
      </CardContent>
    </Card>
  {/if}
</div>
