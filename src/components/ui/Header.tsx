'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CTA, NAV } from '@/data/nav';
import { cn } from '@/lib/cn';

/**
 * Header
 *
 * Sticky top bar with two responsive surfaces:
 *  - desktop (≥ md): logo + horizontal nav + saffron CTA
 *  - mobile  (< md): logo + hamburger that opens a full-screen
 *                    graphite overlay with the same nav
 *
 * Behaviour:
 *  - Transparent at top of page; flips to solid `--graphite` (paper text)
 *    once scrolled past 100px. Tracks the document's actual scroll
 *    position so it works with both native and Lenis-smoothed scroll.
 *  - A 2px mesh-orange progress bar pinned to the bottom edge of the
 *    bar widens 0% → 100% as the user scrolls the page.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrolled(scrollTop > 100);
      setProgress(max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile overlay is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-[1000] transition-colors duration-300',
        scrolled
          ? 'bg-graphite text-paper shadow-[0_2px_24px_-12px_rgba(0,0,0,0.4)]'
          : 'bg-transparent text-graphite',
      )}
    >
      <div className="mx-auto flex max-w-[1140px] items-center justify-between px-6 py-4 md:px-10 md:py-5">
        <Link
          href="/"
          aria-label="Ommi Forge — home"
          data-magnetic
          className="font-display text-lg font-bold tracking-[0.04em] uppercase leading-none"
        >
          <span className="block leading-none">Ommi</span>
          <span
            className={cn(
              'block text-[10px] font-eyebrow font-semibold tracking-[0.4em] uppercase',
              scrolled ? 'text-saffron' : 'text-mesh',
            )}
          >
            Forge
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 md:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-magnetic
              className={cn(
                'font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] transition-colors',
                scrolled
                  ? 'text-paper hover:text-saffron'
                  : 'text-graphite hover:text-mesh',
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={CTA.href}
            data-magnetic
            className="ml-2 inline-flex items-center justify-center bg-saffron px-5 py-2.5 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-graphite transition-colors hover:bg-mesh hover:text-paper"
          >
            {CTA.label}
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden',
            scrolled ? 'text-paper' : 'text-graphite',
          )}
        >
          <span
            className={cn(
              'block h-[2px] w-6 origin-center bg-current transition-transform duration-200',
              open && 'translate-y-[7px] rotate-45',
            )}
          />
          <span
            className={cn(
              'block h-[2px] w-6 bg-current transition-opacity duration-200',
              open && 'opacity-0',
            )}
          />
          <span
            className={cn(
              'block h-[2px] w-6 origin-center bg-current transition-transform duration-200',
              open && '-translate-y-[7px] -rotate-45',
            )}
          />
        </button>
      </div>

      {/* Scroll-progress hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-mesh"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 top-[68px] z-[999] flex flex-col bg-graphite text-paper md:hidden"
          >
            <nav
              aria-label="Mobile primary"
              className="flex flex-1 flex-col gap-6 px-8 py-10"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl font-light text-paper hover:text-saffron"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={CTA.href}
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex w-fit items-center justify-center bg-saffron px-6 py-3 font-eyebrow text-sm font-semibold uppercase tracking-[0.18em] text-graphite"
              >
                {CTA.label}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
