'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Overview', href: '' },
  { name: 'Ballot', href: '/ballot' },
  { name: 'Voters', href: '/voters' },
  { name: 'Trustees', href: '/trustees' },
  { name: 'Results', href: '/results' },
  { name: 'Settings', href: '/settings' },
  { name: 'Preview', href: '/preview' },
];

export default function ElectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const baseHref = `/elections/${params.id}`;

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-8">
          {navItems.map((item) => {
            const href = baseHref + item.href;
            const isActive = pathname === href;

            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium',
                  isActive
                    ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
