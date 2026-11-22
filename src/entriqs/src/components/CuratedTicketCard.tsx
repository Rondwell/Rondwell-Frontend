import {useState} from 'react';
import {TicketItem} from '../data/tickets';
import {QrCode} from './QrCode';

interface CuratedTicketCardProps {
  ticket: TicketItem;
  onSelect: (ticket: TicketItem) => void;
}

export function CuratedTicketCard({ticket, onSelect}: CuratedTicketCardProps) {
  const [imgError, setImgError] = useState(false);

  const dividerColor =
    ticket.variant === 'gallery'
      ? '#B84A2E'
      : ticket.variant === 'vinyl'
        ? '#D4A55D'
        : ticket.variant === 'runway'
          ? '#E5E0D5'
          : ticket.variant === 'wellness'
            ? '#7A5434'
            : ticket.variant === 'motorsport'
              ? '#FF521B'
              : '#D48C62';

  const stubBg =
    ticket.variant === 'gallery'
      ? 'bg-[#E3DACB]'
      : ticket.variant === 'vinyl'
        ? 'bg-[#091812]'
        : ticket.variant === 'runway'
          ? 'bg-[#121113]'
          : ticket.variant === 'wellness'
            ? 'bg-[#E9C3A3]'
            : ticket.variant === 'motorsport'
              ? 'bg-[#131519]'
              : 'bg-[#11131C]';

  const stubLabelColor =
    ticket.variant === 'gallery'
      ? 'text-[#7C6858]'
      : ticket.variant === 'vinyl'
        ? 'text-[#9BA89B]'
        : ticket.variant === 'runway'
          ? 'text-[#A6A095]'
          : ticket.variant === 'wellness'
            ? 'text-[#765336]'
            : ticket.variant === 'motorsport'
              ? 'text-[#8F96A3]'
              : 'text-[#A87D62]';

  const stubDateColor =
    ticket.variant === 'gallery'
      ? 'text-[#241D18]'
      : ticket.variant === 'vinyl'
        ? 'text-[#F3EAD8]'
        : ticket.variant === 'runway'
          ? 'text-[#F7F4EE]'
          : ticket.variant === 'wellness'
            ? 'text-[#2A2017]'
            : ticket.variant === 'motorsport'
              ? 'text-[#FF6B3D]'
              : 'text-[#F2DFCE]';

  const qrBg =
    ticket.variant === 'gallery'
      ? '#F7F3EC'
      : ticket.variant === 'wellness'
        ? '#F8EFE4'
        : '#F4F4F4';

  return (
    <div
      className="group relative w-full transition-transform duration-200 ease-out hover:-translate-y-2"
      style={{
        transform: `translateY(${ticket.offsetY}px) rotate(${ticket.rotateDeg}deg)`,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(ticket)}
        aria-label={`${ticket.titleLines.join(' ')} — ${ticket.kicker}, ${ticket.stubDate}`}
        className="ticket-container relative block w-full cursor-pointer rounded-[6.8cqw] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C98B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0C0B10]"
      >
        <div className="relative aspect-[325/514] w-full overflow-hidden rounded-[6.8cqw] shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
          {/* Upper ticket body (78.6% height) */}
          <div className="relative h-[78.6%] w-full overflow-hidden">
            {/* 1. GALLERY: Travertine Exhibition Pass */}
            {ticket.variant === 'gallery' && (
              <div className="relative flex h-full w-full flex-col justify-between bg-[#EAE3D6] px-[7.2cqw] pt-[7cqw] pb-[4cqw]">
                <div className="flex items-center justify-between text-[#5F5246]">
                  <p className="text-[3.3cqw] font-semibold tracking-[0.16em] uppercase">
                    {ticket.kicker}
                  </p>
                  <span
                    className="font-mono text-[3.3cqw] text-[#B84A2E]"
                    aria-hidden="true"
                  >
                    +02
                  </span>
                </div>

                {/* Pill capsule sculpture window */}
                <div className="relative mx-auto my-[1.5cqw] h-[66cqw] w-[48cqw] overflow-hidden rounded-full border border-[#B84A2E]/35 bg-[#D4C7B4] shadow-inner">
                  {!imgError ? (
                    <img
                      src="/src/assets/images/gallery_ceramic_vessel_1794936139593.jpg"
                      alt="Sculpted terracotta ceramic vessel in warm gallery sunlight"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-b from-[#D4A78B] to-[#8C452D]" />
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-serif text-[13cqw] leading-[0.86] font-semibold tracking-[-0.02em] text-[#241D18]">
                      {ticket.titleLines[0]}
                    </span>
                    <span className="font-serif text-[13.5cqw] leading-[0.9] font-normal italic tracking-[-0.01em] text-[#B84A2E]">
                      {ticket.titleLines[1]}
                    </span>
                  </div>
                  <span className="font-mono text-[3.1cqw] tracking-[0.08em] text-[#6E5F52] uppercase">
                    NO. 041
                  </span>
                </div>
              </div>
            )}

            {/* 2. VINYL: Deep Emerald Sleeve + Grooved Spinning LP */}
            {ticket.variant === 'vinyl' && (
              <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0E221B] px-[7.2cqw] pt-[7cqw] pb-[4.2cqw]">
                {/* Half-emerging grooved vinyl LP */}
                <div
                  className="pointer-events-none absolute top-[18cqw] -right-[26cqw] h-[64cqw] w-[64cqw] rounded-full border border-[#D4A55D]/30 shadow-[0_12px_30px_rgba(0,0,0,0.65)] transition-transform duration-500 ease-out group-hover:rotate-45"
                  style={{
                    background:
                      'repeating-radial-gradient(circle at center, #111315 0px, #111315 2px, #25282C 2.5px, #111315 4px)',
                  }}
                  aria-hidden="true"
                >
                  {/* Warm amber center LP label */}
                  <div className="absolute inset-0 m-auto flex h-[22cqw] w-[22cqw] items-center justify-center rounded-full border border-[#F5D399]/40 bg-[#E29D48]">
                    <div className="h-[3.2cqw] w-[3.2cqw] rounded-full bg-[#0E221B]" />
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <p className="text-[3.3cqw] font-medium tracking-[0.16em] text-[#D4A55D] uppercase">
                    {ticket.kicker}
                  </p>
                </div>

                <div className="relative z-10 my-auto max-w-[66%]">
                  <span className="inline-block border-b border-[#D4A55D]/40 pb-[1.5cqw] font-mono text-[3cqw] tracking-[0.14em] text-[#A2B6AC] uppercase">
                    HI-FI STEREO
                  </span>
                </div>

                <div className="relative z-10 flex flex-col">
                  <span className="font-sans text-[13.6cqw] leading-[0.9] font-extrabold tracking-[-0.03em] text-[#F3EAD8] uppercase">
                    {ticket.titleLines[0]}
                  </span>
                  <span className="font-sans text-[13.6cqw] leading-[0.92] font-extrabold tracking-[-0.03em] text-[#E29D48] uppercase">
                    {ticket.titleLines[1]}
                  </span>
                </div>
              </div>
            )}

            {/* 3. RUNWAY: Split Alabaster Spine + B&W Runway Editorial */}
            {ticket.variant === 'runway' && (
              <div className="relative flex h-full w-full bg-[#121113]">
                {/* Left alabaster vertical spine */}
                <div className="relative z-10 flex h-full w-[24%] shrink-0 flex-col items-center justify-between bg-[#F7F4EE] py-[6.5cqw] text-[#121113]">
                  <span className="font-mono text-[3.1cqw] font-bold tracking-[0.14em]">
                    AW26
                  </span>
                  <span
                    className="whitespace-nowrap font-sans text-[3.4cqw] font-semibold tracking-[0.22em] uppercase"
                    style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}
                  >
                    {ticket.kicker}
                  </span>
                  <span className="h-[2.2cqw] w-[2.2cqw] rounded-full bg-[#121113]" />
                </div>

                {/* Right monochrome editorial runway photo */}
                <div className="relative flex h-full flex-1 flex-col justify-end overflow-hidden p-[6cqw]">
                  {!imgError ? (
                    <img
                      src="/src/assets/images/runway_fashion_editorial_1794936138910.jpg"
                      alt="Monochrome high-fashion runway silhouette under overhead spotlight"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 to-black" />
                  )}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(12,11,13,0.92) 0%, rgba(12,11,13,0.5) 55%, rgba(12,11,13,0) 100%)',
                    }}
                  />
                  <div className="relative z-10 flex flex-col">
                    <span className="font-serif text-[13.5cqw] leading-[0.86] font-normal italic tracking-[-0.01em] text-[#F7F4EE]">
                      {ticket.titleLines[0]}
                    </span>
                    <span className="font-sans text-[11.2cqw] leading-[0.95] font-extrabold tracking-[-0.025em] text-white uppercase">
                      {ticket.titleLines[1]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. WELLNESS: Mist-Sage & Apricot Sunrise Sanctuary */}
            {ticket.variant === 'wellness' && (
              <div
                className="relative flex h-full w-full flex-col justify-between px-[7.2cqw] pt-[7cqw] pb-[4.2cqw]"
                style={{
                  background:
                    'linear-gradient(165deg, #DCE6DA 0%, #F4DFCC 52%, #EBBF9B 100%)',
                }}
              >
                <p className="relative z-10 text-center text-[3.3cqw] font-medium tracking-[0.18em] text-[#5D4834] uppercase">
                  {ticket.kicker}
                </p>

                {/* Concentric solar-dial SVG */}
                <div className="relative z-10 mx-auto my-auto flex h-[54cqw] w-[54cqw] items-center justify-center">
                  <svg
                    viewBox="0 0 160 160"
                    className="h-full w-full"
                    aria-hidden="true"
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r="74"
                      fill="none"
                      stroke="#7A5434"
                      strokeWidth="1"
                      strokeOpacity="0.35"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="none"
                      stroke="#7A5434"
                      strokeWidth="1"
                      strokeDasharray="3 4"
                      strokeOpacity="0.55"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="32"
                      fill="url(#sunGrad)"
                    />
                    <line
                      x1="12"
                      y1="98"
                      x2="148"
                      y2="98"
                      stroke="#7A5434"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    <defs>
                      <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E68A4D" />
                        <stop offset="100%" stopColor="#F5C69C" stopOpacity="0.25" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="font-serif text-[14.2cqw] leading-[0.88] font-normal italic tracking-[-0.01em] text-[#2B2017]">
                    {ticket.titleLines[0]}
                  </span>
                  <span className="font-serif text-[14.2cqw] leading-[0.88] font-normal tracking-[-0.01em] text-[#6B4527]">
                    {ticket.titleLines[1]}
                  </span>
                </div>
              </div>
            )}

            {/* 5. MOTORSPORT: Brushed Titanium + Signal-Orange Night GP */}
            {ticket.variant === 'motorsport' && (
              <div
                className="relative flex h-full w-full flex-col justify-between px-[7.2cqw] pt-[7cqw] pb-[4.2cqw]"
                style={{
                  background:
                    'linear-gradient(155deg, #24272E 0%, #17191E 55%, #121418 100%)',
                }}
              >
                {/* Signal orange top-right corner accent */}
                <div
                  className="pointer-events-none absolute top-0 right-0 h-[15cqw] w-[15cqw] bg-[#FF521B]"
                  style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%)'}}
                  aria-hidden="true"
                />

                <div className="relative z-10 flex items-center justify-between pr-[8cqw]">
                  <p className="text-[3.2cqw] font-semibold tracking-[0.16em] text-[#B8BEC9] uppercase">
                    {ticket.kicker}
                  </p>
                </div>

                {/* Chamfered track telemetry visor */}
                <div
                  className="relative my-[1.5cqw] h-[54cqw] w-full overflow-hidden border border-white/15 bg-black"
                  style={{
                    clipPath:
                      'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
                  }}
                >
                  {!imgError ? (
                    <img
                      src="/src/assets/images/night_circuit_motorsport_1794936140507.jpg"
                      alt="Illuminated night motorsport pit lane and tail-light streaks"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-black to-[#FF521B]/40" />
                  )}
                  <div className="absolute top-[3cqw] left-[3.5cqw] flex items-center gap-[1.8cqw] bg-black/75 px-[2.4cqw] py-[1cqw] font-mono text-[2.9cqw] tracking-[0.12em] text-[#FF6B3D] uppercase">
                    <span>LAP 24</span>
                    <span>·</span>
                    <span>FLOODLIT</span>
                  </div>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="font-sans text-[13.5cqw] leading-[0.88] font-extrabold tracking-[-0.03em] text-white uppercase">
                      {ticket.titleLines[0]}
                    </span>
                    <span className="font-sans text-[12.2cqw] leading-[0.94] font-extrabold tracking-[-0.03em] text-[#FF521B] uppercase">
                      {ticket.titleLines[1]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CULINARY: Charred Indigo & Copper Foil Supper Club */}
            {ticket.variant === 'culinary' && (
              <div className="relative flex h-full w-full flex-col justify-between bg-[#151822] px-[7.2cqw] pt-[7cqw] pb-[4.2cqw]">
                {/* Double copper menu hairline border */}
                <div
                  className="pointer-events-none absolute inset-[3.5cqw] border border-[#D48C62]/30"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex items-center justify-between px-[1.5cqw]">
                  <p className="text-[3.1cqw] font-medium tracking-[0.16em] text-[#D48C62] uppercase">
                    {ticket.kicker}
                  </p>
                  <span className="font-serif text-[3.4cqw] italic text-[#A98B77]">
                    I–VII
                  </span>
                </div>

                {/* Octagonal chamfered dish vignette */}
                <div
                  className="relative mx-auto my-[1.5cqw] h-[54cqw] w-[62cqw] overflow-hidden bg-[#1D1714]"
                  style={{
                    clipPath:
                      'polygon(14% 0%, 86% 0%, 100% 16%, 100% 84%, 86% 100%, 14% 100%, 0% 84%, 0% 16%)',
                  }}
                >
                  {!imgError ? (
                    <img
                      src="/src/assets/images/supper_club_culinary_1794936141000.jpg"
                      alt="Candlelit open-fire coastal dish on dark stoneware plate"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-b from-[#3A2218] to-[#120F12]" />
                  )}
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="font-serif text-[13.5cqw] leading-[0.86] font-normal italic tracking-[-0.01em] text-[#F5E4D3]">
                    {ticket.titleLines[0]}
                  </span>
                  <span className="font-serif text-[13.5cqw] leading-[0.9] font-normal tracking-[0.02em] text-[#D48C62]">
                    {ticket.titleLines[1]}
                  </span>
                </div>
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
                className={`text-[3.3cqw] font-medium tracking-[0.13em] uppercase ${stubLabelColor}`}
              >
                {ticket.stubLabel}
              </span>
              <span
                className={`text-[4.4cqw] leading-tight font-bold tracking-[-0.01em] ${stubDateColor}`}
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

        {/* Left and right circular punch notches */}
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
