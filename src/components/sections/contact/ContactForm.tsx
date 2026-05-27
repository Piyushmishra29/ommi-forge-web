'use client';

import { useState } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { z } from 'zod';
import { cn } from '@/lib/cn';

/**
 * Contact form — react-hook-form + zod, floating-label styling, and a
 * success-state morph that swaps the form for a graphite slab on
 * submit. There's no real backend; submitting just validates and
 * flips the local state.
 */
const ContactSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.email('Enter a valid email'),
  phone: z
    .string()
    .min(6, 'Enter a valid phone')
    .regex(/^[+0-9 ()-]+$/u, 'Digits, spaces and +/-/() only'),
  message: z.string().min(10, 'Tell us a little more (10+ characters)'),
});

type ContactValues = z.infer<typeof ContactSchema>;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  async function onSubmit() {
    // No real network call — feign latency, then morph to success state.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
  }

  function handleReset() {
    reset();
    setSubmitted(false);
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            <FloatingField
              label="First name"
              type="text"
              autoComplete="given-name"
              error={errors.firstName}
              registration={register('firstName')}
            />
            <FloatingField
              label="Last name"
              type="text"
              autoComplete="family-name"
              error={errors.lastName}
              registration={register('lastName')}
            />
            <FloatingField
              label="Email"
              type="email"
              autoComplete="email"
              className="md:col-span-2"
              error={errors.email}
              registration={register('email')}
            />
            <FloatingField
              label="Phone"
              type="tel"
              autoComplete="tel"
              className="md:col-span-2"
              error={errors.phone}
              registration={register('phone')}
            />
            <FloatingTextArea
              label="Message"
              className="md:col-span-2"
              error={errors.message}
              registration={register('message')}
            />

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                data-magnetic
                className="inline-flex items-center justify-center bg-saffron px-8 py-4 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-graphite transition-colors hover:bg-mesh hover:text-paper disabled:opacity-60"
              >
                {isSubmitting ? 'Sending…' : 'Send →'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            className="relative isolate min-h-[420px] overflow-hidden bg-graphite p-10 text-paper md:p-14"
            role="status"
            aria-live="polite"
          >
            <div
              aria-hidden
              className="absolute right-0 top-0 h-24 w-24 border-r-2 border-t-2 border-mesh"
            />
            <div
              aria-hidden
              className="absolute bottom-0 left-0 h-24 w-24 border-b-2 border-l-2 border-mesh"
            />
            <p className="font-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-mesh">
              Message sent
            </p>
            <h3 className="mt-6 max-w-xl font-display text-3xl font-light leading-tight text-paper md:text-5xl">
              Thanks. We&apos;ll be in touch within 2 business days.
            </h3>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-paper/70 md:text-lg">
              Our marketing desk routes inquiries to the right metallurgist or
              project lead the same morning. Expect a reply from a real human.
            </p>
            <button
              type="button"
              onClick={handleReset}
              data-magnetic
              className="mt-10 inline-flex items-center gap-2 border border-paper/30 px-6 py-3 font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:border-mesh hover:text-mesh"
            >
              Send another message ↺
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FieldProps {
  label: string;
  type?: string;
  autoComplete?: string;
  className?: string;
  error?: FieldError;
  registration: ReturnType<ReturnType<typeof useForm<ContactValues>>['register']>;
}

function FloatingField({
  label,
  type = 'text',
  autoComplete,
  className,
  error,
  registration,
}: FieldProps) {
  return (
    <div className={cn('relative', className)}>
      <input
        {...registration}
        type={type}
        id={registration.name}
        autoComplete={autoComplete}
        placeholder=" "
        className={cn(
          'peer block w-full border-0 border-b bg-transparent px-0 pb-2 pt-6 font-body text-base text-graphite outline-none transition-colors',
          'placeholder-transparent focus:border-mesh',
          error ? 'border-mesh' : 'border-graphite/25',
        )}
      />
      <label
        htmlFor={registration.name}
        className={cn(
          'pointer-events-none absolute left-0 top-6 origin-left font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-steel transition-all duration-200',
          // Floats when focused OR has value (peer:not(:placeholder-shown))
          'peer-focus:top-0 peer-focus:scale-90 peer-focus:text-mesh',
          'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90',
        )}
      >
        {label}
      </label>
      {error && (
        <p className="mt-2 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.18em] text-mesh">
          {error.message}
        </p>
      )}
    </div>
  );
}

function FloatingTextArea({
  label,
  className,
  error,
  registration,
}: Omit<FieldProps, 'type' | 'autoComplete'>) {
  return (
    <div className={cn('relative', className)}>
      <textarea
        {...registration}
        id={registration.name}
        rows={5}
        placeholder=" "
        className={cn(
          'peer block w-full resize-none border-0 border-b bg-transparent px-0 pb-2 pt-6 font-body text-base text-graphite outline-none transition-colors',
          'placeholder-transparent focus:border-mesh',
          error ? 'border-mesh' : 'border-graphite/25',
        )}
      />
      <label
        htmlFor={registration.name}
        className={cn(
          'pointer-events-none absolute left-0 top-6 origin-left font-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-steel transition-all duration-200',
          'peer-focus:top-0 peer-focus:scale-90 peer-focus:text-mesh',
          'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90',
        )}
      >
        {label}
      </label>
      {error && (
        <p className="mt-2 font-eyebrow text-[10px] font-semibold uppercase tracking-[0.18em] text-mesh">
          {error.message}
        </p>
      )}
    </div>
  );
}
