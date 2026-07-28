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
 *  - desktop (≥ lg): logo + horizontal nav + saffron Quote CTA
 *  - mobile/tablet (< lg): logo + inline "Quote" chip + hamburger that
 *                    opens a right-side graphite sheet (88vw, max 420px).
 *                    Tablets get the hamburger because 7 links + a CTA
 *                    are too tight in the md (768px) range.
 *
 * Bar height is exposed as the CSS custom property `--header-h` (set in
 * `globals.css` with an iOS safe-area inset). `<main>` reads it for top
 * padding and the Hero pulls itself back up by the same amount so the
 * fixed bar overlays the hero without leaving a gap on secondary routes.
 *
 * v3 colour: the page ground is graphite, so the v2 branch that flipped
 * secondary routes to a solid bar at scrollTop 0 (because their heroes
 * were paper and a paper-toned logo vanished) is gone — there is no light
 * hero left to guard against. The bar is transparent at the top of every
 * route and becomes solid graphite with a cinder hairline past 100px.
 * Foreground stays `text-paper` (15.46:1 on graphite) with a text-shadow
 * while transparent, because on `/` it is sitting over a live canvas.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // The scroll-progress hairline is written straight to the DOM node
  // rather than held in state: it changes on every scroll frame, and a
  // setState there re-rendered the whole header (nav + AnimatePresence
  // sheet) ~60×/second while Lenis was already saturating the frame.
  // `scrolled` stays in state because it flips at most twice per page.
  const progressRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  // Whether the sheet has actually been opened — gates the focus-return
  // in the lock effect so the mount run doesn't steal focus.
  const wasOpenRef = useRef(false);

  // Close the sheet on route change — React 19 derived-state-from-prop pattern
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Scroll-progress + scrolled boolean
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrolled(scrollTop > 100);
      const progress = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
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
      document.documentElement.style.overflow = '';
      setLenisPaused(false);
      // Return focus to the trigger without scrolling the page — but only
      // when the sheet was actually open. This effect also runs once on
      // mount (open=false), and focusing there steals keyboard focus to
      // the hamburger on every page load (an invisible control at ≥lg).
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        triggerRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    wasOpenRef.current = true;
    // Pause Lenis FIRST so it stops driving transforms on the document
    // while we lock the body — prevents the scroll-position glitch.
    setLenisPaused(true);
    // Lock <html> too: Lenis scrolls the root element, and under
    // reduced-motion / CALM_MODE Lenis isn't mounted at all, so the
    // body-only lock leaves the page scrollable behind the sheet.
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
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
      // Release BOTH locks. The open branch above locks <html> as well as
      // <body>, so clearing only body here left the document permanently
      // unscrollable if the header ever unmounted while the sheet was
      // open (dev fast-refresh, or a route swap that remounts the tree).
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      setLenisPaused(false);
    };
  }, [open]);

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className={cn(
        'fixed inset-x-0 top-0 z-[1000] text-paper transition-colors duration-300',
        // The v2 drop shadow was a dark blur on what is now a dark ground —
        // it separated nothing. A cinder hairline (3.03:1 on graphite) is the
        // structural edge instead, and it doubles as the track the mesh
        // scroll-progress bar fills along.
        scrolled
          ? 'border-b border-cinder bg-graphite'
          : 'border-b border-transparent bg-transparent [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]',
      )}
    >
      <div className="mx-auto flex max-w-page items-center justify-between px-6 py-3 md:px-10 md:py-4">
        <Link
          href="/"
          aria-label="Ommi Forge — home"
          data-magnetic
          data-cursor-label="Home"
          className="mr-6 inline-flex items-center md:mr-10 lg:mr-16"
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
            className="h-7 w-auto md:h-[34px]"
          />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-5 lg:flex lg:gap-7"
        >
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-magnetic
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative whitespace-nowrap font-eyebrow text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-saffron lg:text-xs',
                  // Current page carries a saffron underline as well as
                  // the saffron ink — `color-not-only`, so the active item
                  // still reads for anyone who can't separate the two
                  // oranges from paper-white.
                  active &&
                    'text-saffron after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:bg-saffron after:content-[""]',
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {/* Hover keeps GRAPHITE ink, it does not flip to paper. The v2
              pattern was `hover:bg-mesh hover:text-paper`, and paper on mesh
              measures 3.05:1 — under AA 4.5:1 for a 12px uppercase label,
              which is nowhere near large-text size. graphite on mesh is
              5.07:1 and passes. Same fix applied to every saffron CTA in
              this lane. */}
          <Link
            href={CTA.href}
            data-magnetic
            className="ml-2 inline-flex items-center justify-center bg-saffron px-5 py-2.5 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-graphite transition-colors hover:bg-mesh hover:text-graphite"
          >
            {CTA.label}
          </Link>
        </nav>

        {/* Mobile/tablet: inline Quote chip + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* 36px-tall chip, but the tap target is padded out to the full
              44px via an invisible ::after — `touch-target-size` says to
              extend the hit area beyond the visual bounds rather than
              inflate the chip, which would make it as tall as the
              hamburger and unbalance the bar. */}
          <Link
            href={CTA.href}
            data-magnetic
            className="relative inline-flex h-9 items-center bg-saffron px-3.5 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em] text-graphite after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']"
          >
            Quote
          </Link>
          <button
            ref={triggerRef}
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls={open ? 'mobile-nav' : undefined}
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-11 w-11 items-center justify-center"
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

      {/* Scroll-progress hairline — scaleX is driven imperatively by the
          scroll listener above (see progressRef). */}
      <div
        ref={progressRef}
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-mesh"
        style={{ transform: 'scaleX(0)' }}
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
              // No backdrop-blur (§6.2) — and on `/` this scrim sits over a
              // live WebGL canvas, where a full-viewport blur is a real
              // per-frame cost, not just a stylistic one. A denser flat
              // graphite scrim does the same legibility job for free.
              className="fixed inset-0 z-[998] cursor-default bg-graphite/70 lg:hidden"
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
              // slag, not graphite: a graphite sheet on a graphite page has no
              // edge at all now. slag is only a 1.17:1 lift, so the leading
              // edge carries an `ash` hairline — 3.22:1 against slag and
              // 3.76:1 against the graphite behind it, i.e. it clears WCAG
              // 1.4.11 on BOTH sides. `cinder` would not: it is 3.03:1 on
              // graphite but only 2.60:1 on slag.
              className="fixed inset-y-0 right-0 z-[999] flex w-[88vw] max-w-[420px] flex-col border-l border-ash bg-slag text-paper lg:hidden"
            >
              <nav
                aria-label="Mobile primary"
                className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 py-10"
              >
                {NAV.map((item, i) => {
                  // Same current-page test as the desktop nav — the sheet
                  // was the one place that never marked where you are.
                  const active =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      ref={i === 0 ? firstLinkRef : undefined}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'font-display text-3xl font-light transition-colors hover:text-saffron',
                        active
                          ? 'text-saffron underline decoration-saffron decoration-1 underline-offset-8'
                          : 'text-paper',
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href={CTA.href}
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex w-fit items-center justify-center bg-saffron px-6 py-3 font-eyebrow text-sm font-semibold uppercase tracking-[0.18em] text-graphite"
                >
                  {CTA.label}
                </Link>

                {/* Reach-us block at sheet bottom.
                    Every `text-paper/NN` here became a measured token: on slag
                    the alpha steps were unverifiable guesses, and paper/60 in
                    particular landed under AA. swarf is 5.31:1 on slag, and
                    the eyebrow goes saffron (6.49:1) rather than mesh, which
                    is only 4.35:1 there. */}
                <div className="mt-auto border-t border-ash pt-6">
                  <p className="type-eyebrow text-saffron">Reach us</p>
                  <a
                    href="mailto:marketing@ommiforge.com"
                    className="mt-3 block font-body text-sm text-swarf transition-colors hover:text-saffron"
                  >
                    marketing@ommiforge.com
                  </a>
                  <a
                    href="tel:+918951953866"
                    className="mt-1 block font-body text-sm text-swarf transition-colors hover:text-saffron"
                  >
                    +91 8951953866
                  </a>
                  <p className="mt-3 font-body text-xs text-swarf">
                    Plot No 300, 301 &amp; 302, 3rd Phase,
                    <br />
                    Industrial Area, Malur, Karnataka 563160
                  </p>
                  <p className="mt-2 font-body text-xs text-swarf">
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
