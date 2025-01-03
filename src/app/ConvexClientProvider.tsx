"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexPath = process.env.NEXT_PUBLIC_CONVEX_URL || "https://dazzling-sparrow-544.convex.cloud";
const convex = new ConvexReactClient(convexPath);

const convexKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_ZnVuLWFwaGlkLTgyLmNsZXJrLmFjY291bnRzLmRldiQ";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={convexKey}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
