export const TRAINERS = [
  { name: "Camille Roux", role: "Senior Colorist", hue: 195, clients: 48, util: 92, rate: 65, mtd: 8420 },
  { name: "Yuki Tanaka", role: "Master Admin", hue: 165, clients: 41, util: 88, rate: 60, mtd: 7610 },
  { name: "Theo Bennett", role: "Barber", hue: 220, clients: 36, util: 81, rate: 55, mtd: 6240 },
  { name: "Asha Iyer", role: "Nail Artist", hue: 280, clients: 52, util: 86, rate: 50, mtd: 5980 },
  { name: "Lior Mendez", role: "Lash Specialist", hue: 330, clients: 29, util: 74, rate: 55, mtd: 4730 },
  { name: "Marta Halász", role: "Junior Admin", hue: 60, clients: 22, util: 64, rate: 45, mtd: 3120 },
] as const;

export const CLIENTS = [
  { name: "Olivia Wren", hue: 195, plan: "Studio · 8 credits/mo", credits: 6, trainer: "Camille R.", last: "3 days ago", ltv: 2840, status: "active" as const },
  { name: "Jasper Cole", hue: 220, plan: "Pay-as-you-go", credits: 2, trainer: "Theo B.", last: "Yesterday", ltv: 1120, status: "active" as const },
  { name: "Mei Lin Chen", hue: 280, plan: "Atelier · 12 credits", credits: 11, trainer: "Asha I.", last: "1 week ago", ltv: 4210, status: "active" as const },
  { name: "Hugo Bertrand", hue: 165, plan: "Studio · 8 credits/mo", credits: 0, trainer: "Yuki T.", last: "2 weeks ago", ltv: 1980, status: "low" as const },
  { name: "Priya Anand", hue: 330, plan: "Atelier · 12 credits", credits: 9, trainer: "Lior M.", last: "Today", ltv: 3460, status: "active" as const },
  { name: "Sven Andersson", hue: 60, plan: "Pay-as-you-go", credits: 0, trainer: "Camille R.", last: "1 month ago", ltv: 760, status: "lapsed" as const },
  { name: "Renata Oliveira", hue: 25, plan: "Studio · 8 credits/mo", credits: 4, trainer: "Marta H.", last: "5 days ago", ltv: 2110, status: "active" as const },
  { name: "Felix Wong", hue: 130, plan: "Atelier · 12 credits", credits: 7, trainer: "Yuki T.", last: "2 days ago", ltv: 3870, status: "active" as const },
];

export const TODAY_BOOKINGS = [
  { time: "09:00", duration: 60, client: "Olivia Wren", service: "Cut + gloss", trainer: "Camille R.", hue: 195, status: "done" as const },
  { time: "10:30", duration: 90, client: "Mei Lin Chen", service: "Balayage", trainer: "Camille R.", hue: 280, status: "done" as const },
  { time: "12:00", duration: 45, client: "Jasper Cole", service: "Beard trim", trainer: "Theo B.", hue: 220, status: "now" as const },
  { time: "13:30", duration: 60, client: "Priya Anand", service: "Lash fill", trainer: "Lior M.", hue: 330, status: "next" as const },
  { time: "15:00", duration: 75, client: "Felix Wong", service: "Cut + style", trainer: "Yuki T.", hue: 130, status: "upcoming" as const },
  { time: "16:30", duration: 60, client: "Renata Oliveira", service: "Manicure", trainer: "Asha I.", hue: 25, status: "upcoming" as const },
];

export const REVENUE_BARS = [42, 58, 51, 67, 73, 62, 78, 85, 81, 92, 88, 96];
export const REVENUE_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CALENDAR_DAYS = [
  { d: "Mon", n: 27, today: false },
  { d: "Tue", n: 28, today: true },
  { d: "Wed", n: 29, today: false },
  { d: "Thu", n: 30, today: false },
  { d: "Fri", n: 1, today: false },
  { d: "Sat", n: 2, today: false },
  { d: "Sun", n: 3, today: false },
] as const;

export const HOURS = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM"];

export type ServiceMode = "solo" | "group";

export type Service = {
  id: string;
  adminName: string;          // who offers it
  name: string;
  mode: ServiceMode;
  defaultCapacity: number;    // 1 for solo, N for group
  durationMin: number;
  credits: number;            // per attendee
  hue: number;
  description?: string;
};

export const SERVICES: Service[] = [
  // ── solo (1-on-1) ──────────────────────────────────────
  { id: "svc-cut",        adminName: "Camille Roux",   name: "Cut + gloss",       mode: "solo",  defaultCapacity: 1,  durationMin: 60, credits: 2, hue: 195 },
  { id: "svc-balayage",   adminName: "Camille Roux",   name: "Balayage",          mode: "solo",  defaultCapacity: 1,  durationMin: 90, credits: 4, hue: 195 },
  { id: "svc-color",      adminName: "Camille Roux",   name: "Color refresh",     mode: "solo",  defaultCapacity: 1,  durationMin: 90, credits: 2, hue: 195 },
  { id: "svc-beard",      adminName: "Theo Bennett",   name: "Beard trim",        mode: "solo",  defaultCapacity: 1,  durationMin: 30, credits: 1, hue: 220 },
  { id: "svc-manicure",   adminName: "Asha Iyer",      name: "Manicure",          mode: "solo",  defaultCapacity: 1,  durationMin: 60, credits: 1, hue: 280 },
  { id: "svc-lash",       adminName: "Lior Mendez",    name: "Lash fill",         mode: "solo",  defaultCapacity: 1,  durationMin: 60, credits: 2, hue: 330 },
  // ── group classes ──────────────────────────────────────
  { id: "svc-yoga",       adminName: "Yuki Tanaka",    name: "Yoga Flow",         mode: "group", defaultCapacity: 12, durationMin: 60, credits: 1, hue: 165, description: "All-levels vinyasa flow" },
  { id: "svc-pilates",    adminName: "Marta Halász",   name: "Pilates Reformer",  mode: "group", defaultCapacity: 6,  durationMin: 50, credits: 2, hue: 60,  description: "Core-focused reformer class" },
  { id: "svc-spin",       adminName: "Theo Bennett",   name: "Spin Class",        mode: "group", defaultCapacity: 16, durationMin: 45, credits: 1, hue: 220, description: "High-energy cycling" },
  { id: "svc-meditate",   adminName: "Yuki Tanaka",    name: "Mindful Meditation",mode: "group", defaultCapacity: 20, durationMin: 30, credits: 1, hue: 165, description: "Guided breathwork" },
  { id: "svc-barre",      adminName: "Marta Halász",   name: "Barre Burn",        mode: "group", defaultCapacity: 14, durationMin: 50, credits: 1, hue: 60,  description: "Sculpt + cardio fusion" },
];

// Studio open/close hours, indexed by weekday 0=Sun … 6=Sat.
export const STUDIO_HOURS = [
  { weekday: 0, open: "—",     close: "—",     closed: true },
  { weekday: 1, open: "09:00", close: "19:00", closed: false },
  { weekday: 2, open: "09:00", close: "19:00", closed: false },
  { weekday: 3, open: "09:00", close: "19:00", closed: false },
  { weekday: 4, open: "09:00", close: "19:00", closed: false },
  { weekday: 5, open: "09:00", close: "19:00", closed: false },
  { weekday: 6, open: "10:00", close: "17:00", closed: false },
] as const;

// Per-admin recurring working hours. Multiple rows per admin allowed (e.g. split shifts).
export type AvailabilityRule = {
  adminName: string;
  weekday: number;
  startHour: number;     // 24h decimal, e.g. 10.5 = 10:30
  endHour: number;
};

export const AVAILABILITY_RULES: AvailabilityRule[] = [
  // Camille — Tue–Sat 10–18
  { adminName: "Camille Roux", weekday: 2, startHour: 10, endHour: 18 },
  { adminName: "Camille Roux", weekday: 3, startHour: 10, endHour: 18 },
  { adminName: "Camille Roux", weekday: 4, startHour: 10, endHour: 18 },
  { adminName: "Camille Roux", weekday: 5, startHour: 10, endHour: 18 },
  { adminName: "Camille Roux", weekday: 6, startHour: 10, endHour: 16 },
  // Yuki — yoga teacher, early mornings + evenings
  { adminName: "Yuki Tanaka",  weekday: 1, startHour: 7,  endHour: 11 },
  { adminName: "Yuki Tanaka",  weekday: 1, startHour: 17, endHour: 20 },
  { adminName: "Yuki Tanaka",  weekday: 3, startHour: 7,  endHour: 11 },
  { adminName: "Yuki Tanaka",  weekday: 3, startHour: 17, endHour: 20 },
  { adminName: "Yuki Tanaka",  weekday: 5, startHour: 7,  endHour: 11 },
];

// One-off blocks (vacation, lunch) or extra hours (special workshop day).
export type AvailabilityException = {
  adminName: string;
  date: string;          // ISO yyyy-mm-dd
  startHour: number;
  endHour: number;
  type: "block" | "extra";
  reason: string;
};

export const AVAILABILITY_EXCEPTIONS: AvailabilityException[] = [
  { adminName: "Camille Roux", date: "2026-05-05", startHour: 0,  endHour: 24, type: "block", reason: "Vacation" },
  { adminName: "Camille Roux", date: "2026-05-06", startHour: 0,  endHour: 24, type: "block", reason: "Vacation" },
  { adminName: "Camille Roux", date: "2026-05-07", startHour: 0,  endHour: 24, type: "block", reason: "Vacation" },
];

export type CalendarEvent = {
  day: number;
  start: number;
  len: number;
  client: string;             // solo: client name. group: ignored (service used as label).
  service: string;
  hue: number;
  now?: boolean;
  closed?: boolean;
  // Group-class extensions
  mode?: ServiceMode;         // undefined → solo
  capacity?: number;          // group only
  attendees?: string[];       // group only — list of enrolled client names
};

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { day: 0, start: 0, len: 1.5, client: "L. Frost", service: "Cut + gloss", hue: 195 },
  { day: 0, start: 2, len: 1, client: "M. Petrov", service: "Beard trim", hue: 220 },
  { day: 0, start: 5, len: 2, client: "K. Naidu", service: "Balayage", hue: 280 },
  { day: 0, start: 8, len: 1, client: "S. Olsen", service: "Manicure", hue: 25 },
  { day: 1, start: 1, len: 1, client: "Olivia Wren", service: "Cut + gloss", hue: 195 },
  { day: 1, start: 2.5, len: 1.5, client: "Mei Lin Chen", service: "Balayage", hue: 280 },
  { day: 1, start: 4, len: 0.75, client: "Jasper Cole", service: "Beard trim", hue: 220, now: true },
  { day: 1, start: 5.5, len: 1, client: "Priya Anand", service: "Lash fill", hue: 330 },
  { day: 1, start: 7, len: 1.25, client: "Felix Wong", service: "Cut + style", hue: 130 },
  { day: 1, start: 8.5, len: 1, client: "R. Oliveira", service: "Manicure", hue: 25 },
  { day: 2, start: 1, len: 2.5, client: "A. Kumar", service: "Color correction", hue: 280 },
  { day: 2, start: 4, len: 1, client: "T. Schmidt", service: "Beard trim", hue: 220 },
  { day: 2, start: 6, len: 1.25, client: "N. Yamamoto", service: "Lash lift", hue: 330 },
  { day: 2, start: 8, len: 1.5, client: "C. Bauer", service: "Highlights", hue: 60 },
  { day: 3, start: 0.5, len: 1, client: "P. Lindqvist", service: "Cut", hue: 195 },
  { day: 3, start: 2, len: 1.5, client: "J. Hashimoto", service: "Pedicure", hue: 25 },
  { day: 3, start: 4.5, len: 2, client: "G. Almeida", service: "Balayage", hue: 280 },
  { day: 3, start: 7.5, len: 1, client: "D. Park", service: "Cut + style", hue: 130 },
  { day: 4, start: 1, len: 1.5, client: "I. Volkov", service: "Color + cut", hue: 280 },
  { day: 4, start: 3, len: 1, client: "B. Suzuki", service: "Beard trim", hue: 220 },
  { day: 4, start: 5, len: 1, client: "M. Costa", service: "Manicure", hue: 25 },
  { day: 4, start: 6.5, len: 1.5, client: "H. Bertrand", service: "Cut + gloss", hue: 165 },
  { day: 4, start: 8.5, len: 1, client: "V. Kapoor", service: "Lash fill", hue: 330 },
  { day: 5, start: 0.5, len: 1, client: "F. Nakamura", service: "Cut", hue: 195 },
  { day: 5, start: 2, len: 2, client: "E. Romero", service: "Highlights", hue: 60 },
  { day: 5, start: 5, len: 1.5, client: "S. Andersson", service: "Color", hue: 195 },
  { day: 5, start: 7, len: 1, client: "T. Ahmadi", service: "Manicure", hue: 25 },
  { day: 6, start: 1, len: 1, client: "—", service: "Closed", hue: 0, closed: true },
  // ── Group classes (placed in evening / off-peak gaps so they don't overlap solo events) ──
  // Mon 5:30pm — Spin Class with Theo, 12/16
  { day: 0, start: 9.5, len: 0.75, client: "—", service: "Spin Class", hue: 220, mode: "group", capacity: 16, attendees: ["Olivia Wren", "Felix Wong", "Hugo Bertrand", "Sven Andersson", "Jasper Cole", "Mei Lin Chen", "Priya Anand", "Renata Oliveira", "L. Frost", "M. Petrov", "K. Naidu", "S. Olsen"] },
  // Tue 5:30pm — Pilates Reformer with Marta, 5/6
  { day: 1, start: 9.5, len: 0.83, client: "—", service: "Pilates Reformer", hue: 60, mode: "group", capacity: 6, attendees: ["Olivia Wren", "Felix Wong", "Mei Lin Chen", "Priya Anand", "Renata Oliveira"] },
  // Wed 5:30pm — Yoga Flow with Yuki, 8/12
  { day: 2, start: 9.5, len: 1, client: "—", service: "Yoga Flow", hue: 165, mode: "group", capacity: 12, attendees: ["Olivia Wren", "Felix Wong", "Mei Lin Chen", "Priya Anand", "Renata Oliveira", "Hugo Bertrand", "Sven Andersson", "Jasper Cole"] },
  // Thu 4:30pm — Yoga Flow, fully booked 12/12
  { day: 3, start: 8.5, len: 1, client: "—", service: "Yoga Flow", hue: 165, mode: "group", capacity: 12, attendees: ["Olivia Wren", "Felix Wong", "Mei Lin Chen", "Priya Anand", "Renata Oliveira", "Hugo Bertrand", "Sven Andersson", "Jasper Cole", "L. Frost", "M. Petrov", "K. Naidu", "S. Olsen"] },
  // Fri 6:30pm — Mindful Meditation, 4/20
  { day: 4, start: 10.5, len: 0.5, client: "—", service: "Mindful Meditation", hue: 165, mode: "group", capacity: 20, attendees: ["Olivia Wren", "Mei Lin Chen", "Priya Anand", "Felix Wong"] },
  // Sat 4pm — Barre Burn, 9/14
  { day: 5, start: 8, len: 0.83, client: "—", service: "Barre Burn", hue: 60, mode: "group", capacity: 14, attendees: ["Olivia Wren", "Mei Lin Chen", "Priya Anand", "Renata Oliveira", "Hugo Bertrand", "Felix Wong", "L. Frost", "S. Olsen", "K. Naidu"] },
];

export const FINANCE_MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
export const FINANCE_INCOMING = [18420, 21100, 24300, 26800, 31200, 38420];
export const FINANCE_OUTGOING = [9800, 11200, 13100, 14400, 17900, 21300];

export const RECENT_TRANSACTIONS = [
  { d: "28 Apr", desc: "Studio subscription · O. Wren", t: "in" as const, a: 89 },
  { d: "28 Apr", desc: "Credit pack · 10× · J. Cole", t: "in" as const, a: 220 },
  { d: "27 Apr", desc: "Stripe processing fee", t: "out" as const, a: 42 },
  { d: "27 Apr", desc: "Atelier subscription · M. Chen", t: "in" as const, a: 149 },
  { d: "26 Apr", desc: "Refund · S. Andersson", t: "out" as const, a: 60 },
  { d: "26 Apr", desc: "Credit pack · 5× · F. Wong", t: "in" as const, a: 120 },
  { d: "25 Apr", desc: "Studio subscription · R. Oliveira", t: "in" as const, a: 89 },
];

// ────────────────────────────────────────────────────────
// ADMIN DATA
// ────────────────────────────────────────────────────────

export type AdminTodayItem = {
  time: string;
  duration: number;
  service: string;
  credits: number;
  hue: number;
  status: "done" | "now" | "next" | "upcoming";
} & (
  | { mode?: "solo"; client: string; capacity?: never; attendees?: never }
  | { mode: "group"; client?: never; capacity: number; attendees: string[] }
);

export const ADMIN_TODAY: AdminTodayItem[] = [
  { time: "07:00", duration: 60, mode: "group", service: "Yoga Flow", credits: 1, hue: 165, status: "done", capacity: 12, attendees: ["Olivia Wren", "Felix Wong", "Mei Lin Chen", "Priya Anand", "Renata Oliveira", "Hugo Bertrand", "Sven Andersson", "Jasper Cole"] },
  { time: "09:00", duration: 60, client: "Olivia Wren", service: "Cut + gloss", credits: 2, hue: 195, status: "done" },
  { time: "10:30", duration: 90, client: "Mei Lin Chen", service: "Balayage", credits: 4, hue: 280, status: "done" },
  { time: "12:00", duration: 45, client: "Hugo Bertrand", service: "Cut + style", credits: 2, hue: 165, status: "now" },
  { time: "13:30", duration: 60, client: "Priya Anand", service: "Gloss treatment", credits: 2, hue: 330, status: "next" },
  { time: "15:00", duration: 75, client: "Felix Wong", service: "Cut + colour", credits: 3, hue: 130, status: "upcoming" },
  { time: "16:30", duration: 60, client: "Renata Oliveira", service: "Blowout", credits: 1, hue: 25, status: "upcoming" },
  { time: "18:30", duration: 30, mode: "group", service: "Mindful Meditation", credits: 1, hue: 165, status: "upcoming", capacity: 20, attendees: ["Olivia Wren", "Mei Lin Chen", "Priya Anand", "Felix Wong"] },
];

export const ADMIN_BOOKINGS = [
  { date: "28 Apr", time: "09:00", client: "Olivia Wren", hue: 195, service: "Cut + gloss", duration: "1h", credits: 2, status: "confirmed" as const },
  { date: "28 Apr", time: "10:30", client: "Mei Lin Chen", hue: 280, service: "Balayage", duration: "1h 30m", credits: 4, status: "now" as const },
  { date: "28 Apr", time: "12:00", client: "Hugo Bertrand", hue: 165, service: "Cut + style", duration: "45m", credits: 2, status: "confirmed" as const },
  { date: "28 Apr", time: "13:30", client: "Priya Anand", hue: 330, service: "Gloss treatment", duration: "1h", credits: 2, status: "confirmed" as const },
  { date: "29 Apr", time: "09:30", client: "Felix Wong", hue: 130, service: "Cut + colour", duration: "1h 15m", credits: 3, status: "confirmed" as const },
  { date: "29 Apr", time: "11:00", client: "Renata Oliveira", hue: 25, service: "Blowout", duration: "1h", credits: 1, status: "pending" as const },
  { date: "29 Apr", time: "14:00", client: "Jasper Cole", hue: 220, service: "Beard trim", duration: "30m", credits: 1, status: "pending" as const },
  { date: "30 Apr", time: "10:00", client: "Olivia Wren", hue: 195, service: "Root touch-up", duration: "1h 30m", credits: 3, status: "confirmed" as const },
];

export const ADMIN_CLIENTS = [
  { name: "Olivia Wren", hue: 195, visits: 24, lastVisit: "Today", nextVisit: "30 Apr", favourite: "Cut + gloss", credits: 6, ltv: 2840 },
  { name: "Mei Lin Chen", hue: 280, visits: 18, lastVisit: "Today", nextVisit: "5 May", favourite: "Balayage", credits: 11, ltv: 4210 },
  { name: "Hugo Bertrand", hue: 165, visits: 12, lastVisit: "2 weeks ago", nextVisit: "28 Apr", favourite: "Cut + style", credits: 0, ltv: 1980 },
  { name: "Felix Wong", hue: 130, visits: 16, lastVisit: "2 days ago", nextVisit: "29 Apr", favourite: "Cut + colour", credits: 7, ltv: 3870 },
  { name: "Priya Anand", hue: 330, visits: 14, lastVisit: "Today", nextVisit: "2 May", favourite: "Gloss treatment", credits: 9, ltv: 3460 },
  { name: "Renata Oliveira", hue: 25, visits: 9, lastVisit: "5 days ago", nextVisit: "29 Apr", favourite: "Blowout", credits: 4, ltv: 2110 },
  { name: "Sven Andersson", hue: 60, visits: 5, lastVisit: "1 month ago", nextVisit: "—", favourite: "Trim", credits: 0, ltv: 760 },
];

export type MessageThread = { id: string; name: string; hue: number; lastMsg: string; time: string; unread: number; online?: boolean };

export const ADMIN_THREADS: MessageThread[] = [
  { id: "t1", name: "Olivia Wren", hue: 195, lastMsg: "Thanks! See you at 3 💇‍♀️", time: "2m ago", unread: 0, online: true },
  { id: "t2", name: "Mei Lin Chen", hue: 280, lastMsg: "Can I reschedule to Friday?", time: "18m ago", unread: 1 },
  { id: "t3", name: "Priya Anand", hue: 330, lastMsg: "Yes, plenty of credits ✓", time: "1h ago", unread: 2 },
  { id: "t4", name: "Hugo Bertrand", hue: 165, lastMsg: "Looking forward to it!", time: "3h ago", unread: 0 },
  { id: "t5", name: "Felix Wong", hue: 130, lastMsg: "Same style as last time please", time: "Yesterday", unread: 0 },
];

export type ChatMessage = { id: string; sender: "me" | "them"; text: string; time: string };

export const ADMIN_CHAT_MESSAGES: ChatMessage[] = [
  { id: "m1", sender: "them", text: "Hi Camille! I was wondering if you have any availability this week for a balayage touch-up?", time: "10:14 AM" },
  { id: "m2", sender: "me", text: "Hey Olivia! Yes, I have a slot on Thursday at 2 PM or Friday at 10 AM. Which works better?", time: "10:18 AM" },
  { id: "m3", sender: "them", text: "Thursday at 2 PM works perfectly!", time: "10:20 AM" },
  { id: "m4", sender: "me", text: "Booked! You still have 6 credits so that's covered. See you Thursday 💜", time: "10:22 AM" },
  { id: "m5", sender: "them", text: "Amazing, thanks! Also, should I come with freshly washed hair?", time: "10:30 AM" },
  { id: "m6", sender: "me", text: "Day-old hair is actually better for balayage — the natural oils help the colour process. So skip the wash!", time: "10:32 AM" },
  { id: "m7", sender: "them", text: "Thanks! See you at 3 💇‍♀️", time: "10:34 AM" },
];

export const ADMIN_EARNINGS_WEEKLY = [64, 72, 58, 81, 76, 69, 84, 78];
export const ADMIN_EARNINGS_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

export const ADMIN_SERVICE_MIX = [
  { service: "Cut + gloss", sessions: 18, revenue: 2160, pct: 26 },
  { service: "Balayage", sessions: 12, revenue: 3600, pct: 43 },
  { service: "Gloss treatment", sessions: 8, revenue: 960, pct: 11 },
  { service: "Cut + colour", sessions: 6, revenue: 1080, pct: 13 },
  { service: "Blowout", sessions: 4, revenue: 480, pct: 6 },
];

export const ADMIN_STATEMENTS = [
  { date: "28 Apr", client: "Olivia Wren", service: "Cut + gloss", credits: 2, gross: 120, commission: 65 },
  { date: "28 Apr", client: "Mei Lin Chen", service: "Balayage", credits: 4, gross: 280, commission: 65 },
  { date: "27 Apr", client: "Felix Wong", service: "Cut + colour", credits: 3, gross: 180, commission: 65 },
  { date: "27 Apr", client: "Priya Anand", service: "Gloss treatment", credits: 2, gross: 120, commission: 65 },
  { date: "26 Apr", client: "Renata Oliveira", service: "Blowout", credits: 1, gross: 80, commission: 65 },
  { date: "26 Apr", client: "Hugo Bertrand", service: "Cut + style", credits: 2, gross: 120, commission: 65 },
  { date: "25 Apr", client: "Olivia Wren", service: "Root touch-up", credits: 3, gross: 200, commission: 65 },
  { date: "25 Apr", client: "Mei Lin Chen", service: "Gloss treatment", credits: 2, gross: 120, commission: 65 },
];

// ────────────────────────────────────────────────────────
// CLIENT DATA
// ────────────────────────────────────────────────────────

export const CLIENT_PROFILE = {
  name: "Olivia Wren",
  hue: 195,
  plan: "Studio",
  creditsUsed: 6,
  creditsTotal: 8,
  pricePerMonth: 89,
  renewalDate: "1 May",
  memberSince: "Jan 2025",
  tier: "Gold",
  visitsToNextTier: 2,
  yearlyVisits: 14,
  yearlySpent: 1260,
  lifetimeVisits: 38,
  lifetimeSpent: 3420,
};

export const CLIENT_UPCOMING = [
  { id: "cu1", date: "Thu", dateNum: 30, month: "Apr", time: "2:00 PM", service: "Balayage touch-up", admin: "Camille Roux", hue: 195, duration: "1h 30m", credits: 3, status: "confirmed" as const },
  { id: "cu2", date: "Mon", dateNum: 5, month: "May", time: "10:00 AM", service: "Cut + gloss", admin: "Camille Roux", hue: 195, duration: "1h", credits: 2, status: "confirmed" as const },
];

export const CLIENT_PAST_VISITS = [
  { date: "25 Apr", service: "Root touch-up", admin: "Camille Roux", credits: 3, rating: 5 },
  { date: "18 Apr", service: "Cut + gloss", admin: "Camille Roux", credits: 2, rating: 5 },
  { date: "10 Apr", service: "Balayage", admin: "Camille Roux", credits: 4, rating: 4 },
  { date: "28 Mar", service: "Blowout", admin: "Camille Roux", credits: 1, rating: 5 },
  { date: "15 Mar", service: "Cut + gloss", admin: "Camille Roux", credits: 2, rating: 5 },
  { date: "1 Mar", service: "Gloss treatment", admin: "Camille Roux", credits: 2, rating: 4 },
];

export const CLIENT_BOOK_AGAIN = [
  { service: "Cut + gloss", admin: "Camille Roux", duration: "1h", credits: 2, lastBooked: "18 Apr" },
  { service: "Balayage", admin: "Camille Roux", duration: "1h 30m", credits: 4, lastBooked: "10 Apr" },
  { service: "Blowout", admin: "Camille Roux", duration: "45m", credits: 1, lastBooked: "28 Mar" },
];

export const CLIENT_BOOKING_DATES = [
  { day: "Mon", num: 4, available: true },
  { day: "Tue", num: 5, available: true, selected: true },
  { day: "Wed", num: 6, available: true },
  { day: "Thu", num: 7, available: true },
  { day: "Fri", num: 8, available: true },
  { day: "Sat", num: 9, available: true },
  { day: "Sun", num: 10, available: false },
];

export type TimeSlotStatus = "available" | "taken" | "selected";

// Group classes the client can browse + enroll in (Classes tab on /client/book).
export type ClientClassSession = {
  id: string;
  serviceId: string;
  service: string;
  admin: string;
  hue: number;
  date: string;             // human label, e.g. "Mon 4 May"
  time: string;             // e.g. "5:30 PM"
  durationMin: number;
  capacity: number;
  enrolled: number;
  credits: number;
  enrolledByMe?: boolean;
};

export const CLIENT_CLASS_SESSIONS: ClientClassSession[] = [
  { id: "cls-1", serviceId: "svc-yoga",     service: "Yoga Flow",         admin: "Yuki Tanaka",  hue: 165, date: "Mon 4 May",  time: "7:00 AM",  durationMin: 60, capacity: 12, enrolled: 8,  credits: 1, enrolledByMe: true },
  { id: "cls-2", serviceId: "svc-spin",     service: "Spin Class",        admin: "Theo Bennett", hue: 220, date: "Mon 4 May",  time: "5:30 PM",  durationMin: 45, capacity: 16, enrolled: 12, credits: 1 },
  { id: "cls-3", serviceId: "svc-pilates",  service: "Pilates Reformer",  admin: "Marta Halász", hue: 60,  date: "Tue 5 May",  time: "5:30 PM",  durationMin: 50, capacity: 6,  enrolled: 5,  credits: 2 },
  { id: "cls-4", serviceId: "svc-yoga",     service: "Yoga Flow",         admin: "Yuki Tanaka",  hue: 165, date: "Wed 6 May",  time: "5:30 PM",  durationMin: 60, capacity: 12, enrolled: 8,  credits: 1 },
  { id: "cls-5", serviceId: "svc-yoga",     service: "Yoga Flow",         admin: "Yuki Tanaka",  hue: 165, date: "Thu 7 May",  time: "4:30 PM",  durationMin: 60, capacity: 12, enrolled: 12, credits: 1 },
  { id: "cls-6", serviceId: "svc-meditate", service: "Mindful Meditation",admin: "Yuki Tanaka",  hue: 165, date: "Fri 8 May",  time: "6:30 PM",  durationMin: 30, capacity: 20, enrolled: 4,  credits: 1, enrolledByMe: true },
  { id: "cls-7", serviceId: "svc-barre",    service: "Barre Burn",        admin: "Marta Halász", hue: 60,  date: "Sat 9 May",  time: "4:00 PM",  durationMin: 50, capacity: 14, enrolled: 9,  credits: 1 },
  { id: "cls-8", serviceId: "svc-spin",     service: "Spin Class",        admin: "Theo Bennett", hue: 220, date: "Sat 9 May",  time: "10:00 AM", durationMin: 45, capacity: 16, enrolled: 6,  credits: 1 },
];

export const CLIENT_TIME_SLOTS: { time: string; status: TimeSlotStatus }[] = [
  { time: "9:00 AM", status: "taken" },
  { time: "9:30 AM", status: "taken" },
  { time: "10:00 AM", status: "available" },
  { time: "10:30 AM", status: "available" },
  { time: "11:00 AM", status: "selected" },
  { time: "11:30 AM", status: "taken" },
  { time: "12:00 PM", status: "available" },
  { time: "12:30 PM", status: "taken" },
  { time: "1:00 PM", status: "available" },
  { time: "1:30 PM", status: "available" },
  { time: "2:00 PM", status: "taken" },
  { time: "2:30 PM", status: "available" },
];

export const CLIENT_TOPUP_PACKS = [
  { credits: 5, price: 55, perCredit: 11, savings: 0, label: "" },
  { credits: 10, price: 99, perCredit: 9.9, savings: 10, label: "Popular" },
  { credits: 20, price: 179, perCredit: 8.95, savings: 18, label: "Best value" },
  { credits: 50, price: 399, perCredit: 7.98, savings: 27, label: "Pro" },
];

export const CLIENT_PLANS = [
  { id: "payg", name: "Pay-as-you-go", price: 0, credits: 0, desc: "Buy credits when you need them", features: ["No commitment", "€12 per credit", "Book anytime"] },
  { id: "studio", name: "Studio", price: 89, credits: 8, desc: "For regular salon visits", features: ["8 credits/month", "€11.13 per credit", "Priority booking", "Free reschedule"], current: true },
  { id: "atelier", name: "Atelier", price: 149, credits: 12, desc: "For the dedicated client", features: ["12 credits/month", "€12.42 per credit", "Priority + VIP", "Free reschedule", "Exclusive events"] },
];

export const CLIENT_TRANSACTIONS = [
  { date: "28 Apr", desc: "Cut + gloss · Camille R.", credits: -2, balance: 2 },
  { date: "25 Apr", desc: "Root touch-up · Camille R.", credits: -3, balance: 4 },
  { date: "18 Apr", desc: "Cut + gloss · Camille R.", credits: -2, balance: 7 },
  { date: "1 Apr", desc: "Monthly credit top-up", credits: 8, balance: 9 },
  { date: "28 Mar", desc: "Blowout · Camille R.", credits: -1, balance: 1 },
];

export const CLIENT_THREADS: MessageThread[] = [
  { id: "ct1", name: "Camille Roux", hue: 195, lastMsg: "See you Thursday! Skip the hair wash 😊", time: "10:34 AM", unread: 0, online: true },
  { id: "ct2", name: "Asha Iyer", hue: 280, lastMsg: "Your nail art is ready to pick up!", time: "Yesterday", unread: 1 },
  { id: "ct3", name: "Maison & Co.", hue: 200, lastMsg: "Your May credits have been added 🎉", time: "2 days ago", unread: 0 },
];

export const CLIENT_CHAT_MESSAGES: ChatMessage[] = [
  { id: "cm1", sender: "me", text: "Hi Camille! I was wondering if you have any availability this week for a balayage touch-up?", time: "10:14 AM" },
  { id: "cm2", sender: "them", text: "Hey Olivia! Yes, I have a slot on Thursday at 2 PM or Friday at 10 AM. Which works better?", time: "10:18 AM" },
  { id: "cm3", sender: "me", text: "Thursday at 2 PM works perfectly!", time: "10:20 AM" },
  { id: "cm4", sender: "them", text: "Booked! You still have 6 credits so that's covered. See you Thursday 💜", time: "10:22 AM" },
  { id: "cm5", sender: "me", text: "Amazing, thanks! Also, should I come with freshly washed hair?", time: "10:30 AM" },
  { id: "cm6", sender: "them", text: "Day-old hair is actually better for balayage — the natural oils help the colour process. So skip the wash!", time: "10:32 AM" },
  { id: "cm7", sender: "them", text: "See you Thursday! Skip the hair wash 😊", time: "10:34 AM" },
];
