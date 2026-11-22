import {useEffect} from 'react';
import {X} from 'lucide-react';
import {TicketItem} from '../data/tickets';
import {QrCode} from './QrCode';

interface TicketDetailModalProps {
  ticket: TicketItem | null;
  onClose: () => void;
  onJoinWaitlist: () => void;
}

export function TicketDetailModal({
  ticket,
  onClose,
  onJoinWaitlist,
}: TicketDetailModalProps) {
  useEffect(() => {
    if (!ticket) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ticket, onClose]);

  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-detail-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#14111A] p-7 text-[#F6F3EE] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ticket details"
          className="absolute top-5 right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C98B]"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#E9C98B] uppercase">
          {ticket.kicker}
        </p>
        <h2
          id="ticket-detail-title"
          className="mt-2 pr-8 text-2xl font-bold tracking-tight text-[#F6F3EE]"
        >
          {ticket.titleLines.join(' ')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#B8B0C2]">
          {ticket.description}
        </p>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-[#0C0B10] p-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.14em] text-[#9A92A6] uppercase">
              {ticket.stubLabel} · {ticket.venue}
            </p>
            <p className="text-base font-bold text-[#F6F3EE]">
              {ticket.stubDate}
            </p>
          </div>
          <QrCode
            seed={ticket.qrSeed}
            label={ticket.titleLines.join(' ')}
            className="h-14 w-14 shrink-0"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onJoinWaitlist();
            }}
            className="flex-1 cursor-pointer rounded-full bg-[#F6F3EE] px-5 py-3 text-sm font-semibold text-[#111013] transition-colors hover:bg-white"
          >
            Create a ticket like this
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-[#D4CEDC] transition-colors hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
