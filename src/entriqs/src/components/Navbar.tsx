interface NavbarProps {
  onOpenWaitlist: () => void;
  waitlistJoined: boolean;
}

export function Navbar({onOpenWaitlist, waitlistJoined}: NavbarProps) {
  return (
    <header className="relative z-20 w-full border-b border-white/[0.06] bg-gradient-to-r from-[#110C1A]/90 via-[#151020]/85 to-[#0D0B10]/95">
      <div className="mx-auto flex h-[76px] w-full max-w-[1920px] items-center justify-between px-5 sm:h-[88px] sm:px-10 lg:h-[100px] lg:px-[5.75%]">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-3 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C98B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0B10] rounded-lg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F6F3EE] text-[15px] font-extrabold tracking-[-0.04em] text-[#111013] sm:h-11 sm:w-11 sm:rounded-[11px] sm:text-[17px]">
            EN
          </span>
          <span className="text-[19px] font-bold tracking-[-0.025em] text-[#F6F3EE] sm:text-[22px]">
            Entriqs
          </span>
        </a>

        <div
          className="hidden items-center gap-2.5 rounded-full border border-[#E9C98B]/20 bg-[#191616]/90 px-5 py-2.5 sm:flex"
          aria-label="Release phase: Early Access"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-[#E9C98B]"
            aria-hidden="true"
          />
          <span className="whitespace-nowrap text-[12px] font-semibold tracking-[0.15em] text-[#BDB197] uppercase">
            EARLY ACCESS
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenWaitlist}
          className="shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-[#F6F3EE] px-5 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-[#111013] transition-transform duration-150 ease-out hover:bg-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C98B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0B10] sm:px-7 sm:py-3.5 sm:text-[15.5px]"
        >
          {waitlistJoined ? 'Waitlist joined' : 'Join the waitlist'}
        </button>
      </div>
    </header>
  );
}
