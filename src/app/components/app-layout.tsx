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
    { 
      href: '/', 
      label: 'Collection',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-5 sm:h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      )
    },
    { 
      href: '/import', 
      label: 'Import',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-5 sm:h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      )
    },
    { 
      href: '/planner', 
      label: 'Planning',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-5 sm:h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      )
    },
    { 
      href: '/profile', 
      label: 'Profil',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-5 sm:h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--color-bg-primary)] pb-[100px] md:pb-0">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-center md:justify-between"
        style={{ boxShadow: '0 1px 3px rgba(44, 24, 16, 0.06)' }}
      >
        <Link href="/" className="text-[20px] font-serif font-bold text-[var(--color-accent)]">
          Commis
        </Link>
        
        <nav className="hidden md:flex items-center gap-1 bg-[var(--color-bg-primary)] rounded-[12px] p-1 border border-[var(--color-border-light)]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`no-underline px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer select-none flex items-center gap-2 ${
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
              <div className="hidden">{item.icon}</div>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] px-2 py-2 flex items-center justify-around"
           style={{ boxShadow: '0 -1px 3px rgba(44, 24, 16, 0.06)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-[72px] h-14 rounded-2xl transition-colors ${
                active 
                  ? 'text-[var(--color-accent)]' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
              }`}
            >
              <div className={`mb-1 transition-transform ${active ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      <main className="pt-16 md:pt-20">
        {children}
      </main>
    </div>
  );
}
