import Link from 'next/link';
import { ElectionWizard } from '@/components/elections/election-wizard';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function NewElectionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/elections"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Elections
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Create New Election
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Set up a new election for your organization
        </p>
      </div>

      {/* Wizard */}
      <ElectionWizard />
    </div>
  );
}
