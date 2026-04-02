'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname.startsWith('/recipes');
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: '/', label: 'Collection' },
    { href: '/import', label: 'Import' },
    { href: '/planner', label: 'Planning' },
    { href: '/profile', label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between"
        style={{ boxShadow: '0 1px 3px rgba(44, 24, 16, 0.06)' }}
      >
        <Link href="/" className="text-[20px] font-serif font-bold text-[var(--color-accent)]">
          Commis
        </Link>
        
        <nav className="flex items-center gap-1 bg-[var(--color-bg-primary)] rounded-[12px] p-1 border border-[var(--color-border-light)]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`no-underline px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer select-none ${
                isActive(item.href)
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-accent)]'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/40'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-secondary)]`}
              style={
                isActive(item.href)
                  ? {
                      boxShadow: '0 1px 3px rgba(44, 24, 16, 0.06)',
                      border: '1px solid rgba(44, 24, 16, 0.06)',
                    }
                  : {}
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
