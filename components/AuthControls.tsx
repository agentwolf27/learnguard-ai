"use client";

import { SignInButton, SignOutButton, UserButton, useAuth } from "@clerk/nextjs";
import { LogIn, LogOut } from "lucide-react";

export function AuthControls() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-ink/60">
        Local demo auth
      </span>
    );
  }

  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className="flex items-center gap-2">
      {isLoaded && !isSignedIn ? (
        <SignInButton mode="modal">
          <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/75 hover:bg-paper">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </button>
        </SignInButton>
      ) : null}
      {isSignedIn ? (
        <>
        <UserButton />
        <SignOutButton>
          <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink/75 hover:bg-paper">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </SignOutButton>
        </>
      ) : null}
    </div>
  );
}
