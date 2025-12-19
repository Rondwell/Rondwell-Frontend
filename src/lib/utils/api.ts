0// src/lib/utils/api.ts

// ------------------------------------------------------------------
// 1. TYPES
// ------------------------------------------------------------------

export type Event = {
  id: string;
  title: string;
  host: string;
  location: string;
  image?: string;
  date: string;
  totalSeats: number;
  reservedSeats: number;
  price: number;
  tags: string[];
  status: 'active' | 'sold_out' | 'cancelled';
  description?: string;
};

export type Collection = {
  id: string;
  title: string;
  description?: string;
  events: string[];
};

export type VendorBooking = {
  id: string;
  eventName: string;
  booth: string;
  status: 'confirmed' | 'pending';
};

export type BookingDetail = VendorBooking & {
  contribution: number;
  paymentStatus: 'paid' | 'unpaid';
  supplies: { id: string; name: string; quantity: number }[];
  team: { id: string; name: string; role: string }[];
  documents: { name: string; status: 'uploaded' | 'missing' }[];
};

// ------------------------------------------------------------------
// 2. MOCK DATA (Must define this BEFORE the api object uses it)
// ------------------------------------------------------------------

const sleep = (ms = 300) => new Promise(res => setTimeout(res, ms));

let eventsDb: Record<string, Event> = {
  'e1': { 
    id: 'e1', 
    title: "Geegpay's Geegs & Groove", 
    host: "By Cynthia Orji", 
    location: "Lagos", 
    date: "Jun 28, 12:00 PM", 
    totalSeats: 200, 
    reservedSeats: 200, 
    price: 0, 
    tags: ["Featured", "Tech"], 
    status: 'sold_out',
    description: "Join us for the biggest fintech gathering in Lagos."
  },
  'e2': { 
    id: 'e2', 
    title: "Tech Creatives Meetup", 
    host: "By Femi Johnson", 
    location: "Zoom", 
    date: "Jul 05, 4:00 PM", 
    totalSeats: 500, 
    reservedSeats: 120, 
    price: 5000, 
    tags: ["Featured", "Virtual"], 
    status: 'active',
    description: "A virtual workshop for designers and developers."
  },
};

let collectionsDb: Record<string, Collection> = {
  'c1': { id: 'c1', title: 'Summer Tech Series', description: 'All the hottest tech events in Lagos.', events: ['e1', 'e2'] },
};

const bookingDetailsDb: Record<string, BookingDetail> = {
  'b1': {
    id: 'b1',
    eventName: "Geegpay's Geegs & Groove",
    booth: 'A12',
    status: 'confirmed',
    contribution: 50000,
    paymentStatus: 'paid',
    supplies: [
      { id: 's1', name: 'Exhibition Table (6ft)', quantity: 1 },
      { id: 's2', name: 'Power Outlet', quantity: 1 }
    ],
    team: [
      { id: 't1', name: 'John Doe', role: 'Booth Manager' }
    ],
    documents: [
      { name: 'Insurance Certificate', status: 'uploaded' },
      { name: 'Fire Safety Form', status: 'missing' }
    ]
  },
  'b2': {
    id: 'b2',
    eventName: "Tech Creatives Meetup",
    booth: 'Virtual-04',
    status: 'pending',
    contribution: 15000,
    paymentStatus: 'unpaid',
    supplies: [],
    team: [],
    documents: []
  }
};

// ------------------------------------------------------------------
// 3. API OBJECT (Defined LAST, so it can see the data above)
// ------------------------------------------------------------------

export const api = {
  // Events
  async getEvent(id: string) {
    await sleep();
    const e = eventsDb[id];
    if (!e) throw new Error('Event not found');
    return structuredClone(e);
  },

  async registerSeats(eventId: string, count: number) {
    await sleep();
    const e = eventsDb[eventId];
    if (!e) throw new Error('Event not found');
    if (e.status === 'sold_out' || e.reservedSeats + count > e.totalSeats) {
      return { ok: false, error: 'Event is sold out' } as const;
    }
    e.reservedSeats += count;
    if (e.reservedSeats >= e.totalSeats) e.status = 'sold_out';
    return { ok: true, event: structuredClone(e) } as const;
  },

  // Collections
  async listCollections() {
    await sleep();
    return Object.values(collectionsDb).map(c => structuredClone(c));
  },

  async getCollection(id: string) {
    await sleep();
    const c = collectionsDb[id];
    if (!c) throw new Error('Collection not found');
    const hydratedEvents = c.events.map(eid => eventsDb[eid]).filter(Boolean);
    return { ...structuredClone(c), hydratedEvents };
  },

  async createCollection(payload: { title: string; description?: string }) {
    await sleep();
    const id = `c${Date.now()}`;
    const newC: Collection = { id, title: payload.title, description: payload.description, events: [] };
    collectionsDb[id] = newC;
    return structuredClone(newC);
  },

  // Vendor
  async getVendorBookings() {
    await sleep();
    return Object.values(bookingDetailsDb).map(b => ({
      id: b.id,
      eventName: b.eventName,
      booth: b.booth,
      status: b.status
    }));
  },

  async getBookingDetail(id: string) {
    await sleep();
    const b = bookingDetailsDb[id];
    if (!b) throw new Error('Booking not found');
    return structuredClone(b);
  },

  async updateLogistics(bookingId: string, supplies: any[]) {
    await sleep();
    if (bookingDetailsDb[bookingId]) {
      bookingDetailsDb[bookingId].supplies = supplies;
    }
    return true;
  }
};