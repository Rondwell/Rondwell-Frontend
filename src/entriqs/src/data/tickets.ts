export type TicketVariant =
  | 'owambe'
  | 'concert'
  | 'comedy'
  | 'conference'
  | 'wedding'
  | 'gallery'
  | 'vinyl'
  | 'runway'
  | 'wellness'
  | 'motorsport'
  | 'culinary';

export interface TicketItem {
  id: string;
  variant: TicketVariant;
  kicker: string;
  titleLines: string[];
  stubLabel: string;
  stubDate: string;
  venue: string;
  description: string;
  qrSeed: string;
  rotateDeg: number;
  offsetY: number;
}

export const TICKETS: TicketItem[] = [
  {
    id: 'mama-tolu-at-60',
    variant: 'owambe',
    kicker: 'AN OWAMBE · IKEJA',
    titleLines: ['Mama', 'Tolu', 'at 60'],
    stubLabel: 'SATURDAY',
    stubDate: '14 December',
    venue: 'Ikeja, Lagos',
    description:
      'Diamond jubilee celebration featuring live juju percussion, curated dining, and VIP table passes.',
    qrSeed: 'entriqs-mama-tolu-60-ikeja',
    rotateDeg: -3.6,
    offsetY: 16,
  },
  {
    id: 'lagos-live',
    variant: 'concert',
    kicker: 'AFROBEATS ALL NIGHT',
    titleLines: ['LAGOS', 'LIVE'],
    stubLabel: 'EKO · DOORS 8PM',
    stubDate: 'Fri 20 Dec',
    venue: 'Eko Convention Centre, Lagos',
    description:
      'Late-night Afrobeats showcase with full live band sets, horns, and acoustic sessions till dawn.',
    qrSeed: 'entriqs-lagos-live-eko-8pm',
    rotateDeg: -2.0,
    offsetY: -1,
  },
  {
    id: 'laugh-till-dawn',
    variant: 'comedy',
    kicker: 'STAND-UP · YABA',
    titleLines: ['LAUGH', 'TILL', 'DAWN'],
    stubLabel: 'SUNDAY',
    stubDate: '22 December',
    venue: 'Terra Stage, Yaba',
    description:
      'Uncensored stand-up marathon bringing Nigeria’s sharpest headliners and rising voices to one mic.',
    qrSeed: 'entriqs-laugh-till-dawn-yaba',
    rotateDeg: 0.8,
    offsetY: -12,
  },
  {
    id: 'lagos-build-26',
    variant: 'conference',
    kicker: 'TECH CONFERENCE',
    titleLines: ['lagos', '.build', '/26'],
    stubLabel: 'DAY PASS',
    stubDate: '16 Jan · Yaba',
    venue: 'Yaba Tech Hub, Lagos',
    description:
      'Full-day engineering, design systems, and product architecture conference for builders across West Africa.',
    qrSeed: 'entriqs-lagos-build-26-yaba',
    rotateDeg: 2.3,
    offsetY: -1,
  },
  {
    id: 'tolu-and-kemi',
    variant: 'wedding',
    kicker: "YOU'RE INVITED",
    titleLines: ['Tolu & Kemi'],
    stubLabel: 'RECEPTION',
    stubDate: '12 · 12 · 2026',
    venue: 'Victoria Island, Lagos',
    description:
      'Formal wedding reception pass with digital seat assignment, valet code, and evening dinner menu.',
    qrSeed: 'entriqs-tolu-kemi-121226',
    rotateDeg: 3.6,
    offsetY: 16,
  },
];

export const CURATED_TICKETS: TicketItem[] = [
  {
    id: 'form-and-clay',
    variant: 'gallery',
    kicker: 'PRIVATE VIEW · VI',
    titleLines: ['FORM', '& CLAY'],
    stubLabel: 'GALLERY 02',
    stubDate: '08 Nov · 6PM',
    venue: 'Kó Art Space, Victoria Island',
    description:
      'Opening night private walkthrough of hand-coiled stoneware and architectural terracotta sculptures with curator talk.',
    qrSeed: 'entriqs-form-clay-gallery-02',
    rotateDeg: -2.4,
    offsetY: 10,
  },
  {
    id: 'sounds-of-ikoyi',
    variant: 'vinyl',
    kicker: 'VINYL SESSION · IKOYI',
    titleLines: ['SOUNDS', 'OF IKOYI'],
    stubLabel: '33⅓ RPM · SIDE A',
    stubDate: '19 Nov · 9PM',
    venue: 'Milverton Listening Room, Ikoyi',
    description:
      'Intimate audiophile listening session spinning rare 1970s highlife pressings and deep Lagos jazz on tube amplifiers.',
    qrSeed: 'entriqs-sounds-of-ikoyi-lp',
    rotateDeg: 1.7,
    offsetY: -8,
  },
  {
    id: 'lagos-runway-26',
    variant: 'runway',
    kicker: 'FRONT ROW · AW26',
    titleLines: ['LAGOS', 'RUNWAY'],
    stubLabel: 'ROW A · SEAT 04',
    stubDate: '28 Nov · 7PM',
    venue: 'Federal Palace Pavilion, Lagos',
    description:
      'Front-row editorial seating for the Autumn/Winter architectural tailoring showcase with backstage atelier access.',
    qrSeed: 'entriqs-lagos-runway-aw26',
    rotateDeg: -1.3,
    offsetY: 6,
  },
  {
    id: 'solstice-breath',
    variant: 'wellness',
    kicker: 'DAWN SESSION · LEKKI',
    titleLines: ['Solstice', 'Breath'],
    stubLabel: 'SUNRISE DECK',
    stubDate: '06 Dec · 6:15AM',
    venue: 'The Rooftop Sanctuary, Lekki',
    description:
      'Guided dawn breathwork, crystal bowl sound bath, and ceremonial iced matcha overlooking the Atlantic horizon.',
    qrSeed: 'entriqs-solstice-breath-lekki',
    rotateDeg: 1.9,
    offsetY: -6,
  },
  {
    id: 'eko-night-gp',
    variant: 'motorsport',
    kicker: 'PADDOCK PASS · MARINA',
    titleLines: ['EKO', 'NIGHT GP'],
    stubLabel: 'SECTOR 01 · PIT',
    stubDate: '14 Dec · 10PM',
    venue: 'Marina Waterfront Circuit, Lagos',
    description:
      'All-access pit lane and floodlit grandstand pass for the midnight endurance street circuit championship finals.',
    qrSeed: 'entriqs-eko-night-gp-paddock',
    rotateDeg: -1.8,
    offsetY: 10,
  },
  {
    id: 'fire-and-palm',
    variant: 'culinary',
    kicker: "CHEF'S TABLE · VII",
    titleLines: ['Fire &', 'Palm'],
    stubLabel: 'SECOND SEATING',
    stubDate: '21 Dec · 7:30PM',
    venue: 'Alara Courtyard, Lagos',
    description:
      'Seven-course open-flame coastal tasting menu paired with small-batch palm infusions under candlelight.',
    qrSeed: 'entriqs-fire-and-palm-vii',
    rotateDeg: 2.5,
    offsetY: -4,
  },
];
