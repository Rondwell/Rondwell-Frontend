import {useState} from 'react';
import {Navbar} from './components/Navbar';
import {TicketCard} from './components/TicketCard';
import {CuratedTicketCard} from './components/CuratedTicketCard';
import {WaitlistModal} from './components/WaitlistModal';
import {TicketDetailModal} from './components/TicketDetailModal';
import {CURATED_TICKETS, TICKETS, TicketItem} from './data/tickets';

export default function App() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  return (
    <div id="top" className="min-h-screen w-full bg-[#0C0B10] text-[#F6F3EE]">
      <Navbar
        onOpenWaitlist={() => setWaitlistOpen(true)}
        waitlistJoined={Boolean(submittedEmail)}
      />

      <main className="entriqs-hero-bg relative w-full overflow-hidden">
        {/* Subtle ambient film grain matching the dark velvet canvas */}
        <div
          className="entriqs-grain pointer-events-none absolute inset-0"
          aria-hidden="true"
        />

        {/* Section 1: Exact 5-card hero showcase */}
        <section
          aria-label="Featured event tickets"
          className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-[1920px] items-center py-12 sm:min-h-[calc(100vh-88px)] sm:py-16 lg:min-h-[calc(100vh-100px)] lg:py-[5.5%]"
        >
          <div className="hidden w-full md:grid md:grid-cols-5 md:items-center md:gap-[1.5vw] md:px-[4.2%]">
            {TICKETS.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onSelect={setSelectedTicket}
              />
            ))}
          </div>

          <div className="no-scrollbar flex w-full snap-x snap-mandatory items-center gap-6 overflow-x-auto px-7 py-8 md:hidden">
            {TICKETS.map((ticket) => (
              <div
                key={ticket.id}
                className="w-[72vw] max-w-[300px] shrink-0 snap-center"
              >
                <TicketCard
                  ticket={ticket}
                  onSelect={setSelectedTicket}
                  disableTiltOnMobile
                />
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: 6 Creative Occasion Editions */}
        <section
          aria-labelledby="curated-editions-heading"
          className="relative z-10 mx-auto w-full max-w-[1920px] border-t border-white/[0.06] pt-16 pb-24 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32"
        >
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center px-5 text-center sm:mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#E9C98B] uppercase">
              Curated Editions
            </p>
            <h2
              id="curated-editions-heading"
              className="mt-3 text-balance text-3xl font-bold tracking-[-0.025em] text-[#F6F3EE] sm:text-4xl lg:text-[42px]"
            >
              Every gathering deserves its own artifact
            </h2>
          </div>

          {/* Desktop: 6-across bespoke ticket showcase; Tablet: 3x2 grid */}
          <div className="hidden w-full md:grid md:grid-cols-3 md:items-center md:gap-x-7 md:gap-y-12 md:px-[5.75%] xl:grid-cols-6 xl:gap-x-[1.3vw] xl:px-[4.2%]">
            {CURATED_TICKETS.map((ticket) => (
              <CuratedTicketCard
                key={ticket.id}
                ticket={ticket}
                onSelect={setSelectedTicket}
              />
            ))}
          </div>

          {/* Mobile: horizontal snap carousel */}
          <div className="no-scrollbar flex w-full snap-x snap-mandatory items-center gap-6 overflow-x-auto px-7 py-6 md:hidden">
            {CURATED_TICKETS.map((ticket) => (
              <div
                key={ticket.id}
                className="w-[72vw] max-w-[300px] shrink-0 snap-center"
              >
                <CuratedTicketCard
                  ticket={ticket}
                  onSelect={setSelectedTicket}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <WaitlistModal
        open={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        submittedEmail={submittedEmail}
        onSuccess={(email) => setSubmittedEmail(email)}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onJoinWaitlist={() => setWaitlistOpen(true)}
      />
    </div>
  );
}
