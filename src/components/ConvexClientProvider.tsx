"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { ReactNode } from "react";
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={{ theme: dark }}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <header className="flex justify-between items-center p-4 border-b border-zinc-800">
          <SignedOut>
            <SignInButton></SignInButton>
            <SignUpButton>
              <button className="bg-rose-500 text-white p-2 rounded-2xl">signup</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton></UserButton>
          </SignedIn>
        </header>

          {children}
      
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <SignInButton></SignInButton>
            <SignUpButton>
              <button className="bg-rose-500 text-white p-2 rounded-2xl">signup</button>
            </SignUpButton>
          </div>
        </Unauthenticated>
        <AuthLoading>
          <div className="flex items-center justify-center min-h-[50vh]">
            Auth loading...
          </div>
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}