<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { Button } from "$components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$components/card";
import { Input } from "$components/input";
import { Separator } from "$components/separator";
import { api } from "$lib/api";
import { forgotPassword, initAuth, login, register } from "$lib/auth.svelte";
import { ls } from "$lib/storage";

type Mode = "login" | "register" | "forgot-password";

let mode = $state<Mode>("login");
let email = $state("");
let password = $state("");
let name = $state("");
let error = $state("");
let success = $state("");
let loading = $state(false);

const title = $derived(mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password");
const description = $derived(
  mode === "login"
    ? "Welcome back. Sign in to your account."
    : mode === "register"
      ? "Create a new account to get started."
      : "Enter your email and we'll send a reset link.",
);

async function handleSubmit() {
  error = "";
  success = "";
  loading = true;

  try {
    if (mode === "login") {
      await login(email, password);
      await goto("/");
    } else if (mode === "register") {
      await register(email, password, name);
      await login(email, password);
      await goto("/");
    } else {
      await forgotPassword(email);
      success = "If that email exists, a reset link has been sent.";
    }
  } catch (e) {
    if (mode === "login") error = "Invalid email or password";
    else if (mode === "register") error = (e as Error).message ?? "Registration failed";
    else error = "Something went wrong. Please try again.";
  } finally {
    loading = false;
  }
}

function switchMode(newMode: Mode) {
  mode = newMode;
  error = "";
  success = "";
}

onMount(() => {
  const token = page.url.searchParams.get("token");
  if (token) {
    ls.authToken = token;
    initAuth();
    goto("/");
  }
});
</script>

<div
  class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-background to-purple-50/30 px-4"
>
  <Card class="w-full max-w-sm shadow-lg">
    <CardHeader class="pb-2">
      <a href="/" class="mb-1 text-xl font-bold text-primary">Atma Finances</a>
      <CardTitle class="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if error}
        <p class="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      {/if}
      {#if success}
        <p class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      {/if}

      <form
        class="space-y-3"
        onsubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {#if mode === "register"}
          <Input bind:value={name} type="text" placeholder="Name" />
        {/if}
        <Input bind:value={email} type="email" placeholder="Email" required />
        {#if mode !== "forgot-password"}
          <Input bind:value={password} type="password" placeholder="Password" required minlength={8} />
        {/if}
        <Button type="submit" class="w-full" disabled={loading}>{loading ? "Please wait..." : title}</Button>
      </form>

      {#if mode === "login"}
        <div class="relative">
          <Separator />
          <span
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground"
          >
            or
          </span>
        </div>
        <a
          href="{api.$baseUrl}/auth/google/initiate"
          class="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <svg class="size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </a>
      {/if}

      <div class="flex justify-between text-xs text-muted-foreground">
        {#if mode === "login"}
          <button type="button" class="transition-colors hover:text-primary" onclick={() => switchMode("register")}>
            Create account
          </button>
          <button
            type="button"
            class="transition-colors hover:text-primary"
            onclick={() => switchMode("forgot-password")}
          >
            Forgot password?
          </button>
        {:else}
          <button type="button" class="transition-colors hover:text-primary" onclick={() => switchMode("login")}>
            Back to sign in
          </button>
        {/if}
      </div>

      <Separator />
      <div class="text-center">
        <p class="text-xs text-muted-foreground">Want to browse without signing in?</p>
        <a href="/" class="mt-1 inline-block text-sm font-medium text-primary hover:underline">Continue as guest</a>
      </div>
    </CardContent>
  </Card>
</div>
