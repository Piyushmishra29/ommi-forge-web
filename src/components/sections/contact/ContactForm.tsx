'use client';

import { useRef, useState } from 'react';
import {
  useForm,
  type FieldError,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import Eyebrow from '@/components/ui/Eyebrow';

/**
 * Contact form — react-hook-form + zod, persistent editorial labels,
 * and a success-state morph that swaps the form for a graphite slab on
 * submit.
 *
 * Wire-up:
 *   - If `NEXT_PUBLIC_FORMSPREE_URL` is set at build time, the form
 *     POSTs the payload as JSON to that endpoint. A 200/202 response
 *     flips to the success state; anything else surfaces an error
 *     banner with a "Try again" affordance that re-submits.
 *   - If the env var is unset (default), the form does NOT fake a
 *     success flip. It surfaces an honest inline notice telling the
 *     visitor to email us directly, and keeps their input intact. No
 *     network is touched and no payload is logged.
 *
 * v3 surface note: this component lives inside a `<PaperCard>` (§2.3) —
 * a form is a document, so it is one of the few things on a dark site
 * that belongs on paper. That is why almost nothing below changed in the
 * dark conversion: `.paper-card` re-points the semantic ink tokens to the
 * v2 light palette for its whole subtree, so every `text-graphite`,
 * `text-ember`, `text-steel`, `text-cinder` and `border-graphite/25`
 * here is still measuring exactly what it measured in v2. The a11y
 * contract below was carried forward verbatim, not re-derived.
 *
 * Accessibility contract (the form is the site's only conversion
 * point, so this is deliberately explicit):
 *   - Every input has a persistent visible label above it. The old
 *     floating-label treatment put the label *inside* the field at
 *     rest, which reads as placeholder-as-label once the field is
 *     filled and the label has floated out of the reading order.
 *   - Errors render adjacent to their field with `role="alert"`, are
 *     wired to the input via `aria-describedby`, and set
 *     `aria-invalid`. Colour is never the only signal — every error
 *     carries a glyph and a sentence.
 *   - Two or more errors also raise a summary at the top of the form
 *     with in-page links to each field (WCAG 3.3.1 technique G139).
 *   - Validation is `onBlur` first: a first-time error never appears
 *     mid-keystroke. Once a field IS in error we re-validate on change
 *     so the error clears the instant the value becomes valid.
 *   - Submit, success and failure are announced through a persistent
 *     sr-only live region — a live region that mounts together with its
 *     own content is not reliably announced, so it lives outside the
 *     `AnimatePresence` swap.
 *
 * Server-side spam protection: enable reCAPTCHA inside the Formspree
 * dashboard once wired — this client never sees the captcha tokens.
 */
const FORMSPREE_URL = process.env.NEXT_PUBLIC_FORMSPREE_URL;

const ContactSchema = z.object({
  firstName: z.string().min(1, 'Enter your first name'),
  lastName: z.string().min(1, 'Enter your last name'),
  // Optional — procurement contacts nearly always give it, but a
  // missing company should never block a quote request.
  company: z.string().max(120, 'Company name is too long').optional(),
  email: z.email('Enter a valid email, e.g. name@company.com'),
  phone: z
    .string()
    .min(6, 'Enter a phone number with at least 6 digits')
    .regex(/^[+0-9 ()-]+$/u, 'Use digits, spaces and + - ( ) only'),
  message: z
    .string()
    .min(10, 'Tell us a little more — at least 10 characters'),
});

type ContactValues = z.infer<typeof ContactSchema>;
type FieldName = keyof ContactValues;

/**
 * Visual order of the fields. `Object.keys(errors)` does not preserve
 * it, so the error summary walks this list instead — the summary must
 * read top-to-bottom in the same order the visitor sees.
 */
const FIELD_ORDER: ReadonlyArray<FieldName> = [
  'firstName',
  'lastName',
  'company',
  'email',
  'phone',
  'message',
];

const FIELD_LABELS: Record<FieldName, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  message: 'Message',
};

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);
  const reduced = useReducedMotion();

  // Focus bookkeeping across the AnimatePresence swap. The success
  // slab takes focus when it mounts (otherwise focus is orphaned on
  // the button that just unmounted); coming back the other way we
  // return the visitor to the first field.
  const successRef = useRef<HTMLDivElement | null>(null);
  const refocusFirstField = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    // Blur-first validation: never scold someone mid-word.
    mode: 'onBlur',
    // …but once a field is already flagged, clear the flag as soon as
    // the value becomes valid rather than making them blur again.
    reValidateMode: 'onChange',
    // WCAG focus management — send focus to the first invalid field on
    // a failed submit. This is react-hook-form's default; pinned here
    // so a future refactor can't quietly drop it.
    shouldFocusError: true,
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  async function onSubmit(values: ContactValues) {
    setSubmitError(null);
    setUnconfigured(false);

    if (!FORMSPREE_URL) {
      // No endpoint configured — do NOT fake success. Surface an honest
      // inline notice and keep the visitor's input intact so nothing is
      // silently dropped. Never log the payload (it contains PII).
      setUnconfigured(true);
      return;
    }

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.status === 200 || response.status === 202) {
        setSubmitted(true);
        return;
      }

      setSubmitError(
        `Sorry — we couldn't send your message (status ${String(response.status)}). Please try again, or email marketing@ommiforge.com.`,
      );
    } catch {
      setSubmitError(
        "Sorry — we couldn't reach the form service. Check your connection and try again, or email marketing@ommiforge.com.",
      );
    }
  }

  function handleReset() {
    reset();
    refocusFirstField.current = true;
    setSubmitted(false);
    setSubmitError(null);
    setUnconfigured(false);
  }

  function handleRetry() {
    setSubmitError(null);
    void handleSubmit(onSubmit)();
  }

  /** Errors in visual order — drives the summary block. */
  const orderedErrors = FIELD_ORDER.flatMap((name) => {
    const error = errors[name];
    return error ? [{ name, error }] : [];
  });

  // Announcement text for the persistent live region. Validation and
  // delivery failures already carry their own role="alert", so this
  // region only narrates the two states that have no visible anchor of
  // their own at the moment they happen: in-flight and delivered.
  const statusMessage = isSubmitting
    ? 'Sending your message…'
    : submitted
      ? 'Message sent. We will be in touch, often within a day.'
      : '';

  return (
    // Capped measure inside a full-width sheet. The card itself runs the
    // container width (a paper card has a 480px floor and is never a chip),
    // but ~490px-wide text inputs are not a form, they are a banner.
    <div className="relative max-w-[820px]">
      {/* Persistent live region — must NOT live inside the
          AnimatePresence swap, see the header comment. */}
      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>

      {/* Section heading above the form — editorial, not corporate. */}
      <div className="mb-10 md:mb-12">
        {/* <Eyebrow> resolves to ember in here via --color-ink-accent; the
            v2 markup hard-coded ember for the label and mesh for the dash,
            and mesh is only ≈3:1 on paper even as a hairline. */}
        <Eyebrow>Start a quote</Eyebrow>
        <h2 className="type-display-m mt-6">
          Tell us what you&apos;re making.
        </h2>
        <p className="type-small mt-4">
          Fields marked <span className="text-ink-accent">*</span> are required.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            // Only the DURATION is gated on reduced-motion, never the
            // geometry: framer-motion writes `initial` into the SSR
            // markup, so a client-side `reduced` that differs from the
            // server's `false` would hydrate a mismatched inline style.
            // duration 0 lands the element at rest instantly, which is
            // what reduced-motion asks for anyway.
            transition={{
              duration: reduced ? 0 : 0.35,
              ease: [0.76, 0, 0.24, 1],
            }}
            onAnimationStart={() => {
              // Only ever true immediately after "Send another message",
              // so a cold page load never steals focus.
              if (!refocusFirstField.current) return;
              refocusFirstField.current = false;
              document.getElementById('firstName')?.focus();
            }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {/* Error summary — only once there is more than one thing to
                fix. With a single error the inline message plus the
                auto-focus already point straight at it. */}
            {submitCount > 0 && orderedErrors.length > 1 && (
              <div
                role="alert"
                className="md:col-span-2 border-l-2 border-ember bg-ember/5 px-5 py-4"
              >
                <p className="font-eyebrow text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">
                  {orderedErrors.length} fields need attention
                </p>
                <ul className="mt-3 space-y-2">
                  {orderedErrors.map(({ name, error }) => (
                    <li key={name}>
                      <a
                        href={`#${name}`}
                        onClick={(event) => {
                          event.preventDefault();
                          document.getElementById(name)?.focus();
                        }}
                        className="font-body text-sm leading-relaxed text-graphite underline decoration-ember decoration-2 underline-offset-4 transition-colors hover:text-ember"
                      >
                        {FIELD_LABELS[name]} — {error.message}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Field
              label={FIELD_LABELS.firstName}
              required
              type="text"
              autoComplete="given-name"
              error={errors.firstName}
              registration={register('firstName')}
            />
            <Field
              label={FIELD_LABELS.lastName}
              required
              type="text"
              autoComplete="family-name"
              error={errors.lastName}
              registration={register('lastName')}
            />
            <Field
              label={FIELD_LABELS.company}
              type="text"
              autoComplete="organization"
              className="md:col-span-2"
              hint="Helps us route your enquiry to the right metallurgist."
              error={errors.company}
              registration={register('company')}
            />
            <Field
              label={FIELD_LABELS.email}
              required
              type="email"
              inputMode="email"
              autoComplete="email"
              error={errors.email}
              registration={register('email')}
            />
            <Field
              label={FIELD_LABELS.phone}
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              hint="Include the country code — we call India and abroad."
              error={errors.phone}
              registration={register('phone')}
            />
            <Field
              label={FIELD_LABELS.message}
              required
              multiline
              className="md:col-span-2"
              hint="A drawing reference, a grade, a quantity — whatever you have."
              error={errors.message}
              registration={register('message')}
            />

            {unconfigured && (
              <div
                role="status"
                aria-live="polite"
                className="md:col-span-2 border border-ember/40 bg-ember/5 px-5 py-4 text-graphite"
              >
                <p className="font-body text-sm leading-relaxed">
                  Direct form delivery isn&apos;t enabled on this preview —
                  please email{' '}
                  <a
                    href="mailto:marketing@ommiforge.com"
                    className="text-ember underline decoration-2 underline-offset-4 transition-colors hover:text-graphite"
                  >
                    marketing@ommiforge.com
                  </a>
                  . Your message is still here, ready to copy.
                </p>
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="md:col-span-2 flex flex-col gap-3 border border-ember bg-ember/5 px-5 py-4 text-graphite sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="flex items-start gap-2 font-body text-sm leading-relaxed">
                  <AlertIcon />
                  <span>{submitError}</span>
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center self-start border border-ember px-5 font-eyebrow text-[11px] font-semibold uppercase tracking-[0.18em] text-ember transition-colors hover:bg-ember hover:text-paper disabled:opacity-50 sm:self-auto"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                data-magnetic
                data-cursor-label="Send"
                className="inline-flex min-h-11 items-center justify-center gap-3 bg-saffron px-10 py-5 font-eyebrow text-xs font-semibold uppercase tracking-[0.22em] text-graphite transition-colors hover:bg-mesh hover:text-graphite disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon />
                    Sending…
                  </>
                ) : (
                  'Send →'
                )}
              </button>
              <p className="mt-6 font-body text-sm leading-relaxed text-steel">
                Or email{' '}
                <a
                  href="mailto:marketing@ommiforge.com"
                  className="text-graphite underline decoration-saffron decoration-2 underline-offset-4 transition-colors hover:text-ember"
                >
                  marketing@ommiforge.com
                </a>{' '}
                directly — same inbox.
              </p>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            ref={successRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{
              duration: reduced ? 0 : 0.45,
              ease: [0.76, 0, 0.24, 1],
            }}
            onAnimationStart={() => successRef.current?.focus()}
            // Stays ON the sheet. v2 swapped in a graphite slab with mesh
            // corner brackets; both had to go. The brackets are HUD chrome
            // (§6.9), and a dark block nested inside a paper card re-inverts
            // the ink tokens under it — every `type-*` class in here would
            // have quietly resolved to the light palette on a dark ground
            // (ember at 2.98:1). One ember rule down the leading edge marks
            // the state change instead, using the sheet's own accent.
            className="relative min-h-[360px] border-l-4 border-ember py-2 pl-8 md:pl-10"
          >
            <Eyebrow>Message sent</Eyebrow>
            <h3 className="type-display-l mt-6 max-w-xl text-balance">
              Thanks. We&apos;ll be in touch — often within a day.
            </h3>
            <p className="type-lede mt-6 max-w-[60ch] text-pretty">
              Our marketing desk routes inquiries to the right metallurgist or
              project lead the same morning. Expect a reply from a real human.
            </p>
            <button
              type="button"
              onClick={handleReset}
              data-magnetic
              className="type-eyebrow mt-10 inline-flex min-h-11 items-center gap-2 border border-ember px-6 text-ink-accent transition-colors hover:bg-ember hover:text-paper"
            >
              Send another message ↺
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Field
 * ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  registration: UseFormRegisterReturn;
  /** Renders a `<textarea>` instead of an `<input>`. */
  multiline?: boolean;
  type?: string;
  inputMode?: 'text' | 'email' | 'tel';
  autoComplete?: string;
  /** Persistent helper text — stays visible even while in error. */
  hint?: string;
  required?: boolean;
  className?: string;
  error?: FieldError;
}

// Shared so the input and the textarea can never drift apart. No
// `outline-none`: the global two-tone `:focus-visible` ring in
// globals.css is the site's focus affordance and must survive here.
// `focus:border-ember` is an addition to it, not a replacement.
const CONTROL_CLASS =
  'mt-3 block w-full border-0 border-b bg-transparent px-0 pb-3 font-body text-base text-graphite transition-colors focus:border-ember';

function Field({
  label,
  registration,
  multiline = false,
  type = 'text',
  inputMode,
  autoComplete,
  hint,
  required = false,
  className,
  error,
}: FieldProps) {
  const id = registration.name;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Helper text stays mounted while in error, so both ids are always
  // safe to reference.
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  const controlProps = {
    ...registration,
    id,
    autoComplete,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: cn(
      CONTROL_CLASS,
      error ? 'border-ember' : 'border-graphite/25',
      multiline ? 'resize-y' : 'min-h-11',
    ),
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <label
        htmlFor={id}
        className="font-eyebrow text-xs font-semibold uppercase tracking-[0.28em] text-steel"
      >
        {label}
        {required ? (
          <span aria-hidden className="ml-1 text-ember">
            *
          </span>
        ) : (
          <span className="ml-2 font-body text-[11px] font-normal normal-case tracking-normal text-cinder">
            (optional)
          </span>
        )}
      </label>

      {multiline ? (
        <textarea {...controlProps} rows={5} />
      ) : (
        <input {...controlProps} type={type} inputMode={inputMode} />
      )}

      {hint && (
        <p
          id={hintId}
          className="mt-2 font-body text-xs leading-relaxed text-cinder"
        >
          {hint}
        </p>
      )}

      {error && (
        // role="alert" so the message is announced the moment it
        // appears; the glyph keeps the state from being colour-only.
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-start gap-2 font-eyebrow text-[11px] font-semibold uppercase tracking-[0.16em] text-ember"
        >
          <AlertIcon />
          <span>{error.message}</span>
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * Icons — SVG only, never emoji.
 * ------------------------------------------------------------------ */

const AlertIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className="mt-[3px] shrink-0"
  >
    <path d="M12 4 2 21h20L12 4Z" strokeLinejoin="round" />
    <path d="M12 10v5" />
    <path d="M12 18h.01" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    className="animate-spin motion-reduce:animate-none"
  >
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);
