import {FormEvent, useEffect, useRef, useState} from 'react';
import {X, CheckCircle2} from 'lucide-react';
import {validateWaitlistEmail} from '../utils/qrMatrix';

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
  submittedEmail: string | null;
  onSuccess: (email: string) => void;
}

export function WaitlistModal({
  open,
  onClose,
  submittedEmail,
  onSuccess,
}: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateWaitlistEmail(email);
    if (!result.valid) {
      setError(result.error ?? 'Invalid email address.');
      return;
    }
    setError(null);
    onSuccess(result.normalizedEmail);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#14111A] p-7 text-[#F6F3EE] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close waitlist dialog"
          className="absolute top-5 right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C98B]"
        >
          <X className="h-4 w-4" />
        </button>

        {submittedEmail ? (
          <div className="space-y-4 py-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E9C98B]/15 text-[#E9C98B]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2
              id="waitlist-modal-title"
              className="text-2xl font-bold tracking-tight text-[#F6F3EE]"
            >
              You’re on the early access list
            </h2>
            <p className="text-sm leading-relaxed text-[#B8B0C2]">
              We’ve reserved your invite for{' '}
              <span className="font-semibold text-[#F6F3EE]">
                {submittedEmail}
              </span>
              . You’ll get first access to custom ticket drops and host tools.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full cursor-pointer rounded-full bg-[#F6F3EE] px-6 py-3 text-sm font-semibold text-[#111013] transition-colors hover:bg-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-2 pr-8">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#E9C98B] uppercase">
                Early Access
              </p>
              <h2
                id="waitlist-modal-title"
                className="text-2xl font-bold tracking-tight text-[#F6F3EE]"
              >
                Join the Entriqs waitlist
              </h2>
              <p className="text-sm leading-relaxed text-[#B8B0C2]">
                Design bespoke, scannable tickets for concerts, weddings,
                owambes, and conferences in minutes.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="waitlist-email"
                className="block text-xs font-medium tracking-wide text-[#D4CEDC]"
              >
                Email address
              </label>
              <input
                ref={inputRef}
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="tolu@example.com"
                className="w-full rounded-xl border border-white/15 bg-[#0C0B10] px-4 py-3 text-sm text-[#F6F3EE] placeholder:text-white/35 focus:border-[#E9C98B] focus:outline-none"
              />
              {error && (
                <p role="alert" className="text-xs font-medium text-[#F08A7B]">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer rounded-full bg-[#F6F3EE] px-6 py-3.5 text-sm font-semibold text-[#111013] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C98B]"
            >
              Request early access
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
