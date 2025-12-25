/**
 * Global Loading State
 *
 * Displayed when navigating between routes while data is being loaded.
 * This creates a smooth transition and indicates to users that content is loading.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative h-12 w-12">
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-zinc-200 dark:border-zinc-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100"></div>
        </div>

        {/* Loading Text */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
