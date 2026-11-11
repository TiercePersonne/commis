'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext } from 'react';
import { BookOpen, Calendar, Plus, ShoppingBag, User, PenLine } from 'lucide-react';

export const HeaderVisibilityContext = createContext<boolean>(true);

export function useHeaderVisibility() {
  return useContext(HeaderVisibilityContext);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let accumulatedScroll = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 30) {
        setIsVisible(true);
        accumulatedScroll = 0;
      } else {
        if ((delta > 0 && accumulatedScroll < 0) || (delta < 0 && accumulatedScroll > 0)) {
          accumulatedScroll = 0;
        }
        accumulatedScroll += delta;

        if (accumulatedScroll > 35) {
          setIsVisible(false);
        } else if (accumulatedScroll < -25) {
          setIsVisible(true);
        }
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname.startsWith('/recipes');
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      href: '/',
      label: 'Recettes',
      icon: BookOpen,
    },
    {
      href: '/planner',
      label: 'Planning',
      icon: Calendar,
    },
    {
      href: '/import',
      label: 'Importer',
      icon: Plus,
    },
    {
      href: '/profile',
      label: 'Profil',
      icon: User,
    },
  ];

  return (
    <HeaderVisibilityContext.Provider value={isVisible}>
      <div className="relative flex flex-col min-h-[100dvh] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        {/* Top Smoked Glass Bar */}
        <header
          className="fixed top-3 left-4 right-4 md:left-8 md:right-8 z-40 glass-dock rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between transition-all duration-300 ease-out"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(-110%)',
          }}
        >
          <Link href="/" className="flex items-center pl-1 shrink-0">
            <img
              src="/logo.svg"
              alt="Commis"
              className="h-5 md:h-6 w-auto object-contain brightness-0 invert opacity-90"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`no-underline px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.6} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="h-4 w-px bg-[var(--color-border)] mx-1" />

            <Link
              href="/recipes/new"
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--accent-primary-hover)] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <PenLine size={13} strokeWidth={1.75} />
              <span>Créer</span>
            </Link>
          </nav>

          {/* Mobile Quick Action: Manual Creation */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/recipes/new"
              className="glass-pill px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 transition-colors"
            >
              <PenLine size={13} strokeWidth={1.6} />
              <span>Créer</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 flex-1">
          {children}
        </main>

        {/* Mobile PWA Floating Liquid Glass Dock */}
        <div
          className="md:hidden fixed bottom-4 left-4 right-4 z-50 pointer-events-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <nav
            aria-label="Navigation mobile"
            className="pointer-events-auto glass-dock rounded-full px-3 py-2 flex items-center justify-between max-w-md mx-auto"
          >
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-medium transition-all ${
                isActive('/')
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <BookOpen size={17} strokeWidth={1.6} />
              {isActive('/') && <span>Recettes</span>}
            </Link>

            <Link
              href="/planner"
              className={`px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-medium transition-all ${
                pathname === '/planner'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Calendar size={17} strokeWidth={1.6} />
              {pathname === '/planner' && <span>Planning</span>}
            </Link>

            <Link
              href="/import"
              aria-label="Importer une recette"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0 ${
                isActive('/import')
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-accent)] text-white'
              }`}
            >
              <Plus size={19} strokeWidth={2} />
            </Link>

            <button
              type="button"
              onClick={() => router.push('/planner?view=groceries')}
              aria-label="Liste de courses"
              className="px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
            >
              <ShoppingBag size={17} strokeWidth={1.6} />
            </button>

            <Link
              href="/profile"
              aria-label="Profil"
              className={`px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-medium transition-all ${
                isActive('/profile')
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <User size={17} strokeWidth={1.6} />
              {isActive('/profile') && <span>Profil</span>}
            </Link>
          </nav>
        </div>
      </div>
    </HeaderVisibilityContext.Provider>
  );
}
