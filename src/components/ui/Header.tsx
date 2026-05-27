'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CTA, NAV } from '@/data/nav';
import { cn } from '@/lib/cn';

/**
 * Header
 *
 *  - desktop (≥ md): logo + horizontal nav + saffron Quote CTA
 *  - mobile  (< md): logo + inline "Quote" chip + hamburger that opens
 *                    a right-side graphite sheet (88vw, max 420px)
 *
 * Bar height is exposed as the CSS custom property `--header-h` (set in
 * `globals.css` with an iOS safe-area inset). `<main>` reads it for top
 * padding and the Hero pulls itself back up by the same amount so the
 * fixed bar overlays the hero without leaving a gap on secondary routes.
 *
 * Foreground colour at the top of the page is `text-paper` with a
 * subtle text-shadow so the logo + hamburger stay legible over either
 * the dark hero video or any lighter page hero. Once scrolled past
 * 100px the bar flips to solid graphite.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Close the sheet on route change — React 19 derived-state-from-prop pattern
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Only the home route ("/") opens against the dark hero video. Every
  // other route has a paper-toned hero at the top, so the transparent
  // "text-paper" treatment would render the logo invisible until the
  // user scrolls past 100px. Detect that here and flip to a graphite
  // foreground at the top of secondary routes; once scrolled past 100px
  // the bar becomes solid graphite either way.
  const onDarkHero = pathname === '/';

  // Scroll-progress + scrolled boolean
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

  // Body-scroll lock + Lenis pause + focus trap while the sheet is open
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const setLenisPaused = (paused: boolean) => {
      document.dispatchEvent(
        new CustomEvent('lenis:setpaused', { detail: { paused } }),
      );
    };

    if (!open) {
      document.body.style.overflow = '';
      setLenisPaused(false);
      // Return focus to the trigger without scrolling the page
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }
    // Pause Lenis FIRST so it stops driving transforms on the document
    // while we lock the body — prevents the scroll-position glitch.
    setLenisPaused(true);
    document.body.style.overflow = 'hidden';
    // Move focus into the sheet without yanking the page
    firstLinkRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const node = overlayRef.current;
      if (!node) return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      setLenisPaused(false);
    };
  }, [open]);

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className={cn(
        'fixed inset-x-0 top-0 z-[1000] transition-colors duration-300',
        // Home keeps the transparent-over-hero treatment at the top; every
        // other route now gets a solid graphite bar so the white-outlined
        // wordmark logo always reads cleanly.
        scrolled || !onDarkHero
          ? 'bg-graphite text-paper shadow-[0_2px_24px_-12px_rgba(0,0,0,0.4)]'
          : 'bg-transparent text-paper [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]',
      )}
    >
      <div className="mx-auto flex max-w-[1140px] items-center justify-between px-6 py-3 md:px-10 md:py-4">
        <Link
          href="/"
          aria-label="Ommi Forge — home"
          data-magnetic
          data-cursor-label="Home"
          className="inline-flex items-center"
        >
          {/* Real brand wordmark (Ommi italic + Forge block + tricolor bar).
              Outlined strokes — designed for dark backgrounds. Sized to the
              header height: ~32px on mobile, ~38px on desktop. */}
          <Image
            src="/assets/brand/logo-cropped-679x140.png"
            alt="Ommi Forge"
            width={679}
            height={140}
            priority
            className="h-8 w-auto md:h-9"
          />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-magnetic
              className="font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:text-saffron"
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

        {/* Mobile: inline Quote chip + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={CTA.href}
            data-magnetic
            className="inline-flex h-9 items-center bg-saffron px-3.5 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em] text-graphite"
          >
            Quote
          </Link>
          <button
            ref={triggerRef}
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center"
          >
            <span
              className={cn(
                'absolute block h-[1.5px] w-5 origin-center bg-current transition-transform duration-300',
                open ? 'translate-y-0 rotate-45' : '-translate-y-[6px]',
              )}
            />
            <span
              className={cn(
                'absolute block h-[1.5px] w-5 bg-current transition-opacity duration-200',
                open && 'opacity-0',
              )}
            />
            <span
              className={cn(
                'absolute block h-[1.5px] w-5 origin-center bg-current transition-transform duration-300',
                open ? 'translate-y-0 -rotate-45' : 'translate-y-[6px]',
              )}
            />
          </button>
        </div>
      </div>

      {/* Scroll-progress hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-mesh"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="mobile-backdrop"
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ top: 'var(--header-h)' }}
              className="fixed inset-0 z-[998] cursor-default bg-graphite/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              id="mobile-nav"
              key="mobile-nav"
              ref={overlayRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              data-lenis-prevent
              initial={{ x: '100%', skewY: 2, opacity: 0.6 }}
              animate={{ x: 0, skewY: 0, opacity: 1 }}
              exit={{ x: '100%', skewY: 2, opacity: 0.6 }}
              transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
              style={{
                top: 'var(--header-h)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
              className="fixed inset-y-0 right-0 z-[999] flex w-[88vw] max-w-[420px] flex-col bg-graphite text-paper md:hidden"
            >
              <nav
                aria-label="Mobile primary"
                className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 py-10"
              >
                {NAV.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    ref={i === 0 ? firstLinkRef : undefined}
                    onClick={() => setOpen(false)}
                    className="font-display text-3xl font-light text-paper transition-colors hover:text-saffron"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={CTA.href}
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex w-fit items-center justify-center bg-saffron px-6 py-3 font-eyebrow text-sm font-semibold uppercase tracking-[0.18em] text-graphite"
                >
                  {CTA.label}
                </Link>

                {/* Reach-us block at sheet bottom */}
                <div className="mt-auto border-t border-paper/15 pt-6">
                  <p className="font-eyebrow text-[10px] uppercase tracking-[0.3em] text-mesh">
                    Reach us
                  </p>
                  <a
                    href="mailto:marketing@ommiforge.com"
                    className="mt-3 block font-body text-sm text-paper/80 transition-colors hover:text-saffron"
                  >
                    marketing@ommiforge.com
                  </a>
                  <a
                    href="tel:+918951953866"
                    className="mt-1 block font-body text-sm text-paper/80 transition-colors hover:text-saffron"
                  >
                    +91 8951953866
                  </a>
                  <p className="mt-3 font-body text-xs text-paper/60">
                    Plot No 300, 301 &amp; 302, 3rd Phase,
                    <br />
                    Industrial Area, Malur, Karnataka 563160
                  </p>
                  <p className="mt-2 font-body text-xs text-paper/60">
                    Sun – Fri · 9 AM – 5 PM
                  </p>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
