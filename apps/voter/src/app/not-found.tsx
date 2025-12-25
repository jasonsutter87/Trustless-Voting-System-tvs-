import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Custom 404 Not Found Page
 *
 * Displayed when a user navigates to a route that doesn't exist.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
              <svg
                className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <CardTitle className="text-center text-2xl">Page not found</CardTitle>
          <CardDescription className="text-center">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md bg-zinc-50 p-4 text-center dark:bg-zinc-800">
            <p className="text-6xl font-bold text-zinc-900 dark:text-zinc-100">404</p>
          </div>

          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium">What can you try?</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Check the URL for typos</li>
              <li>Return to the home page</li>
              <li>Try verifying your vote</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">Return Home</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/verify">Verify Your Vote</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
