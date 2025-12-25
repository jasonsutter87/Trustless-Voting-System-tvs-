import { Header } from "@/components/header";

/**
 * Main Layout
 *
 * Wraps all voter portal pages with the navigation header.
 * Mobile-first design with responsive navigation.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row">
            <p>TVS - Trustless Voting System</p>
            <p>Your vote is encrypted and anonymous</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
