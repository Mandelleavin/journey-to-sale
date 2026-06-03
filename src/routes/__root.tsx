import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#6366f1" },
      { title: "90 Dni do Pierwszej Sprzedaży Online — Twój system misji" },
      {
        name: "description",
        content:
          "Krok po kroku doprowadzimy Cię do pierwszej sprzedaży online. Misje, XP, mentor i ścieżka 90 dni.",
      },
      { name: "author", content: "90 Dni" },
      { property: "og:title", content: "90 Dni do Pierwszej Sprzedaży Online — Twój system misji" },
      {
        property: "og:description",
        content:
          "Krok po kroku doprowadzimy Cię do pierwszej sprzedaży online. Misje, XP, mentor i ścieżka 90 dni.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      {
        name: "twitter:title",
        content: "90 Dni do Pierwszej Sprzedaży Online — Twój system misji",
      },
      {
        name: "twitter:description",
        content:
          "Krok po kroku doprowadzimy Cię do pierwszej sprzedaży online. Misje, XP, mentor i ścieżka 90 dni.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e1f3bb2d-74ff-492e-b603-989f05c20c64/id-preview-b1938f1b--1fcaddac-a7ab-48d6-80c1-47357c5b6796.lovable.app-1777449576409.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e1f3bb2d-74ff-492e-b603-989f05c20c64/id-preview-b1938f1b--1fcaddac-a7ab-48d6-80c1-47357c5b6796.lovable.app-1777449576409.png",
      },
    ],
    links: [
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48x48.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192x192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512x512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "mask-icon", href: "/icon-maskable-512x512.png", color: "#6366f1" },
      { rel: "stylesheet", href: appCss },
      { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { AuthProvider } from "@/lib/auth-context";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { QueryClient, QueryCache, MutationCache, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { captureServerError } from "@/lib/error-logger";

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            void captureServerError(error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            void captureServerError(error);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
            throwOnError: false,
          },
          mutations: { throwOnError: false },
        },
      }),
  );

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OnboardingProvider>
            <PaymentTestModeBanner />
            <Outlet />
            <MobileBottomNav />
            <Toaster position="top-center" richColors closeButton />
          </OnboardingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
