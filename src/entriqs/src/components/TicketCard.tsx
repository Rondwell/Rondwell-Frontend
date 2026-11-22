import {useState} from 'react';
import {TicketItem} from '../data/tickets';
import {QrCode} from './QrCode';

interface TicketCardProps {
  ticket: TicketItem;
  onSelect: (ticket: TicketItem) => void;
  disableTiltOnMobile?: boolean;
}

export function TicketCard({
  ticket,
  onSelect,
  disableTiltOnMobile = false,
}: TicketCardProps) {
  const [imgError, setImgError] = useState(false);

  const dividerColor =
    ticket.variant === 'owambe'
      ? '#DFBE8F'
      : ticket.variant === 'concert'
        ? '#D47D5B'
        : ticket.variant === 'comedy'
          ? '#1E1B08'
          : ticket.variant === 'conference'
            ? '#2446A6'
            : '#A68754';

  const stubBg =
    ticket.variant === 'owambe'
      ? 'bg-[#4F1625]'
      : ticket.variant === 'concert'
        ? 'bg-[#100D0D]'
        : ticket.variant === 'comedy'
          ? 'bg-[#F5D90A]'
          : ticket.variant === 'conference'
            ? 'bg-[#ECEFF6]'
            : 'bg-[#F6EFE2]';

  const stubLabelColor =
    ticket.variant === 'owambe'
      ? 'text-[#C89D7C]'
      : ticket.variant === 'concert'
        ? 'text-[#A87B64]'
        : ticket.variant === 'comedy'
          ? 'text-[#5B5212]'
          : ticket.variant === 'conference'
            ? 'text-[#5E6D8C]'
            : 'text-[#9A805A]';

  const stubDateColor =
    ticket.variant === 'owambe'
      ? 'text-[#DFBE8F]'
      : ticket.variant === 'concert'
        ? 'text-[#D88A6C]'
        : ticket.variant === 'comedy'
          ? 'text-[#12110A]'
          : ticket.variant === 'conference'
            ? 'text-[#1A2A5A]'
            : 'text-[#8A6A3A]';

  const qrBg =
    ticket.variant === 'owambe'
      ? '#F4EFE8'
      : ticket.variant === 'comedy'
        ? '#F2EFE6'
        : '#F4F4F4';

  return (
    <div
      className={`group relative w-full transition-transform duration-200 ease-out hover:-translate-y-1.5 ${
        disableTiltOnMobile ? '' : ''
      }`}
      style={{
        transform: `translateY(${ticket.offsetY}px) rotate(${ticket.rotateDeg}deg)`,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(ticket)}
        aria-label={`${ticket.titleLines.join(' ')} — ${ticket.kicker}, ${ticket.stubDate}`}
        className="ticket-container relative block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C98B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0C0B10] rounded-[6.8cqw]"
      >
        <div className="relative aspect-[325/514] w-full overflow-hidden rounded-[6.8cqw] shadow-[0_24px_48px_rgba(0,0,0,0.48)]">
          {/* Upper ticket body (78.6% height) */}
          <div className="relative h-[78.6%] w-full overflow-hidden">
            {ticket.variant === 'owambe' && (
              <div className="ticket-lattice flex h-full w-full flex-col justify-between px-[7.4cqw] pt-[7.2cqw] pb-[3.2cqw]">
                <p className="text-[3.5cqw] font-medium tracking-[0.16em] text-[#DFBE8F] uppercase">
                  {ticket.kicker}
                </p>
                <div className="flex flex-col">
                  <span className="font-serif text-[18cqw] leading-[0.87] font-normal italic tracking-[-0.01em] text-[#F5E6CD]">
                    {ticket.titleLines[0]}
                  </span>
                  <span className="font-serif text-[18cqw] leading-[0.87] font-normal italic tracking-[-0.01em] text-[#F5E6CD]">
                    {ticket.titleLines[1]}
                  </span>
                  <span className="mt-[0.6cqw] font-serif text-[27cqw] leading-[0.85] font-normal tracking-[-0.025em] text-[#DFB877]">
                    {ticket.titleLines[2]}
                  </span>
                </div>
              </div>
            )}

            {ticket.variant === 'concert' && (
              <div className="relative flex h-full w-full flex-col justify-between bg-[#100D0D] px-[7.4cqw] pt-[7.2cqw] pb-[5.2cqw]">
                {!imgError ? (
                  <img
                    src="/assets/card2-concert.png"
                    alt="Afrobeats live guitarist performing on stage"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6B2B23] via-[#2B1210] to-[#100D0D]" />
                )}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%]"
                  style={{
                    background:
                      'linear-gradient(to top, #100D0D 0%, rgba(16,13,13,0.72) 36%, rgba(16,13,13,0) 100%)',
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[24%]"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(16,13,13,0.45) 0%, rgba(16,13,13,0) 100%)',
                  }}
                />
                <p className="relative z-10 text-[3.5cqw] font-medium tracking-[0.16em] text-[#F8F4EE] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)]">
                  {ticket.kicker}
                </p>
                <div className="relative z-10 flex flex-col">
                  {ticket.titleLines.map((line) => (
                    <span
                      key={line}
                      className="font-sans text-[17.5cqw] leading-[0.88] font-extrabold tracking-[-0.03em] text-white uppercase"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ticket.variant === 'comedy' && (
              <div className="relative flex h-full w-full flex-col justify-between bg-[#F5D90A] px-[7.4cqw] pt-[7.2cqw] pb-[4.2cqw]">
                <p className="relative z-10 text-[3.5cqw] font-medium tracking-[0.16em] text-[#262205] uppercase">
                  {ticket.kicker}
                </p>
                <div className="pointer-events-none absolute top-[14.2cqw] left-[45.5cqw] h-[63cqw] w-[63cqw] overflow-hidden rounded-full border-[0.75cqw] border-[#1D1A06] bg-[#1D1A06]">
                  {!imgError ? (
                    <img
                      src="/assets/card3-mic.png"
                      alt="Stage stand-up microphone under spotlight beams"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-full w-full scale-[1.09] object-cover object-left"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-neutral-900 to-neutral-600" />
                  )}
                </div>
                <div className="relative z-10 flex flex-col">
                  {ticket.titleLines.map((line) => (
                    <span
                      key={line}
                      className="font-sans text-[15.2cqw] leading-[0.9] font-bold tracking-[-0.04em] text-[#141309]"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ticket.variant === 'conference' && (
              <div className="ticket-graph-grid flex h-full w-full flex-col justify-between px-[7.4cqw] pt-[7.2cqw] pb-[4.4cqw]">
                <p className="text-[3.5cqw] font-medium tracking-[0.16em] text-[#3D4E7B] uppercase">
                  {ticket.kicker}
                </p>
                <div className="flex flex-col">
                  {ticket.titleLines.map((line) => (
                    <span
                      key={line}
                      className="font-mono text-[12.8cqw] leading-[1.06] font-semibold tracking-[-0.03em] text-[#2355F5]"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ticket.variant === 'wedding' && (
              <div className="flex h-full w-full flex-col items-center justify-between bg-[#F6EFE2] px-[7.4cqw] pt-[6.8cqw] pb-[4.2cqw]">
                <p className="text-center text-[3.4cqw] font-medium tracking-[0.2em] text-[#8B7048] uppercase">
                  {ticket.kicker}
                </p>
                <div className="mt-[1.5cqw] h-[72cqw] w-[57.5cqw] overflow-hidden rounded-t-full bg-[#1C2C1F]">
                  {!imgError ? (
                    <img
                      src="/assets/card5-wedding.png"
                      alt="Bride and groom standing together outdoors"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-full w-full scale-[1.03] object-cover object-center"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-b from-[#253B29] to-[#162219]" />
                  )}
                </div>
                <p className="mt-[2cqw] text-center font-serif text-[11.2cqw] leading-none font-normal italic tracking-[-0.01em] text-[#2D251B]">
                  {ticket.titleLines[0]}
                </p>
              </div>
            )}
          </div>

          {/* Perforated dashed tear-off divider */}
          <div
            className="pointer-events-none absolute right-[4.5cqw] bottom-[21.4%] left-[4.5cqw] z-20 h-[0.65cqw]"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${dividerColor} 0, ${dividerColor} 1.6cqw, transparent 1.6cqw, transparent 3.1cqw)`,
            }}
            aria-hidden="true"
          />

          {/* Bottom stub (21.4% height) */}
          <div
            className={`flex h-[21.4%] w-full items-center justify-between px-[7.4cqw] ${stubBg}`}
          >
            <div className="flex flex-col gap-[1.1cqw]">
              <span
                className={`text-[3.35cqw] font-medium tracking-[0.14em] uppercase ${stubLabelColor}`}
              >
                {ticket.stubLabel}
              </span>
              <span
                className={`text-[4.55cqw] leading-tight font-bold tracking-[-0.01em] ${stubDateColor}`}
              >
                {ticket.stubDate}
              </span>
            </div>
            <QrCode
              seed={ticket.qrSeed}
              label={ticket.titleLines.join(' ')}
              bgColor={qrBg}
              className="h-[18.2cqw] w-[18.2cqw] shrink-0"
            />
          </div>
        </div>

        {/* Left and right circular punch notches centered on the tear line */}
        <span
          className="pointer-events-none absolute bottom-[21.4%] -left-[3.4cqw] z-30 h-[6.8cqw] w-[6.8cqw] translate-y-1/2 rounded-full bg-[#050507]"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -right-[3.4cqw] bottom-[21.4%] z-30 h-[6.8cqw] w-[6.8cqw] translate-y-1/2 rounded-full bg-[#050507]"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
