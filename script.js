/* ==========================================================================
   RexEngine — Interactive SaaS demo
   Vanilla JS only. All data is sample data; no network calls, scraping,
   OAuth or AI APIs are used. Every "AI" interaction is a scripted demo.
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   1. Utilities
   -------------------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const U = (id, w = 800, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=80`;
const money = n => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const num = n => Number(n).toLocaleString('en-US');
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const ic = (name, cls = 'w-4 h-4') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const icons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.85 } }); };
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const store = {
  get(k, d) { try { const v = localStorage.getItem('rex:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rex:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
const rotate = (arr, n) => arr.slice(n % arr.length).concat(arr.slice(0, n % arr.length));
const stripEmoji = s => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/[ \t]{2,}/g, ' ').replace(/ +\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim();

/* Dates — everything is relative to "today" so the demo always looks current */
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const NOW = new Date();
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
function at(dayOffset, hm = '09:00') {
  const [h, m] = hm.split(':').map(Number);
  const d = addDays(TODAY, dayOffset); d.setHours(h, m, 0, 0); return d;
}
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDate = (d, o = { month: 'short', day: 'numeric' }) => d.toLocaleDateString('en-US', o);
const fmtTime = d => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtLong = d => fmtDate(d, { weekday: 'short', month: 'short', day: 'numeric' });
function relDay(d) {
  const diff = Math.round((startOfDay(d) - TODAY) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return fmtLong(d);
}
function timeAgo(d) {
  const s = (Date.now() - d) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}
const toISODate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toHM = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const hmLabel = hm => { const [h, m] = hm.split(':').map(Number); const d = new Date(); d.setHours(h, m); return fmtTime(d); };
/** Next half-hour slot at least 90 minutes from now (today), else tomorrow morning */
function laterToday() {
  const d = new Date(Date.now() + 90 * 60000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  if (!sameDay(d, TODAY) || d.getHours() >= 22) return at(1, '09:30');
  return d;
}

const FALLBACK_IMG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E2E8F0"/><stop offset="1" stop-color="#F8FAFC"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><path d="M168 166l32-28 32 28v34h-64z" fill="none" stroke="#94A3B8" stroke-width="6" stroke-linejoin="round"/></svg>');

/* --------------------------------------------------------------------------
   2. Brand & platform definitions
   -------------------------------------------------------------------------- */
const LOGO = (size = 32) => `
  <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" aria-hidden="true" class="flex-none">
    <defs><linearGradient id="rexg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stop-color="#5B55E6"/><stop offset="1" stop-color="#2E28B0"/></linearGradient></defs>
    <rect width="32" height="32" rx="9" fill="url(#rexg)"/>
    <path d="M8 15.5 16 9l8 6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 24v-7h4.3a2.6 2.6 0 0 1 0 5.2H12.5M16.6 22.2 19.5 24" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const PLATFORMS = {
  instagram: { name: 'Instagram', formats: ['post', 'carousel', 'reel'], limit: 2200, tagRange: [5, 15] },
  facebook: { name: 'Facebook', formats: ['post', 'carousel', 'reel'], limit: 5000, tagRange: [1, 5] },
  linkedin: { name: 'LinkedIn', formats: ['post', 'carousel'], limit: 3000, tagRange: [1, 5] },
  x: { name: 'X', formats: ['post', 'thread'], limit: 280, tagRange: [1, 3] },
  youtube: { name: 'YouTube', formats: ['short', 'post'], limit: 100, tagRange: [2, 8] },
};
const P_ORDER = ['instagram', 'facebook', 'linkedin', 'x', 'youtube'];
const FORMATS = {
  post: { label: 'Post', icon: 'image' },
  carousel: { label: 'Carousel', icon: 'images' },
  reel: { label: 'Reel', icon: 'clapperboard' },
  short: { label: 'Short', icon: 'smartphone' },
  thread: { label: 'Thread', icon: 'message-square-text' },
};
/* Simplified glyphs — stylised marks, not official brand assets */
const GLYPH = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/><circle cx="12" cy="12" r="3.9"/><circle cx="17.1" cy="6.9" r="1.15" fill="currentColor" stroke="none"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.6 21v-7.6h2.6l.4-3.1h-3V8.4c0-.9.3-1.5 1.5-1.5h1.6V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.9v3.1h2.6V21z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="9.3" width="3.2" height="10.7" rx=".4"/><circle cx="5.6" cy="5.6" r="1.9"/><path d="M9.6 9.3h3.1v1.5c.5-.9 1.7-1.8 3.4-1.8 3.3 0 3.9 2.1 3.9 4.9V20h-3.2v-5.4c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V20H9.6z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3.5h3l-6.6 7.5 7.8 9.5h-6.1l-4.8-6-5.4 6h-3l7.1-8L2.2 3.5h6.2l4.3 5.5zm-1 15.2h1.7L7.6 5.2H5.8z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="currentColor"/><path d="M10.2 9.2v5.6l4.8-2.8z" fill="#FF0033"/></svg>',
};
const pIcon = (p, size = 'md', extra = '') =>
  `<span class="pi pi-${size} pi-${p} ${extra}" role="img" aria-label="${PLATFORMS[p].name}" title="${PLATFORMS[p].name}">${GLYPH[p]}</span>`;

const STATUS = {
  draft: { label: 'Draft', cls: 'b-gray', color: '#94A3B8', icon: 'file-text' },
  review: { label: 'Needs Review', cls: 'b-amber', color: '#F59E0B', icon: 'eye' },
  approved: { label: 'Approved', cls: 'b-teal', color: '#14B8A6', icon: 'badge-check' },
  scheduled: { label: 'Scheduled', cls: 'b-blue', color: '#3B82F6', icon: 'calendar-clock' },
  published: { label: 'Published', cls: 'b-green', color: '#16A34A', icon: 'circle-check' },
  failed: { label: 'Failed', cls: 'b-red', color: '#DC2626', icon: 'circle-alert' },
  rejected: { label: 'Rejected', cls: 'b-rose', color: '#E11D48', icon: 'circle-x' },
};
const LISTING = {
  active: { label: 'Active Listing', cls: 'b-green' },
  pending: { label: 'Pending', cls: 'b-amber' },
  coming: { label: 'Coming Soon', cls: 'b-blue' },
  sold: { label: 'Sold', cls: 'b-gray' },
};
const badge = (key, map = STATUS, extra = '') => { const m = map[key]; return m ? `<span class="badge ${m.cls} ${extra}"><span class="dot"></span>${m.label}</span>` : ''; };
const glassBadge = (key, map = LISTING) => { const m = map[key]; const c = { 'b-green': '#16A34A', 'b-amber': '#F59E0B', 'b-blue': '#3B82F6', 'b-gray': '#64748B' }[m.cls]; return `<span class="badge b-glass"><span class="dot" style="background:${c}"></span>${m.label}</span>`; };

const PROPERTY_TYPES = ['Family Home', 'Luxury House', 'Modern Apartment', 'Townhouse', 'Waterfront Property', 'Contemporary Villa'];
const TYPE_TAG = { 'Family Home': 'FamilyHome', 'Luxury House': 'LuxuryHomes', 'Modern Apartment': 'ApartmentLiving', Townhouse: 'TownhouseLiving', 'Waterfront Property': 'WaterfrontHomes', 'Contemporary Villa': 'ModernVilla' };

/* --------------------------------------------------------------------------
   3. Sample data
   -------------------------------------------------------------------------- */
const AV = {
  alex: U('1507003211169-0a1dd7228f2d', 160, 160),
  jordan: U('1438761681033-6461ffad8d80', 160, 160),
  priya: U('1494790108377-be9c29b29330', 160, 160),
  sam: U('1472099645785-5658abf4ff4e', 160, 160),
};
const ROOM = ['Front exterior', 'Living room', 'Kitchen', 'Primary suite', 'Bathroom', 'Backyard'];
const gallery = (ids, labels = ROOM) => ids.map((id, i) => ({ src: U(id, 1200), thumb: U(id, 400, 300), label: labels[i] || `Photo ${i + 1}` }));

const PROPERTIES = [
  {
    id: 'p1', title: 'Contemporary Family Home', address: '1428 Willow Creek Dr', city: 'Austin', state: 'TX', zip: '78704', neighborhood: 'Zilker',
    price: 685000, beds: 4, baths: 3, sqft: 2450, type: 'Family Home', status: 'active', year: 2019, lot: '0.24 acres', garage: '2-car', listedAt: at(-4, '09:14'),
    description: 'Beautiful contemporary family home featuring spacious interiors, an open-concept kitchen, and a landscaped backyard.',
    features: ['Open-concept kitchen', 'Landscaped backyard', 'Dedicated home office', 'Two-car garage', 'Wide-plank hardwood floors', 'Smart home thermostat'],
    photos: gallery(['1600585154340-be6161a56a0c', '1600607687939-ce8a6c25118c', '1484154218962-a197022b5858', '1540518614846-7eded433c457', '1600566752355-35792bedcfea', '1600607688969-a5bfcd646154'], ['Front exterior', 'Living room', 'Kitchen', 'Primary suite', 'Primary bath', 'Backyard']),
  },
  {
    id: 'p2', title: 'Modern Townhouse', address: '305 Pine Ridge Ln', city: 'Denver', state: 'CO', zip: '80211', neighborhood: 'Highland',
    price: 520000, beds: 3, baths: 2.5, sqft: 1860, type: 'Townhouse', status: 'active', year: 2021, lot: '0.05 acres', garage: '1-car', listedAt: at(-14, '10:02'),
    description: 'Stylish three-level townhouse with a private rooftop deck, designer finishes, and an easy walk to Highland’s restaurants and parks.',
    features: ['Private rooftop deck', 'Quartz countertops', 'Attached garage', 'Walk-in closets', 'EV charging ready'],
    photos: gallery(['1494526585095-c41746248156', '1522708323590-d24dbb6b0267', '1493809842364-78817add7ffb', '1505691938895-1758d7feb511', '1552321554-5fefe8c9ef14'], ['Front exterior', 'Kitchen & dining', 'Living room', 'Primary suite', 'Bathroom']),
  },
  {
    id: 'p3', title: 'Craftsman Luxury Estate', address: '77 Maple Grove Way', city: 'Charlotte', state: 'NC', zip: '28207', neighborhood: 'Myers Park',
    price: 749000, beds: 4, baths: 3.5, sqft: 3120, type: 'Luxury House', status: 'pending', year: 2016, lot: '0.41 acres', garage: '3-car', listedAt: at(-18, '08:40'),
    description: 'Warm craftsman estate with a welcoming front porch, a chef’s kitchen, and a resort-style pool on a tree-lined lot.',
    features: ['Chef’s kitchen', 'Resort-style pool', 'Covered front porch', 'Spa-inspired primary bath', 'Three-car garage'],
    photos: gallery(['1568605114967-8130f3a36994', '1600566753086-00f18fb6b3ea', '1507089947368-19c1da9775ae', '1598928506311-c55ded91a20c', '1416331108676-a22ccb276e35'], ['Front exterior', 'Living room', 'Kitchen', 'Family room', 'Pool at dusk']),
  },
  {
    id: 'p4', title: 'Lakefront Modern Retreat', address: '19 Lakeside Ct', city: 'Naples', state: 'FL', zip: '34102', neighborhood: 'Port Royal',
    price: 1250000, beds: 5, baths: 4, sqft: 3980, type: 'Waterfront Property', status: 'active', year: 2022, lot: '0.52 acres', garage: '3-car', listedAt: at(-10, '11:20'),
    description: 'Sleek waterfront residence with walls of glass, an infinity-edge pool, and a private dock just steps from open water.',
    features: ['Private boat dock', 'Infinity-edge pool', 'Floor-to-ceiling glass', 'Outdoor summer kitchen', 'Whole-home automation'],
    photos: gallery(['1600596542815-ffad4c1539a9', '1600573472550-8090b5e0745e', '1613545325278-f24b0cae1224', '1507652313519-d4e9174996dd', '1512917774080-9991f1c4c750'], ['Waterfront exterior', 'Stair & pool view', 'Great room', 'Primary bath', 'Pool terrace']),
  },
  {
    id: 'p5', title: 'Downtown Modern Apartment', address: '86 Oakwood Terrace', city: 'Seattle', state: 'WA', zip: '98109', neighborhood: 'South Lake Union',
    price: 425000, beds: 2, baths: 2, sqft: 1180, type: 'Modern Apartment', status: 'coming', year: 2020, lot: 'Unit 4B', garage: '1 space', listedAt: at(-20, '14:05'),
    description: 'Light-filled two-bedroom residence with city views, an open living plan, and full-service building amenities.',
    features: ['Floor-to-ceiling windows', 'In-unit laundry', 'Resident fitness center', 'Secure parking', 'Pet-friendly building'],
    photos: gallery(['1512915922686-57c11dde9b6b', '1502672260266-1c1ef2d93688', '1560448204-e02f11c3d0e2', '1586023492125-27b2c045efd7', '1545324418-cc1a3fa10c00'], ['Building exterior', 'Living area', 'Open living plan', 'Reading nook', 'Street view']),
  },
  {
    id: 'p6', title: 'Contemporary Hillside Villa', address: '240 Sunset Boulevard', city: 'Scottsdale', state: 'AZ', zip: '85255', neighborhood: 'North Scottsdale',
    price: 895000, beds: 4, baths: 4, sqft: 3400, type: 'Contemporary Villa', status: 'active', year: 2018, lot: '0.62 acres', garage: '3-car', listedAt: at(-25, '09:00'),
    description: 'Architectural villa with crisp white lines, a resort-style pool, and seamless indoor-outdoor living framed by desert views.',
    features: ['Resort-style pool', 'Indoor-outdoor living', 'Mountain views', 'Temperature-controlled wine room', 'Owned solar panels'],
    photos: gallery(['1613977257363-707ba9348227', '1613490493576-7fde63acd811', '1600585154526-990dced4db0d', '1600210492486-724fe5c67fb0', '1556911220-bff31c812dba'], ['Villa & pool', 'Pool courtyard', 'Evening facade', 'Living room', 'Kitchen']),
  },
];

/* Result returned by the demo "URL import" */
const IMPORT_DEMO = {
  title: 'Coastal Modern Residence', address: '512 Harbor View Rd', city: 'Tampa', state: 'FL', zip: '33606', neighborhood: 'Hyde Park',
  price: 815000, beds: 4, baths: 3, sqft: 2780, type: 'Luxury House', status: 'active', year: 2020, lot: '0.21 acres', garage: '2-car',
  description: 'Modern coastal home with a two-story great room, gourmet kitchen, and a saltwater pool designed for effortless entertaining.',
  features: ['Saltwater pool', 'Gourmet kitchen', 'Two-story great room', 'Covered lanai', 'Impact-rated windows'],
  photoIds: ['1580587771525-78b9dba3b914', '1600563438938-a9a27216b4f5', '1501183638710-841dd1904471', '1600566753190-17f0baa2a6c3'],
  labels: ['Front exterior', 'Street view', 'Great room', 'Side elevation'],
};
const DEFAULT_PHOTOS = ['1576941089067-2de3c901e126', '1600047509807-ba8f99d2cdde', '1600566753086-00f18fb6b3ea'];

const ACCOUNTS = [
  { id: 'instagram', status: 'connected', account: '@alexmorgan.homes', display: 'Alex Morgan Homes', followers: '12.4K', lastSync: new Date(Date.now() - 4 * 60000), perms: ['Publish posts & reels', 'Read insights'] },
  { id: 'facebook', status: 'connected', account: 'Alex Morgan Realty', display: 'Facebook Page', followers: '8,920', lastSync: new Date(Date.now() - 12 * 60000), perms: ['Publish to Page', 'Read comments'] },
  { id: 'linkedin', status: 'connected', account: 'Alex Morgan', display: 'Personal profile', followers: '3,180', lastSync: new Date(Date.now() - 64 * 60000), perms: ['Share posts', 'Upload documents'] },
  { id: 'x', status: 'disconnected', account: null, display: null, followers: null, lastSync: null, perms: ['Post & threads', 'Upload media'] },
  { id: 'youtube', status: 'expired', account: 'Alex Morgan Homes', display: 'YouTube channel', followers: '2.1K', lastSync: new Date(Date.now() - 2 * 864e5), perms: ['Upload Shorts', 'Manage community posts'] },
];
const DEMO_ACCOUNT_OPTIONS = {
  instagram: [['@alexmorgan.homes', 'Professional account · 12.4K followers'], ['@morganco.realty', 'Brokerage account · 4.8K followers']],
  facebook: [['Alex Morgan Realty', 'Page · 8,920 followers'], ['Morgan & Co. Realty', 'Page · 3,410 followers']],
  linkedin: [['Alex Morgan', 'Personal profile · 3,180 connections'], ['Morgan & Co. Realty', 'Company page · 1,240 followers']],
  x: [['@alexmorganre', 'Alex Morgan · 1,960 followers'], ['@morganco_realty', 'Morgan & Co. Realty · 870 followers']],
  youtube: [['Alex Morgan Homes', 'Channel · 2.1K subscribers'], ['Morgan & Co. Tours', 'Channel · 640 subscribers']],
};
const HANDLE = { instagram: 'alexmorgan.homes', facebook: 'Alex Morgan Realty', linkedin: 'Alex Morgan', x: '@alexmorganre', youtube: '@alexmorganhomes' };

/* --------------------------------------------------------------------------
   4. Demo content generator — deterministic, property-aware sample copy
   -------------------------------------------------------------------------- */
const TONES = { professional: 'Professional', luxury: 'Luxury', friendly: 'Friendly', investment: 'Investment-focused' };
const AUDIENCES = { buyers: 'Buyers', investors: 'Investors', renters: 'Renters' };
const GOALS = { awareness: 'Awareness', engagement: 'Engagement', leads: 'Lead Generation' };

function hookFor(p, tone, v) {
  const H = {
    professional: [`Just listed: ${p.address}, ${p.city}.`, `New to market in ${p.neighborhood}: ${p.address}.`],
    luxury: [`Refined living, redefined — introducing ${p.address}.`, `An address that speaks for itself: ${p.address}, ${p.city}.`],
    friendly: [`Home sweet home alert 🏡 Say hello to ${p.address}!`, `Picture your mornings here ☀️ ${p.address} just hit the market.`],
    investment: [`Investor spotlight 📈 ${p.address}, ${p.city} — offered at ${money(p.price)}.`, `Opportunity in ${p.neighborhood}: ${p.address} at ${money(p.price)}.`],
  };
  return H[tone][v % 2];
}
function audienceLine(p, aud) {
  return {
    buyers: `${p.beds} bedrooms, ${p.baths} baths and ${num(p.sqft)} sq ft designed around everyday living.`,
    investors: `${num(p.sqft)} sq ft · ${p.beds} bd / ${p.baths} ba in one of ${p.city}’s most in-demand neighborhoods — strong resale and rental fundamentals.`,
    renters: `${p.beds} bedrooms, ${p.baths} baths and ${num(p.sqft)} sq ft of flexible space, ready for your next chapter.`,
  }[aud];
}
function ctaFor(platform, goal) {
  const C = {
    leads: { instagram: 'DM “TOUR” or tap the link in bio to book a private showing.', facebook: 'Book a private tour this week — send us a message.', linkedin: 'Message me to request the full listing package and comps.', x: 'DM to book a private tour.', youtube: 'Book a private showing — link in the description.' },
    awareness: { instagram: 'Save this post and share it with someone who’s house hunting.', facebook: 'Know someone looking to move? Share this with them.', linkedin: 'Share with a colleague relocating to the area.', x: 'Know someone house hunting? Share this.', youtube: 'Subscribe for a new home tour every week.' },
    engagement: { instagram: 'Which feature would you love most? Tell us in the comments 👇', facebook: 'Which room would you claim first? Tell us below!', linkedin: 'What’s the #1 feature your buyers ask for right now?', x: 'Which room is your favorite?', youtube: 'Which room was your favorite? Comment below.' },
  };
  return C[goal][platform];
}
function hashtagsFor(p, platform, tone) {
  const city = p.city.replace(/[^A-Za-z]/g, '');
  const type = TYPE_TAG[p.type] || 'NewListing';
  const sets = {
    instagram: ['#JustListed', `#${city}RealEstate`, `#${city}Homes`, `#${type}`, '#DreamHome', '#HomeForSale', '#NewListing', '#HouseHunting', tone === 'luxury' ? '#LuxuryLiving' : '#HomeSweetHome', `#${p.state}Homes`],
    facebook: ['#JustListed', `#${city}Homes`, '#OpenHouse'],
    linkedin: ['#RealEstate', `#${city}RealEstate`, '#NewListing'],
    x: ['#JustListed', `#${city}`],
    youtube: ['#HomeTour', `#${city}RealEstate`, `#${type}`, '#Shorts'],
  };
  return sets[platform].join(' ');
}
const bullets = (p, v, mark, n = 3) => rotate(p.features, v).slice(0, n).map(f => `${mark} ${f}`).join('\n');

function generateContent(p, platform, format, opts = {}) {
  const { tone = 'professional', audience = 'buyers', goal = 'leads', v = 0 } = opts;
  const hook = hookFor(p, tone, v);
  const aud = audienceLine(p, audience);
  const loc = `${p.neighborhood}, ${p.city}`;
  const mark = tone === 'friendly' ? '✨' : tone === 'luxury' ? '—' : '•';
  let caption = '', description = '';
  switch (platform) {
    case 'instagram':
      if (format === 'reel') caption = `${hook} Take the 30-second tour 🎬\n\n${aud}\n\n📍 ${loc} · ${money(p.price)}`;
      else if (format === 'carousel') caption = `${hook} Swipe through the highlights →\n\n${bullets(p, v, mark)}\n\n${aud}\n\n📍 ${loc} · ${money(p.price)}`;
      else caption = `${hook}\n\n${aud}\n\n${bullets(p, v, mark)}\n\n📍 ${loc} · ${money(p.price)}`;
      description = `Photo of ${p.address}: ${p.description.charAt(0).toLowerCase() + p.description.slice(1)}`;
      break;
    case 'facebook':
      caption = `${hook}\n\n${p.description} ${aud}\n\nHighlights:\n${bullets(p, v, '•', 4)}\n\nOffered at ${money(p.price)} in ${loc}.`;
      if (format === 'reel') caption = `${hook} Watch the full walkthrough 🎥\n\n${aud} Offered at ${money(p.price)}.`;
      description = `${p.beds} bd · ${p.baths} ba · ${num(p.sqft)} sq ft — view photos, floor plans and schedule a showing.`;
      break;
    case 'linkedin':
      caption = `${tone === 'investment' ? hook : `New listing in ${loc}: ${p.address}.`}\n\n${p.description}\n\nWhy it stands out:\n${bullets(p, v, '→')}\n\n${aud}\n\nOffered at ${money(p.price)}. Happy to share comps and market context with buyers and fellow agents.`;
      if (format === 'carousel') caption = `${p.address} — a ${p.type.toLowerCase()} in ${loc}, in 6 slides.\n\nSwipe for the floor plan, highlights and neighborhood data.\n\n${aud}`;
      description = `Listing summary — ${p.type}, ${p.beds} bd / ${p.baths} ba, ${num(p.sqft)} sq ft, ${loc}.`;
      break;
    case 'x': {
      const xHook = { professional: 'Just listed:', luxury: 'Introducing', friendly: 'New listing alert 🏡', investment: 'Investor pick 📈' }[tone];
      const f = rotate(p.features, v);
      caption = `${xHook} ${p.address}, ${p.city}. ${p.beds}bd/${p.baths}ba · ${num(p.sqft)} sqft · ${money(p.price)}\n\n${f[0]}, ${f[1].toLowerCase()} and more in ${p.neighborhood}.`;
      description = `2/ ${p.description}\n\n3/ Highlights: ${f.slice(0, 3).join(', ').toLowerCase()}.\n\n4/ ${aud}`;
      break;
    }
    case 'youtube':
      caption = format === 'post'
        ? `New tour drops this week 🏡 ${p.address} — ${p.beds} bd / ${p.baths} ba in ${loc}.`
        : `Inside a ${money(p.price)} ${p.type} in ${p.city} | ${p.beds} Bed ${p.baths} Bath Tour`;
      description = `Take a walk through ${p.address} in ${loc}.\n\n${p.description}\n\n0:00 Curb appeal\n0:08 Living spaces\n0:19 Kitchen\n0:31 Primary suite\n0:45 Outdoor living\n\n${aud}`;
      break;
  }
  const out = { caption, description, hashtags: hashtagsFor(p, platform, tone), cta: ctaFor(platform, goal) };
  if (tone === 'professional') { out.caption = stripEmoji(out.caption); out.cta = stripEmoji(out.cta); }
  return out;
}
function improveContent(p, platform, format, opts, d) {
  const g = generateContent(p, platform, format, { ...opts, v: (opts.v || 0) + 1 });
  if (platform === 'youtube' && format !== 'post') return { ...d, caption: `${p.city} ${p.type} Tour: ${p.features[0]} & ${p.beds} Bedrooms`.slice(0, 100) };
  if (platform === 'x') return { ...d, caption: g.caption };
  const sensory = [
    `Sunlight pours through every room, and the ${p.features[0].toLowerCase()} makes everyday living feel effortless.`,
    `Every detail has been considered — from the ${p.features[1].toLowerCase()} to the ${p.features[2].toLowerCase()}.`,
  ][(opts.v || 0) % 2];
  const parts = g.caption.split('\n\n');
  parts.splice(1, 0, sensory);
  return { ...d, caption: parts.join('\n\n'), cta: g.cta };
}
function shortenContent(p, platform, format, d) {
  if (platform === 'youtube' && format !== 'post') return { ...d, caption: `${p.beds}-Bed ${p.type} Tour in ${p.city}` };
  const parts = d.caption.split(/\n\n+/);
  if (platform === 'x') return { ...d, caption: parts[0] };
  if (parts.length > 2) return { ...d, caption: [parts[0], parts[parts.length - 1]].join('\n\n') };
  const first = parts[0].split(/(?<=[.!?])\s+/)[0];
  return { ...d, caption: first };
}

/* --------------------------------------------------------------------------
   5. Seeded content calendar (relative dates)
   [propertyId, platform, format, status, dayOffset, time, tone]
   -------------------------------------------------------------------------- */
const SEED = [
  ['p1', 'instagram', 'post', 'published', -2, '10:00', 'luxury'],
  ['p1', 'facebook', 'post', 'published', -2, '12:30', 'friendly'],
  ['p1', 'linkedin', 'post', 'scheduled', 1, '09:00', 'professional'],
  ['p1', 'instagram', 'carousel', 'scheduled', 1, '18:30', 'luxury'],
  ['p1', 'x', 'post', 'review', 2, '12:00', 'friendly'],
  ['p1', 'instagram', 'reel', 'approved', 2, '19:00', 'luxury'],
  ['p1', 'youtube', 'short', 'review', 3, '17:00', 'friendly'],
  ['p1', 'facebook', 'reel', 'review', 4, '11:00', 'friendly'],
  ['p1', 'x', 'thread', 'draft', 5, '08:30', 'professional'],
  ['p1', 'linkedin', 'carousel', 'review', 6, '10:00', 'investment'],
  ['p2', 'instagram', 'post', 'scheduled', 'later', null, 'friendly'],
  ['p2', 'facebook', 'post', 'review', 1, '13:00', 'professional'],
  ['p2', 'linkedin', 'post', 'published', -1, '09:30', 'professional'],
  ['p2', 'youtube', 'short', 'failed', -1, '15:00', 'friendly'],
  ['p2', 'instagram', 'post', 'published', -10, '17:00', 'friendly'],
  ['p3', 'instagram', 'carousel', 'review', 2, '10:30', 'luxury'],
  ['p3', 'facebook', 'post', 'scheduled', 3, '12:00', 'professional'],
  ['p3', 'linkedin', 'post', 'draft', 7, '09:00', 'professional'],
  ['p3', 'instagram', 'post', 'published', -4, '18:00', 'luxury'],
  ['p3', 'facebook', 'post', 'published', -9, '12:00', 'friendly'],
  ['p4', 'instagram', 'reel', 'scheduled', 4, '18:00', 'luxury'],
  ['p4', 'linkedin', 'post', 'review', 5, '09:30', 'investment'],
  ['p4', 'facebook', 'carousel', 'approved', 6, '17:30', 'luxury'],
  ['p4', 'youtube', 'short', 'published', -3, '16:00', 'luxury'],
  ['p4', 'x', 'post', 'rejected', 3, '13:00', 'investment'],
  ['p4', 'instagram', 'post', 'published', -5, '18:30', 'luxury'],
  ['p5', 'instagram', 'post', 'draft', 8, '12:00', 'friendly'],
  ['p5', 'facebook', 'post', 'scheduled', 9, '12:00', 'friendly'],
  ['p5', 'linkedin', 'post', 'review', 10, '11:00', 'investment'],
  ['p5', 'instagram', 'post', 'published', -13, '18:00', 'friendly'],
  ['p6', 'instagram', 'post', 'published', -6, '18:30', 'luxury'],
  ['p6', 'facebook', 'reel', 'published', -8, '11:00', 'luxury'],
  ['p6', 'instagram', 'carousel', 'scheduled', 12, '18:00', 'luxury'],
  ['p6', 'linkedin', 'post', 'scheduled', 14, '09:00', 'professional'],
  ['p6', 'youtube', 'short', 'review', 11, '17:00', 'luxury'],
  ['p6', 'linkedin', 'post', 'published', -7, '09:00', 'professional'],
  ['p6', 'facebook', 'post', 'published', -12, '10:00', 'professional'],
];
const NOTES = {
  'p4:x': 'Price mention needs to match the updated listing sheet before this goes out.',
  'p2:youtube': 'YouTube session expired. Reconnect the channel and retry publishing.',
};

/* --------------------------------------------------------------------------
   6. Floor plans & media assets
   -------------------------------------------------------------------------- */
function floorPlanSVG(title, rooms) {
  const grid = Array.from({ length: 19 }, (_, i) => `<line x1="${i * 22}" y1="0" x2="${i * 22}" y2="300"/>`).join('') + Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${i * 22}" x2="400" y2="${i * 22}"/>`).join('');
  const r = rooms.map(([x, y, w, h, l, a]) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#1E293B" stroke-width="3"/>
    <text x="${x + w / 2}" y="${y + h / 2 - (a ? 2 : -3)}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="9.5" font-weight="600" fill="#1E293B" letter-spacing="1">${l}</text>
    ${a ? `<text x="${x + w / 2}" y="${y + h / 2 + 11}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="8.5" fill="#64748B">${a}</text>` : ''}`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F8FAFC"/><g stroke="#E8EEF5" stroke-width="1">${grid}</g>${r}<path d="M150 270a20 20 0 0 1 20-20" fill="none" stroke="#10B981" stroke-width="1.5"/><text x="20" y="292" font-family="Inter,Arial,sans-serif" font-size="8.5" font-weight="600" fill="#94A3B8" letter-spacing="1.6">${title}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const FLOORPLANS = [
  { propertyId: 'p1', name: 'willow-creek-floor-plan-level-1.svg', title: '1428 WILLOW CREEK DR · LEVEL 1', rooms: [[20, 20, 150, 120, 'LIVING', '18′ × 16′'], [170, 20, 120, 120, 'KITCHEN', '14′ × 13′'], [290, 20, 90, 70, 'PANTRY', '6′ × 8′'], [290, 90, 90, 50, 'BATH', ''], [20, 140, 110, 125, 'OFFICE', '12′ × 14′'], [130, 140, 160, 125, 'DINING', '15′ × 13′'], [290, 140, 90, 125, 'GARAGE', '20′ × 22′']] },
  { propertyId: 'p1', name: 'willow-creek-floor-plan-level-2.svg', title: '1428 WILLOW CREEK DR · LEVEL 2', rooms: [[20, 20, 170, 140, 'PRIMARY SUITE', '17′ × 15′'], [190, 20, 90, 80, 'BATH', '10′ × 9′'], [280, 20, 100, 80, 'CLOSET', '8′ × 9′'], [190, 100, 190, 60, 'HALL', ''], [20, 160, 120, 105, 'BEDROOM 2', '12′ × 11′'], [140, 160, 120, 105, 'BEDROOM 3', '12′ × 11′'], [260, 160, 120, 105, 'BEDROOM 4', '11′ × 11′']] },
  { propertyId: 'p4', name: 'lakeside-ct-main-level.svg', title: '19 LAKESIDE CT · MAIN LEVEL', rooms: [[20, 20, 220, 150, 'GREAT ROOM', '24′ × 18′'], [240, 20, 140, 100, 'KITCHEN', '16′ × 13′'], [240, 120, 140, 50, 'BAR', ''], [20, 170, 140, 95, 'PRIMARY', '16′ × 14′'], [160, 170, 80, 95, 'BATH', ''], [240, 170, 140, 95, 'TERRACE', '20′ × 12′']] },
];
const CREATIVES = [
  { propertyId: 'p1', photo: 0, style: 'dark', kicker: 'Just Listed', title: '1428 Willow Creek Dr', sub: '4 Beds · 3 Baths · $685,000', name: 'willow-creek-just-listed.png' },
  { propertyId: 'p2', photo: 0, style: 'frame', kicker: 'Open House', title: 'Saturday, 11 AM – 2 PM', sub: '305 Pine Ridge Ln · Denver', name: 'pine-ridge-open-house.png' },
  { propertyId: 'p3', photo: 0, style: 'light', kicker: 'Price Improved', title: '77 Maple Grove Way', sub: 'Now $749,000', name: 'maple-grove-price-improved.png' },
  { propertyId: 'p4', photo: 0, style: 'dark', kicker: 'Waterfront', title: 'Live on the water', sub: '19 Lakeside Ct · Naples', name: 'lakeside-waterfront-story.png' },
  { propertyId: 'p5', photo: 1, style: 'frame', kicker: 'Coming Soon', title: '86 Oakwood Terrace', sub: '2 Beds · City views', name: 'oakwood-coming-soon.png' },
  { propertyId: 'p6', photo: 0, style: 'light', kicker: 'New Listing', title: '240 Sunset Blvd', sub: 'Contemporary villa · $895,000', name: 'sunset-villa-new-listing.png' },
];
const VIDEOS = [
  { propertyId: 'p1', photo: 1, name: 'willow-creek-walkthrough.mp4', duration: '1:42' },
  { propertyId: 'p4', photo: 2, name: 'lakeside-drone-tour.mp4', duration: '0:58' },
  { propertyId: 'p6', photo: 3, name: 'sunset-villa-reel-cut.mp4', duration: '0:30' },
  { propertyId: 'p3', photo: 1, name: 'maple-grove-agent-intro.mp4', duration: '2:15' },
];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const sizeFor = (i, base = 1.8) => `${(base + ((i * 37) % 17) / 10).toFixed(1)} MB`;

function buildMedia(properties) {
  const out = [];
  properties.forEach((p, pi) => p.photos.forEach((ph, i) => out.push({
    id: `${p.id}-ph${i}`, kind: 'photo', propertyId: p.id, src: ph.src, thumb: ph.thumb,
    name: `${slug(p.address)}-${slug(ph.label)}.jpg`, label: ph.label, size: sizeFor(pi * 7 + i), dims: '4000 × 2667', uploadedAt: addDays(p.listedAt, 0),
  })));
  FLOORPLANS.forEach((f, i) => { const src = floorPlanSVG(f.title, f.rooms); out.push({ id: `fp${i}`, kind: 'floorplan', propertyId: f.propertyId, src, thumb: src, name: f.name, label: 'Floor plan', size: `${(180 + i * 42)} KB`, dims: 'Vector', uploadedAt: addDays(TODAY, -3 - i) }); });
  CREATIVES.forEach((c, i) => { const p = properties.find(x => x.id === c.propertyId); out.push({ id: `cr${i}`, kind: 'creative', propertyId: c.propertyId, src: p.photos[c.photo].src, thumb: p.photos[c.photo].thumb, creative: c, name: c.name, label: c.kicker, size: sizeFor(i, 0.9), dims: '1080 × 1080', uploadedAt: addDays(TODAY, -1 - i) }); });
  VIDEOS.forEach((v, i) => { const p = properties.find(x => x.id === v.propertyId); out.push({ id: `vd${i}`, kind: 'video', propertyId: v.propertyId, src: p.photos[v.photo].src, thumb: p.photos[v.photo].thumb, name: v.name, label: 'Video', duration: v.duration, size: `${(48 + i * 23)} MB`, dims: '1920 × 1080', uploadedAt: addDays(TODAY, -2 - i * 2) }); });
  return out;
}

/* --------------------------------------------------------------------------
   7. Application state
   -------------------------------------------------------------------------- */
const state = {
  route: 'overview',
  properties: PROPERTIES,
  content: [],
  accounts: ACCOUNTS,
  media: [],
  notifications: [],
  credits: { used: 760, total: 2000 },
  bannerHidden: store.get('bannerHidden', false),
  ui: {
    featuredPlatform: 'instagram',
    propView: store.get('propView', 'grid'), propQ: '', propStatus: 'all', propType: 'all', propSort: 'newest',
    apTab: 'review', apPlatform: 'all',
    mediaView: 'grid', mediaCat: 'all', mediaQ: '', mediaSel: new Set(),
    calView: 'month', calCursor: new Date(TODAY), calSelected: new Date(TODAY), calPlatform: 'all',
    settingsTab: 'profile', settingsDirty: false,
  },
  studio: {
    propertyId: 'p1', platform: 'instagram', format: 'post', images: [0], carouselIdx: 0,
    tone: 'luxury', audience: 'buyers', goal: 'leads', v: 0,
    drafts: {}, generating: false, busy: false, expanded: false,
  },
};

function makeItem({ propertyId, platform, format, status, date, tone = 'professional', audience = 'buyers', goal = 'leads', v = 0, image = 0, i = 0 }) {
  const p = getProp(propertyId);
  const c = generateContent(p, platform, format, { tone, audience, goal, v });
  const gen = new Date(Math.min(date.getTime() - 26 * 3600e3, Date.now() - ((i % 6) + 1) * 2.5 * 3600e3));
  return { id: uid('c'), propertyId, platform, format, status, date, tone, audience, goal, image, images: [image], generatedAt: gen, note: NOTES[`${propertyId}:${platform}`] || '', ...c };
}
function seedContent() {
  state.content = SEED.map(([pid, pl, fmt, st, d, t, tone], i) => makeItem({
    propertyId: pid, platform: pl, format: fmt, status: st, tone,
    date: d === 'later' ? laterToday() : at(d, t),
    v: i % 2, image: (i * 2) % getProp(pid).photos.length, goal: ['leads', 'engagement', 'awareness'][i % 3], i,
  }));
}
const getProp = id => state.properties.find(p => p.id === id);
const getItem = id => state.content.find(c => c.id === id);
const getAcct = id => state.accounts.find(a => a.id === id);
const count = fn => state.content.filter(fn).length;
const itemImg = (c, w = 800) => { const p = getProp(c.propertyId); const ph = p.photos[c.image] || p.photos[0]; return w <= 400 ? ph.thumb : ph.src; };

/* KPI targets from the brief. Bases account for history outside this demo set. */
const KPI_TARGET = { properties: 24, drafts: 18, scheduled: 12, published: 36 };
const weekAgo = addDays(TODAY, -6);
const kpiRaw = () => ({
  properties: state.properties.length,
  drafts: count(c => c.status === 'draft' || c.status === 'review'),
  scheduled: count(c => c.status === 'scheduled'),
  published: count(c => c.status === 'published' && c.date >= weekAgo),
});
let KPI_BASE = {};
const kpis = () => { const r = kpiRaw(); return Object.fromEntries(Object.keys(r).map(k => [k, r[k] + (KPI_BASE[k] || 0)])); };

function propContent(pid) {
  const items = state.content.filter(c => c.propertyId === pid);
  const review = items.filter(c => c.status === 'review' || c.status === 'draft').length;
  const sched = items.filter(c => c.status === 'scheduled' || c.status === 'approved').length;
  if (!items.length) return { label: 'No content yet', cls: 'b-gray', items };
  if (review) return { label: `${review} awaiting review`, cls: 'b-amber', items };
  if (sched) return { label: `${sched} scheduled`, cls: 'b-blue', items };
  return { label: 'All published', cls: 'b-green', items };
}
function initData() {
  seedContent();
  state.media = buildMedia(state.properties);
  const raw = kpiRaw();
  KPI_BASE = Object.fromEntries(Object.keys(KPI_TARGET).map(k => [k, KPI_TARGET[k] - raw[k]]));
  const p1Count = count(c => c.propertyId === 'p1');
  state.notifications = [
    { id: 'n1', icon: 'sparkles', tone: 'green', title: `${p1Count} posts generated`, text: 'AI content is ready for 1428 Willow Creek Dr.', time: new Date(Date.now() - 3 * 3600e3), unread: true, route: 'approvals' },
    { id: 'n2', icon: 'circle-alert', tone: 'red', title: 'YouTube publishing failed', text: 'Channel session expired — reconnect to retry 1 post.', time: new Date(Date.now() - 20 * 3600e3), unread: true, route: 'social' },
    { id: 'n3', icon: 'circle-check', tone: 'blue', title: 'Published to LinkedIn', text: '305 Pine Ridge Ln is now live on your profile.', time: at(-1, '09:31'), unread: true, route: 'calendar' },
    { id: 'n4', icon: 'message-circle', tone: 'gray', title: 'Jordan Lee left a comment', text: '“Can we lead with the rooftop deck?” on 305 Pine Ridge Ln.', time: at(-2, '16:12'), unread: false, route: 'approvals' },
  ];
}

/* ==========================================================================
   8. UI primitives — Modal, ConfirmationDialog, Dropdown, Toast, EmptyState
   ========================================================================== */
const modalStack = [];
function modalInner({ id, title = '', subtitle = '', body = '', footer = '', closable = true, headExtra = '' }) {
  return `
    ${title ? `<div class="modal-head">
      <div class="min-w-0">${headExtra}
        <h2 id="${id}-t" class="text-[18px] font-semibold tracking-tight text-ink">${title}</h2>
        ${subtitle ? `<p class="mt-1 text-[13.5px] text-sub">${subtitle}</p>` : ''}
      </div>
      ${closable ? `<button class="icon-btn -mr-2 -mt-1 flex-none" data-close aria-label="Close dialog">${ic('x', 'w-5 h-5')}</button>` : ''}
    </div>` : ''}
    <div class="modal-body">${body}</div>
    ${footer ? `<div class="modal-foot">${footer}</div>` : ''}`;
}
function openModal(opts = {}) {
  const { size = '', closable = true, onClose, bare = false, label = '' } = opts;
  const id = uid('m');
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" ${opts.title ? `aria-labelledby="${id}-t"` : `aria-label="${esc(label || 'Dialog')}"`}>${bare ? opts.body : modalInner({ ...opts, id })}</div>`;
  $('#modal-root').appendChild(ov);
  const prevFocus = document.activeElement;
  const m = {
    el: ov, box: ov.firstElementChild, id, closable, closed: false,
    update(next) { this.box.innerHTML = next.bare ? next.body : modalInner({ closable, ...next, id }); icons(); focusFirst(); },
    close() {
      if (m.closed) return; m.closed = true;
      ov.classList.add('closing');
      setTimeout(() => ov.remove(), 180);
      modalStack.splice(modalStack.indexOf(m), 1);
      if (!modalStack.length) document.body.classList.remove('no-scroll');
      onClose && onClose();
      if (prevFocus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true });
    },
  };
  function focusFirst() {
    setTimeout(() => {
      const f = ov.querySelector('[autofocus]') || ov.querySelector('.modal-body input:not([type=hidden]):not([type=file]), .modal-body select, .modal-body textarea') || ov.querySelector('.modal-foot .btn-primary') || ov.querySelector('button');
      f && f.focus({ preventScroll: true });
    }, 40);
  }
  ov.addEventListener('mousedown', e => { if (e.target === ov && m.closable) m.close(); });
  ov.addEventListener('click', e => { if (e.target.closest('[data-close]')) m.close(); });
  modalStack.push(m);
  document.body.classList.add('no-scroll');
  closeDropdown();
  icons(); focusFirst();
  return m;
}
const topModal = () => modalStack[modalStack.length - 1];

function confirmDialog({ title, message, confirm = 'Confirm', danger = false, icon = danger ? 'trash-2' : 'circle-help', onConfirm, extra = '' }) {
  const m = openModal({
    size: 'modal-sm', bare: true, label: title,
    body: `
      <div class="p-6 modal-scroll">
        <div class="flex gap-4">
          <div class="w-10 h-10 rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'} grid place-content-center flex-none">${ic(icon, 'w-5 h-5')}</div>
          <div class="min-w-0 flex-1">
            <h2 class="text-[16px] font-semibold text-ink">${title}</h2>
            <p class="mt-1.5 text-[14px] text-sub leading-relaxed">${message}</p>
            ${extra}
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm autofocus>${confirm}</button>
      </div>`,
  });
  m.el.querySelector('[data-confirm]').addEventListener('click', () => { const ret = onConfirm && onConfirm(m); if (ret !== false) m.close(); });
  return m;
}

/* Dropdown */
let dd = null;
function openDropdown(anchor, html, { align = 'right', width, focus = true, cls = '' } = {}) {
  if (dd && dd.anchor === anchor) { closeDropdown(); return null; }
  closeDropdown();
  const el = document.createElement('div');
  el.className = `dropdown ${cls}`;
  el.setAttribute('role', 'menu');
  el.innerHTML = html;
  if (width) el.style.width = typeof width === 'number' ? width + 'px' : width;
  $('#dropdown-root').appendChild(el);
  icons();
  positionDropdown(el, anchor, align);
  anchor.setAttribute('aria-expanded', 'true');
  dd = { el, anchor, align };
  if (focus) setTimeout(() => { const f = el.querySelector('.dd-item'); f && f.focus({ preventScroll: true }); }, 10);
  return el;
}
function positionDropdown(el, anchor, align) {
  const r = anchor.getBoundingClientRect();
  const w = el.offsetWidth, h = el.offsetHeight;
  let left = align === 'right' ? r.right - w : align === 'side' ? (anchor.closest('#sidebar') || anchor).getBoundingClientRect().right + 10 : r.left;
  left = clamp(left, 12, window.innerWidth - w - 12);
  let top = r.bottom + 6;
  if (align === 'side') top = clamp(r.top - 8, 12, window.innerHeight - h - 12);
  else if (top + h > window.innerHeight - 12 && r.top - h - 6 > 12) top = r.top - h - 6;
  el.style.left = left + 'px'; el.style.top = top + 'px';
  el.style.transformOrigin = `${align === 'right' ? 'right' : 'left'} ${top < r.top ? 'bottom' : 'top'}`;
}
function closeDropdown() {
  if (!dd) return;
  dd.anchor.setAttribute('aria-expanded', 'false');
  dd.el.remove(); dd = null;
}
const ddItem = (icon, label, action, attrs = '', danger = false) =>
  `<button class="dd-item ${danger ? 'danger' : ''}" role="menuitem" data-action="${action}" ${attrs}>${ic(icon)}<span class="truncate">${label}</span></button>`;

/* Toast */
function toast(title, msg = '', type = 'success', action = null) {
  const map = {
    success: ['check', 'bg-emerald-500/15 text-emerald-400'],
    ai: ['sparkles', 'bg-indigo-400/20 text-indigo-300'],
    info: ['info', 'bg-sky-500/15 text-sky-300'],
    warn: ['triangle-alert', 'bg-amber-500/15 text-amber-300'],
    error: ['circle-alert', 'bg-red-500/15 text-red-400'],
  };
  const [icon, cls] = map[type] || map.success;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `
    <span class="toast-icon ${cls}">${ic(icon)}</span>
    <div class="min-w-0 flex-1"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>
    ${action ? `<button class="text-[13px] font-semibold text-indigo-300 hover:text-indigo-200 px-1.5 h-6 flex-none" data-t-act>${action.label}</button>` : ''}
    <button class="text-slate-500 hover:text-slate-300 flex-none -mr-1" data-t-close aria-label="Dismiss notification">${ic('x')}</button>`;
  $('#toast-root').appendChild(t);
  icons();
  const root = $('#toast-root');
  while (root.children.length > 3) root.firstElementChild.remove();
  let timer = setTimeout(remove, action ? 6000 : 4200);
  function remove() { clearTimeout(timer); t.classList.add('out'); setTimeout(() => t.remove(), 220); }
  t.addEventListener('mouseenter', () => clearTimeout(timer));
  t.addEventListener('mouseleave', () => { timer = setTimeout(remove, 2500); });
  t.querySelector('[data-t-close]').addEventListener('click', remove);
  if (action) t.querySelector('[data-t-act]').addEventListener('click', () => { remove(); action.fn(); });
}

function emptyState({ icon = 'inbox', title, text = '', action = '' }) {
  return `
    <div class="flex flex-col items-center justify-center text-center py-14 px-6">
      <div class="relative">
        <div class="w-14 h-14 rounded-2xl bg-white border border-line shadow-card grid place-content-center text-slate-500">${ic(icon, 'w-6 h-6')}</div>
        <div class="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-b from-slate-100 to-transparent"></div>
      </div>
      <h3 class="mt-5 text-[15.5px] font-semibold text-ink">${title}</h3>
      ${text ? `<p class="mt-1.5 text-[13.5px] text-sub max-w-sm">${text}</p>` : ''}
      ${action ? `<div class="mt-5">${action}</div>` : ''}
    </div>`;
}
const loadingState = (label = 'Loading…') => `<div class="flex items-center justify-center gap-3 py-16 text-sub text-[13.5px]"><span class="spinner text-brand-600"></span>${label}</div>`;
const skeletonCards = (n = 3) => Array.from({ length: n }, () => `<div class="card overflow-hidden"><div class="skel !rounded-none aspect-[4/3]"></div><div class="p-4 space-y-2.5"><div class="skel h-3 w-1/3"></div><div class="skel h-4 w-2/3"></div><div class="skel h-3 w-1/2"></div></div></div>`).join('');

function setLoading(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.html = btn.innerHTML; btn.classList.add('is-loading'); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>${label || ''}`; }
  else { btn.classList.remove('is-loading'); btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; icons(); }
}

/* Reusable bits */
const pageHeader = ({ title, subtitle, actions = '', eyebrow = '' }) => `
  <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 sm:mb-8">
    <div class="min-w-0">
      ${eyebrow}
      <h1 class="page-title text-[28px] sm:text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink">${/[<]/.test(title) || !/\s/.test(title.trim()) ? title : title.replace(/(\S+)$/, '<span class="tint">$1</span>')}</h1>
      ${subtitle ? `<p class="mt-1.5 text-[15px] text-sub">${subtitle}</p>` : ''}
    </div>
    ${actions ? `<div class="flex flex-wrap items-center gap-2.5">${actions}</div>` : ''}
  </div>`;
const avatar = (src, size = 32, cls = '') => `<img src="${src}" alt="" class="rounded-full object-cover flex-none bg-slate-200 ${cls}" style="width:${size}px;height:${size}px" loading="lazy">`;
const specs = (p, cls = '') => `
  <div class="flex flex-wrap items-center gap-1.5 ${cls.includes('gap') ? '' : ''}">
    <span class="spec-pill" title="Bedrooms">${ic('bed-double')}<b class="tnum">${p.beds}</b><span class="hidden min-[380px]:inline">Beds</span></span>
    <span class="spec-pill" title="Bathrooms">${ic('bath')}<b class="tnum">${p.baths}</b><span class="hidden min-[380px]:inline">Baths</span></span>
    <span class="spec-pill" title="Square feet">${ic('scan')}<b class="tnum">${num(p.sqft)}</b>sqft</span>
  </div>`;
const sectionCard = (title, body, { action = '', sub = '', cls = '', bodyCls = '' } = {}) => `
  <section class="card ${cls}">
    <div class="card-head"><div class="min-w-0"><h2 class="card-title">${title}</h2>${sub ? `<p class="text-[12.5px] text-sub mt-0.5">${sub}</p>` : ''}</div>${action}</div>
    <div class="${bodyCls}">${body}</div>
  </section>`;
const statusDot = st => `<span class="inline-block w-2 h-2 rounded-full flex-none" style="background:${STATUS[st].color}"></span>`;

/* ==========================================================================
   9. Shell — Sidebar & Topbar
   ========================================================================== */
const NAV = [
  { group: 'Workspace', items: [['overview', 'Overview', 'layout-dashboard'], ['properties', 'Properties', 'building-2'], ['studio', 'Content Studio', 'sparkles'], ['calendar', 'Content Calendar', 'calendar-days'], ['approvals', 'Approvals', 'list-checks'], ['media', 'Media Library', 'images']] },
  { group: 'Manage', items: [['social', 'Social Accounts', 'share-2'], ['settings', 'Settings', 'settings']] },
];
const ROUTE_TITLES = Object.fromEntries(NAV.flatMap(g => g.items.map(([r, t]) => [r, t])));

function renderSidebar() {
  const pending = count(c => c.status === 'review');
  const left = state.credits.total - state.credits.used;
  const pct = Math.round((state.credits.used / state.credits.total) * 100);
  const navLink = ([r, label, icon]) => `
    <a href="#/${r}" class="nav-item ${state.route === r ? 'active' : ''}" ${state.route === r ? 'aria-current="page"' : ''} aria-label="${label}" data-tip="${label}${r === 'approvals' && pending ? ` · ${pending} pending` : ''}">
      <span class="nav-ic">${ic(icon)}</span><span class="sb-hide truncate">${label}</span>
      ${r === 'approvals' && pending ? `<span class="nav-badge">${pending}</span>` : ''}
      ${r === 'studio' ? '<span class="sb-hide nav-ai">AI</span>' : ''}
    </a>`;
  const ring = 2 * Math.PI * 15;
  $('#sidebar').innerHTML = `
    <div class="sb-brand">
      <a href="#/overview" class="flex items-center gap-3 min-w-0" aria-label="RexEngine home" data-tip="RexEngine">
        <span class="sb-logo">${LOGO(42)}</span>
        <div class="sb-hide min-w-0">
          <div class="text-ink font-semibold text-[17px] tracking-tight leading-tight">Rex<span class="tint">Engine</span></div>
          <div class="text-[12px] text-sub leading-tight mt-0.5">AI Real Estate Marketing</div>
        </div>
      </a>
      <button class="sb-close icon-btn ml-auto -mr-1" data-action="close-drawer" aria-label="Close menu">${ic('x')}</button>
    </div>

    <nav class="sb-nav thin-scroll" aria-label="Main navigation">
      ${NAV[0].items.map(navLink).join('')}
      <div class="sb-sep" role="separator"></div>
      ${NAV[1].items.map(navLink).join('')}
      <button class="nav-item" data-action="help-menu" data-tip="Help & Support" aria-label="Help & Support" aria-haspopup="menu" aria-expanded="false"><span class="nav-ic">${ic('circle-help')}</span><span class="sb-hide">Help & Support</span></button>
    </nav>

    <div class="sb-foot">
      <div class="sb-hide sb-credits">
        <div class="flex items-center justify-between text-[12.5px]">
          <span class="font-medium text-ink flex items-center gap-1.5">${ic('zap', 'w-3.5 h-3.5 text-brand-600')}AI credits</span>
          <span class="text-sub tnum">${num(left)} left</span>
        </div>
        <div class="usage-bar mt-2.5" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="AI credits used"><i style="width:${pct}%"></i></div>
        <div class="mt-2.5 flex items-center justify-between text-[11.5px]">
          <span class="text-muted tnum">${num(state.credits.used)} / ${num(state.credits.total)} used</span>
          <button class="text-brand-600 font-medium hover:text-brand-700" data-action="upgrade">Upgrade</button>
        </div>
      </div>
      <button class="sb-credit-ring" data-action="upgrade" data-tip="${num(left)} AI credits left" aria-label="AI credits: ${num(left)} left">
        <svg class="cr-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="bg" cx="18" cy="18" r="15"/><circle class="fg" cx="18" cy="18" r="15" stroke-dasharray="${((100 - pct) / 100 * ring).toFixed(1)} ${ring.toFixed(1)}"/></svg>
        ${ic('zap', 'w-4 h-4')}
      </button>
      <button class="sb-user group" data-action="user-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu" data-tip="Alex Morgan">
        ${avatar(AV.alex, 38)}
        <div class="sb-hide min-w-0 flex-1">
          <div class="text-[13.5px] font-medium text-ink truncate">Alex Morgan</div>
          <div class="text-[12px] text-sub truncate">Admin · Morgan & Co.</div>
        </div>
        <span class="sb-hide text-sub group-hover:text-ink transition-colors">${ic('chevron-right')}</span>
      </button>
    </div>`;
}

function renderTopbar() {
  const unread = state.notifications.some(n => n.unread);
  $('#topbar').innerHTML = `
    <div class="topbar-inner">
      <button class="icon-btn lg:hidden -ml-2" data-action="open-drawer" aria-label="Open navigation menu">${ic('menu', 'w-5 h-5')}</button>
      <a href="#/overview" class="md:hidden flex items-center gap-2" aria-label="RexEngine home">${LOGO(30)}<span class="font-semibold text-[15px] tracking-tight">Rex<span class="tint">Engine</span></span></a>
      <div class="hidden md:block min-w-0">
        <div class="top-crumb">Morgan & Co. Realty</div>
        <div id="crumb" class="top-title" aria-current="page">${ROUTE_TITLES[state.route]}</div>
      </div>
      <div class="flex-1"></div>
      <div class="top-search input-icon hidden lg:block">${ic('search')}
        <input id="global-search" class="input text-[13.5px]" placeholder="Search properties, posts, pages…" autocomplete="off" aria-label="Search" role="combobox" aria-expanded="false" aria-controls="search-results">
        <span class="kbd">${isMac ? '⌘' : 'Ctrl'} K</span>
      </div>
      <span class="pill-btn hidden xl:inline-flex" aria-label="Today">${ic('calendar')}${fmtDate(new Date(), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      <button class="round-btn lg:hidden" data-action="mobile-search" aria-label="Search">${ic('search')}</button>
      <button class="round-btn" data-action="notif-menu" aria-label="Notifications${unread ? ' (unread)' : ''}" aria-haspopup="menu" aria-expanded="false">${ic('bell')}${unread ? '<span class="notif-dot"></span>' : ''}</button>
      <button class="pill-btn !pl-1 !pr-1 sm:!pr-3.5" data-action="user-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">
        ${avatar(AV.alex, 34)}
        <span class="hidden sm:block text-left leading-tight"><span class="block text-[13px] font-medium text-ink">Alex Morgan</span><span class="block text-[11.5px] text-sub font-normal">Admin</span></span>
        <span class="hidden sm:block text-muted">${ic('chevron-down', 'w-4 h-4')}</span>
      </button>
    </div>`;
}

/* Drawer & rail */
function openDrawer() { $('#sidebar').classList.add('open'); $('#sb-overlay').classList.add('show'); document.body.classList.add('no-scroll'); setTimeout(() => { const a = $('#sidebar .nav-item.active'); a && a.focus(); }, 60); }
function closeDrawer() { $('#sidebar').classList.remove('open'); $('#sb-overlay').classList.remove('show'); if (!modalStack.length) document.body.classList.remove('no-scroll'); }
function toggleRail() { const on = !document.documentElement.classList.contains('rail'); document.documentElement.classList.toggle('rail', on); store.set('rail', on); }

/* Menus */
function userMenuHTML() {
  return `
    <div class="flex items-center gap-3 px-2.5 py-2">${avatar(AV.alex, 36)}<div class="min-w-0"><div class="text-[13.5px] font-semibold text-ink">Alex Morgan</div><div class="text-[12px] text-sub truncate">alex@morganco.realty</div></div></div>
    <div class="dd-sep"></div>
    ${ddItem('user', 'Profile', 'go', 'data-route="settings" data-tab="profile"')}
    ${ddItem('building', 'Workspace settings', 'go', 'data-route="settings" data-tab="workspace"')}
    ${ddItem('credit-card', 'Plan & billing', 'upgrade')}
    ${ddItem('keyboard', 'Keyboard shortcuts', 'shortcuts')}
    <div class="dd-sep"></div>
    ${ddItem('log-out', 'Sign out', 'sign-out')}`;
}
function helpMenuHTML() {
  return `
    <div class="dd-label">Help & resources</div>
    ${ddItem('play', 'Product tour', 'tour')}
    ${ddItem('keyboard', 'Keyboard shortcuts', 'shortcuts')}
    ${ddItem('book-open', 'Help center', 'demo-toast', 'data-msg="The help center opens in a new tab in the full product."')}
    ${ddItem('message-circle', 'Contact support', 'demo-toast', 'data-msg="Support chat is available in the full product."')}`;
}
function notifMenuHTML() {
  const tones = { green: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600', gray: 'bg-slate-100 text-slate-600' };
  return `
    <div class="flex items-center justify-between px-2.5 pt-1.5 pb-2">
      <div class="text-[14px] font-semibold text-ink">Notifications</div>
      <button class="text-[12.5px] font-medium text-brand-700 hover:underline" data-action="notif-read-all">Mark all as read</button>
    </div>
    <div class="max-h-[360px] overflow-y-auto thin-scroll -mx-1.5 px-1.5">
      ${state.notifications.map(n => `
        <button class="dd-item !items-start !gap-3 !py-2.5" data-action="notif-open" data-id="${n.id}">
          <span class="w-8 h-8 rounded-lg grid place-content-center flex-none ${tones[n.tone]}">${ic(n.icon)}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2"><span class="text-[13px] font-medium text-ink truncate">${n.title}</span>${n.unread ? '<span class="w-1.5 h-1.5 rounded-full bg-brand-500 flex-none"></span>' : ''}</span>
            <span class="block text-[12.5px] text-sub leading-snug mt-0.5 whitespace-normal">${n.text}</span>
            <span class="block text-[11.5px] text-muted mt-1">${timeAgo(n.time)}</span>
          </span>
        </button>`).join('')}
    </div>`;
}

/* Global search */
function searchResults(q) {
  q = q.trim().toLowerCase();
  const pages = NAV.flatMap(g => g.items).filter(([, t]) => !q || t.toLowerCase().includes(q)).slice(0, q ? 4 : 3);
  const props = state.properties.filter(p => !q || `${p.address} ${p.city} ${p.type} ${p.neighborhood}`.toLowerCase().includes(q)).slice(0, 4);
  const content = q ? state.content.filter(c => { const p = getProp(c.propertyId); return `${c.caption} ${p.address} ${PLATFORMS[c.platform].name}`.toLowerCase().includes(q); }).slice(0, 3) : [];
  const actions = [['plus', 'Import a property', 'add-property'], ['sparkles', 'Generate content with AI', 'go', 'data-route="studio"']].filter(a => !q || a[1].toLowerCase().includes(q));
  if (!pages.length && !props.length && !content.length && !actions.length) return `<div class="px-3 py-8 text-center text-[13px] text-sub">No results for “${esc(q)}”</div>`;
  const sec = (label, html) => html ? `<div class="dd-label">${label}</div>${html}` : '';
  return [
    sec('Properties', props.map(p => `<button class="dd-item" data-action="view-property" data-id="${p.id}"><img src="${p.photos[0].thumb}" alt="" class="w-8 h-8 rounded-md object-cover flex-none"><span class="min-w-0"><span class="block truncate text-ink font-medium">${p.address}</span><span class="block text-[12px] text-sub truncate">${p.city}, ${p.state} · ${money(p.price)}</span></span></button>`).join('')),
    sec('Content', content.map(c => `<button class="dd-item" data-action="preview-item" data-id="${c.id}">${pIcon(c.platform, 'sm')}<span class="min-w-0"><span class="block truncate text-ink">${esc(c.caption.split('\n')[0])}</span><span class="block text-[12px] text-sub">${STATUS[c.status].label} · ${fmtLong(c.date)}</span></span></button>`).join('')),
    sec('Pages', pages.map(([r, t, i]) => ddItem(i, t, 'go', `data-route="${r}"`)).join('')),
    sec('Quick actions', actions.map(a => ddItem(a[0], a[1], a[2], a[3] || '')).join('')),
  ].join('');
}
function openSearch(input) {
  const html = `<div id="search-results">${searchResults(input.value)}</div>`;
  if (dd && dd.anchor === input) { dd.el.innerHTML = html; icons(); return; }
  openDropdown(input, html, { align: 'left', width: Math.max(input.offsetWidth, 340), focus: false });
  input.setAttribute('aria-expanded', 'true');
}
function openMobileSearch() {
  const m = openModal({
    title: 'Search', size: 'modal-sm',
    body: `<div class="input-icon">${ic('search')}<input id="m-search" class="input" placeholder="Search properties, content, pages…" autocomplete="off" autofocus></div><div id="m-search-res" class="mt-3 -mx-2">${searchResults('')}</div>`,
  });
  const inp = m.el.querySelector('#m-search');
  inp.addEventListener('input', () => { m.el.querySelector('#m-search-res').innerHTML = searchResults(inp.value); icons(); });
  m.el.addEventListener('click', e => { if (e.target.closest('[data-action]')) m.close(); });
}

function openShortcuts() {
  const k = isMac ? '⌘' : 'Ctrl';
  const rows = [[`${k} K`, 'Search everything'], ['/', 'Focus search'], ['G then P', 'Go to Properties'], ['G then S', 'Go to Content Studio'], ['G then C', 'Go to Calendar'], ['G then A', 'Go to Approvals'], ['Esc', 'Close dialogs & menus']];
  openModal({ title: 'Keyboard shortcuts', subtitle: 'Move faster around RexEngine.', size: 'modal-sm', body: `<div class="divide-y divide-line -my-2">${rows.map(([key, l]) => `<div class="flex items-center justify-between py-2.5 text-[13.5px]"><span class="text-slate-600">${l}</span><span class="flex gap-1">${key.split(' ').map(x => x === 'then' ? '<span class="text-muted text-[12px] px-0.5">then</span>' : `<kbd class="kbd !h-6 !text-[12px] !text-slate-600">${x}</kbd>`).join('')}</span></div>`).join('')}</div>` });
}

function openTour() {
  const steps = [
    ['link', 'Import a listing', 'Paste a listing URL or add details manually. RexEngine extracts specs, photos and features.'],
    ['sparkles', 'Generate with AI', 'Create platform-specific posts for Instagram, Facebook, LinkedIn, X and YouTube in one click.'],
    ['list-checks', 'Review & approve', 'Edit copy, preview each platform and approve content before it goes live.'],
    ['calendar-clock', 'Schedule & publish', 'Plan everything on the content calendar and publish to connected accounts.'],
  ];
  openModal({
    size: 'modal-lg', title: 'How RexEngine works', subtitle: 'From property listing to published posts in four steps.',
    body: `<div class="grid sm:grid-cols-2 gap-3">${steps.map(([i, t, d], n) => `<div class="rounded-xl border border-line p-4"><div class="flex items-center gap-3"><span class="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 grid place-content-center">${ic(i)}</span><span class="text-[12px] font-semibold text-muted">STEP ${n + 1}</span></div><div class="mt-3 font-semibold text-ink">${t}</div><p class="mt-1 text-[13.5px] text-sub leading-relaxed">${d}</p></div>`).join('')}</div>`,
    footer: `<button class="btn btn-secondary" data-close>Close</button><button class="btn btn-primary" data-close data-action="add-property">${ic('plus')}Import your first listing</button>`,
  });
}

/* ==========================================================================
   10. Overview (Dashboard)
   ========================================================================== */
const addedThisMonth = () => 3 + state.properties.filter(p => p.listedAt > NOW).length;
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

function statCard({ icon, tint, value, label, foot, trend, route }) {
  return `
    <a href="#/${route}" class="card card-hover p-4 sm:p-5 block group min-w-0" aria-label="${label}: ${value}">
      <div class="flex items-start justify-between">
        <div class="stat-icon ${tint}">${ic(icon)}</div>
        ${trend ? `<span class="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[12px] font-medium ${trend.up ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}">${ic(trend.up ? 'trending-up' : 'minus', 'w-3.5 h-3.5')}${trend.text}</span>` : ''}
      </div>
      <div class="mt-4 text-[28px] leading-none font-semibold tracking-tight text-ink tnum">${value}</div>
      <div class="mt-2 text-[13px] sm:text-[13.5px] font-medium text-slate-600 truncate">${label}</div>
      <div class="mt-3 pt-3 border-t border-line text-[12px] sm:text-[12.5px] text-sub flex items-center justify-between gap-2 min-w-0 [&>span:first-child]:truncate">${foot}<span class="text-muted group-hover:text-brand-600 transition-colors">${ic('arrow-up-right', 'w-4 h-4')}</span></div>
    </a>`;
}

/* Small visual helpers (Overview hero) */
const sparkBars = (vals, tone) => {
  const max = Math.max(...vals);
  return `<div class="spark" data-tone="${tone}" aria-hidden="true">${vals.map((v, k) => `<i style="height:${Math.max(10, (v / max) * 100)}%;--k:${k};opacity:${(0.45 + 0.55 * (k / (vals.length - 1))).toFixed(2)}"></i>`).join('')}</div>`;
};
const deltaPill = (text, tone = 'up', icon = tone === 'up' ? 'arrow-up' : tone === 'down' ? 'arrow-down' : 'clock-3') => `<span class="delta ${tone}">${ic(icon, 'w-3 h-3')}${text}</span>`;

function renderOverview() {
  const k = kpis();
  const review = count(c => c.status === 'review');
  const next = state.content.filter(c => c.status === 'scheduled' && c.date > new Date()).sort((a, b) => a.date - b.date)[0];
  const p = getProp('p1');
  return `
    ${overviewHero(p, k, review, next)}

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
      ${featuredCard(p)}
      ${pipelineCard(p)}
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
      ${upcomingCard()}
      ${accountsCard()}
    </div>`;
}

function overviewHero(p, k, review, next) {
  const all = state.content;
  const byP = P_ORDER.map(x => ({ id: x, n: all.filter(c => c.platform === x).length }));
  const maxP = Math.max(1, ...byP.map(b => b.n));
  const propItems = all.filter(c => c.propertyId === p.id);
  const connected = state.accounts.filter(a => a.status === 'connected').length;
  const chip = (x, pos, d) => {
    const its = propItems.filter(c => c.platform === x);
    const st = its.length ? STATUS[its.sort((a, b) => b.generatedAt - a.generatedAt)[0].status].label : 'Not started';
    const top = pos.includes('pin-top');
    const pin = `<span class="pin" style="--c:${({ instagram: '#E1306C', facebook: '#1877F2', linkedin: '#0A66C2', x: '#111827', youtube: '#FF0033' })[x]}"></span>`;
    return `
      <button class="chip-pin ${pos}" style="--d:${d}s" data-action="studio-open" data-prop="${p.id}" data-platform="${x}" aria-label="${PLATFORMS[x].name}: ${its.length} posts, ${st}. Open in Content Studio">
        ${top ? pin : ''}
        <span class="orb-chip">${pIcon(x, 'md')}<span class="min-w-0 text-left"><small>${PLATFORMS[x].name}</small><b>${its.length ? `${its.length} post${its.length > 1 ? 's' : ''}` : 'Generate'}</b></span></span>
        ${top ? '' : pin}
      </button>`;
  };
  return `
    <section class="ov-hero" aria-labelledby="ov-title">
      <div class="ov-grid">

        <div class="ov-left">
          <p class="ov-date in-blur" style="--d:.15s">${ic('calendar', 'w-4 h-4')}${fmtDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 id="ov-title" class="ov-title">
            <span class="mask"><span style="--d:.25s">${greeting()},</span></span>
            <span class="mask"><span class="tint" style="--d:.36s">Alex</span></span>
          </h1>
          <p class="ov-sub in-blur" style="--d:.45s">Your property marketing, all in one place.</p>

          <div class="ov-stat in-blur" style="--d:.55s">
            <span class="label">Published this week</span>
            <span class="big tnum"><b data-count="${k.published}">${k.published}</b> <small>posts</small></span>
            <span class="flex items-center gap-2 flex-wrap">${deltaPill('+12%')}<span class="text-[12.5px] text-sub">vs last week · ${connected} channels live</span></span>
          </div>

          <div class="flex flex-wrap gap-2.5 in-blur" style="--d:.62s">
            <button class="btn btn-primary" data-action="add-property">${ic('plus')}Add Property</button>
            <button class="btn btn-secondary" data-action="go" data-route="studio">${ic('wand-sparkles')}Create Content</button>
          </div>

          <div class="ov-mini">
            <a href="#/properties" class="card ov-row in-blur" style="--d:.72s">
              <span class="stat-icon bg-blue-50 text-blue-600">${ic('building-2')}</span>
              <span class="min-w-0 flex-1"><span class="block text-[12.5px] text-sub">Total properties</span><span class="block text-[21px] font-semibold tracking-tight tnum leading-tight"><b data-count="${k.properties}" class="font-semibold">${k.properties}</b></span></span>
              <span class="flex flex-col items-end gap-1">${deltaPill(`+${addedThisMonth()}`)}<span class="text-[11px] text-muted">this month</span></span>
            </a>
            <a href="#/approvals" class="card ov-row in-blur" style="--d:.82s">
              <span class="stat-icon bg-amber-50 text-amber-600">${ic('file-pen-line')}</span>
              <span class="min-w-0 flex-1"><span class="block text-[12.5px] text-sub">Content drafts</span><span class="block text-[21px] font-semibold tracking-tight tnum leading-tight"><b data-count="${k.drafts}" class="font-semibold">${k.drafts}</b></span></span>
              <span class="flex flex-col items-end gap-1">${deltaPill(`${review} to review`, 'warn', 'eye')}<span class="text-[11px] text-muted">approvals</span></span>
            </a>
            <a href="#/calendar" class="card ov-row in-blur" style="--d:.92s">
              <span class="stat-icon bg-brand-50 text-brand-600">${ic('calendar-clock')}</span>
              <span class="min-w-0 flex-1"><span class="block text-[12.5px] text-sub">Scheduled posts</span><span class="block text-[21px] font-semibold tracking-tight tnum leading-tight"><b data-count="${k.scheduled}" class="font-semibold">${k.scheduled}</b></span></span>
              <span class="flex flex-col items-end gap-1 min-w-0"><span class="text-[11.5px] font-medium text-ink truncate max-w-[110px]">${next ? relDay(next.date) : 'Nothing queued'}</span><span class="text-[11px] text-muted">${next ? fmtTime(next.date) : ''}</span></span>
            </a>
          </div>
        </div>

        <div class="ov-center">
          <div class="orb-wrap">
            <div class="orb-halo" aria-hidden="true"></div>
            <svg class="orbits" viewBox="0 0 500 500" aria-hidden="true">
              <defs>
                <path id="ovOrbitA" d="M 30 290 A 225 86 -14 1 1 470 210 A 225 86 -14 1 1 30 290"/>
                <path id="ovOrbitB" d="M 60 160 A 205 70 22 1 1 440 340 A 205 70 22 1 1 60 160"/>
              </defs>
              <use href="#ovOrbitA" class="orbit-line"/><use href="#ovOrbitB" class="orbit-line o2"/>
              <circle r="4.5" class="orbit-dot"><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#ovOrbitA"/></animateMotion></circle>
              <circle r="3.5" class="orbit-dot d2"><animateMotion dur="12s" begin="-4s" repeatCount="indefinite"><mpath href="#ovOrbitB"/></animateMotion></circle>
              <circle r="3" class="orbit-dot d3"><animateMotion dur="9s" begin="-5s" repeatCount="indefinite"><mpath href="#ovOrbitA"/></animateMotion></circle>
            </svg>
            <div class="orb-float">
              <button class="orb" data-action="view-property" data-id="${p.id}" aria-label="View featured property ${p.address}">
                <span class="orb-img" style="background-image:url('${p.photos[0].src}')"></span>
                <span class="orb-shade"></span><span class="orb-gloss"></span>
              </button>
            </div>
            ${chip('instagram', 'c-ig', 1.3)}
            ${chip('linkedin', 'c-li', 1.42)}
            ${chip('youtube', 'c-yt', 1.54)}
            ${chip('facebook', 'c-fb pin-top', 1.66)}
            ${chip('x', 'c-x pin-top', 1.78)}
          </div>
          <div class="orb-caption in-blur" style="--d:1.1s">
            <span class="min-w-0"><span class="block text-[11.5px] text-sub truncate">Featured · ${p.neighborhood}, ${p.city}</span><span class="block text-[14px] font-medium text-ink truncate">${p.address} · <span class="tnum">${money(p.price)}</span></span></span>
            <button class="btn btn-primary btn-sm flex-none" data-action="studio-open" data-prop="${p.id}">${ic('sparkles')}Generate</button>
          </div>
        </div>

        <div class="ov-right">
          <div class="card ov-chart in-blur" style="--d:.7s">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[14px] font-medium text-ink">Engagement trend</span>
              <span class="ov-select">Last 30 days ${ic('chevron-down', 'w-3 h-3')}</span>
            </div>
            <div class="relative mt-3">
              <span class="chart-flag">+12%</span>
              <svg viewBox="0 0 260 120" preserveAspectRatio="none" role="img" aria-label="Engagement rising over the last 30 days (sample data)">
                <defs><linearGradient id="ovArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B55E6" stop-opacity=".3"/><stop offset="1" stop-color="#5B55E6" stop-opacity="0"/></linearGradient></defs>
                <g class="grid-lines"><line x1="0" y1="20" x2="260" y2="20"/><line x1="0" y1="50" x2="260" y2="50"/><line x1="0" y1="80" x2="260" y2="80"/><line x1="0" y1="110" x2="260" y2="110"/></g>
                <path class="area-fill" d="M0,98 C14,96 22,92 34,93 S52,86 64,87 S84,80 96,82 S116,74 128,72 S146,76 158,66 S180,58 192,56 S214,48 226,40 S246,30 260,24 L260,120 L0,120 Z" fill="url(#ovArea)"/>
                <path class="area-line" d="M0,98 C14,96 22,92 34,93 S52,86 64,87 S84,80 96,82 S116,74 128,72 S146,76 158,66 S180,58 192,56 S214,48 226,40 S246,30 260,24" fill="none"/>
                <circle class="area-end" cx="258" cy="24.5" r="4"/>
              </svg>
              <div class="flex justify-between text-[10.5px] text-muted mt-1.5"><span>${fmtDate(addDays(TODAY, -30))}</span><span>${fmtDate(addDays(TODAY, -20))}</span><span>${fmtDate(addDays(TODAY, -10))}</span><span>Today</span></div>
            </div>
          </div>

          <div class="card ov-bars in-blur" style="--d:.82s">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[14px] font-medium text-ink">Posts by platform</span>
              <a href="#/calendar" class="ov-select">All time ${ic('chevron-right', 'w-3 h-3')}</a>
            </div>
            <ul class="mt-3.5 space-y-3">
              ${byP.map(b => `<li class="ov-bar">${pIcon(b.id, 'sm')}<span class="text-[13px] text-slate-700">${PLATFORMS[b.id].name}</span><span class="track"><i class="fill f-${b.id}" style="width:${Math.max(6, Math.round((b.n / maxP) * 100))}%"></i></span><b class="tnum">${b.n}</b></li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="ov-bottom">
          <a href="#/approvals" class="card ov-kpi in-blur" style="--d:.95s">
            <span class="ov-kpi-h">${ic('list-checks', 'w-4 h-4 text-amber-500')}Awaiting review</span>
            <span class="val tnum"><b data-count="${review}">${review}</b> <small>posts</small></span>
            ${sparkBars([2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8], 'orange')}
            <span class="flex items-center gap-2">${deltaPill('Today', 'warn')}<span class="text-[11.5px] text-sub">review queue</span></span>
          </a>
          <a href="#/calendar" class="card ov-kpi in-blur" style="--d:1.02s">
            <span class="ov-kpi-h">${ic('calendar-clock', 'w-4 h-4 text-blue-500')}Scheduled</span>
            <span class="val tnum"><b data-count="${k.scheduled}">${k.scheduled}</b> <small>queued</small></span>
            ${sparkBars([3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10], 'blue')}
            <span class="flex items-center gap-2">${deltaPill('+4')}<span class="text-[11.5px] text-sub">vs last week</span></span>
          </a>
          <a href="#/studio" class="card ov-kpi in-blur" style="--d:1.09s">
            <span class="ov-kpi-h">${ic('sparkles', 'w-4 h-4 text-brand-600')}AI generations</span>
            <span class="val tnum"><b data-count="${state.credits.used}">${num(state.credits.used)}</b> <small>credits</small></span>
            ${sparkBars([4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10], 'indigo')}
            <span class="flex items-center gap-2">${deltaPill(`${num(state.credits.total - state.credits.used)} left`, 'neutral', 'zap')}</span>
          </a>
          <a href="#/social" class="card ov-kpi in-blur" style="--d:1.16s">
            <span class="ov-kpi-h">${ic('share-2', 'w-4 h-4 text-emerald-500')}Channels live</span>
            <span class="val tnum"><b data-count="${connected}">${connected}</b> <small>of 5</small></span>
            ${sparkBars([1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4].map(v => Math.min(v, connected || 1)), 'green')}
            <span class="flex items-center gap-2">${connected < 5 ? deltaPill(`${5 - connected} to connect`, 'warn', 'plug') : deltaPill('All connected')}</span>
          </a>
          <button class="card ov-promo in-blur" style="--d:1.23s" data-action="add-property">
            <span class="ov-promo-text">
              <b>Your Next Listing, Live in Minutes</b>
              <span>Paste a listing URL or add details manually. AI drafts every platform.</span>
              <span class="btn btn-primary btn-xs">${ic('download')}Import a listing</span>
            </span>
            <span class="ov-promo-img" aria-hidden="true" style="background-image:url('${U('1613490493576-7fde63acd811', 700, 420)}')"></span>
          </button>
        </div>

      </div>
    </section>`;
}

/* Count-up for [data-count] numbers inside a freshly rendered page */
function countUp(root) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('[data-count]', root).forEach(el => {
    const target = Number(el.dataset.count);
    if (!target) return;
    const host = el.closest('[style*="--d"]');
    const delay = host ? parseFloat(getComputedStyle(host).getPropertyValue('--d')) * 1000 || 0 : 0;
    el.textContent = '0';
    setTimeout(() => {
      const t0 = performance.now(), dur = 1100;
      const step = now => { const t = Math.min(1, (now - t0) / dur); el.textContent = num(Math.round(target * (1 - Math.pow(1 - t, 3)))); if (t < 1 && document.contains(el)) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, delay + 120);
  });
}

function featuredCaption(p) {
  const pl = state.ui.featuredPlatform;
  const item = state.content.filter(c => c.propertyId === p.id && c.platform === pl).sort((a, b) => b.generatedAt - a.generatedAt)[0];
  const c = item || generateContent(p, pl, PLATFORMS[pl].formats[0], { tone: 'luxury' });
  return { text: c.caption, tags: c.hashtags, item };
}
function featuredPreviewHTML(p) {
  const pl = state.ui.featuredPlatform;
  const c = featuredCaption(p);
  return `
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <span class="ai-badge">${ic('sparkles')}AI content preview</span>
      <div class="flex items-center gap-1" role="tablist" aria-label="Preview platform">
        ${P_ORDER.map(x => `<button role="tab" aria-selected="${x === pl}" class="rounded-[7px] p-[3px] transition-all ${x === pl ? 'bg-white shadow-card ring-1 ring-line' : 'opacity-55 hover:opacity-100 grayscale-[.3]'}" data-action="feat-platform" data-p="${x}" aria-label="${PLATFORMS[x].name}">${pIcon(x, 'xs')}</button>`).join('')}
      </div>
    </div>
    <p class="mt-3 text-[13.5px] text-slate-700 leading-relaxed line-clamp-4 pv-fade">${esc(c.text.replace(/\s*\n+\s*/g, ' '))}</p>
    <div class="mt-2.5 flex items-center justify-between gap-3">
      <span class="text-[12.5px] text-brand-700 truncate">${esc(c.tags)}</span>
      ${c.item ? `<span class="flex-none">${badge(c.item.status)}</span>` : ''}
    </div>`;
}
function featuredCard(p) {
  return `
    <section class="card overflow-hidden xl:col-span-2" aria-labelledby="feat-title">
      <div class="grid md:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] h-full">
        <div class="relative img-zoom min-h-[240px] sm:min-h-[300px] bg-slate-200">
          <img src="${p.photos[0].src}" alt="${p.address} exterior" class="absolute inset-0 w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10"></div>
          <div class="absolute top-4 left-4 right-4 flex items-center justify-between">${glassBadge(p.status)}<span class="badge b-dark">${ic('images')}${p.photos.length} photos</span></div>
          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
            <div><div class="text-[11.5px] uppercase tracking-[0.12em] text-white/75 font-medium">Featured listing</div><div class="text-[26px] font-bold tracking-tight leading-tight tnum">${money(p.price)}</div></div>
            <div class="hidden sm:flex gap-1.5">${p.photos.slice(1, 4).map(ph => `<img src="${ph.thumb}" alt="" class="w-11 h-11 rounded-lg object-cover ring-2 ring-white/70">`).join('')}</div>
          </div>
        </div>
        <div class="p-5 sm:p-6 flex flex-col min-w-0">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-[12px] font-medium uppercase tracking-wide text-sub">${p.type}</div>
              <h2 id="feat-title" class="mt-0.5 text-[19px] font-semibold tracking-tight text-ink">${p.address}</h2>
              <p class="mt-1 text-[13.5px] text-sub flex items-center gap-1.5">${ic('map-pin', 'w-3.5 h-3.5 flex-none')}${p.neighborhood}, ${p.city}, ${p.state} ${p.zip}</p>
            </div>
            <button class="icon-btn -mr-2 -mt-1" data-action="prop-menu" data-id="${p.id}" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">${ic('ellipsis')}</button>
          </div>
          <div class="mt-4">${specs(p)}</div>
          <div id="feat-preview" class="mt-4 rounded-xl border border-line p-4">${featuredPreviewHTML(p)}</div>
          <div class="mt-auto pt-5 flex flex-wrap gap-2.5">
            <button class="btn btn-primary flex-1 sm:flex-none" data-action="studio-open" data-prop="${p.id}">${ic('wand-sparkles')}Generate Content</button>
            <button class="btn btn-secondary flex-1 sm:flex-none" data-action="view-property" data-id="${p.id}">${ic('eye')}View Property</button>
          </div>
        </div>
      </div>
    </section>`;
}

function pipelineSteps(pid) {
  const items = state.content.filter(c => c.propertyId === pid);
  const n = items.length;
  const by = st => items.filter(c => c.status === st).length;
  const pending = by('review') + by('draft');
  const approvedTotal = by('approved') + by('scheduled') + by('published');
  const platforms = new Set(items.map(c => c.platform)).size;
  const p = getProp(pid);
  const done = [true, n > 0, n > 0 && pending === 0, n > 0 && pending === 0 && by('approved') === 0, n > 0 && by('published') === n];
  const activeIdx = done.indexOf(false);
  const steps = [
    { icon: 'download', title: 'Property Imported', sub: `via listing URL · ${fmtDate(p.listedAt)}, ${fmtTime(p.listedAt)}` },
    { icon: 'sparkles', title: 'AI Content Generated', sub: `${n} posts across ${platforms} platforms` },
    { icon: 'list-checks', title: 'Review & Approve', sub: `${approvedTotal} of ${n} approved${pending ? ` · ${pending} pending` : ''}`, progress: n ? approvedTotal / n : 0 },
    { icon: 'calendar-clock', title: 'Scheduled', sub: `${by('scheduled')} posts queued${by('approved') ? ` · ${by('approved')} ready to schedule` : ''}` },
    { icon: 'send', title: 'Published', sub: `${by('published')} live${by('failed') ? ` · ${by('failed')} failed` : ''}` },
  ];
  return { steps, done, activeIdx, pending, n, approvedTotal };
}
function pipelineCard(p) {
  const { steps, done, activeIdx, pending, n, approvedTotal } = pipelineSteps(p.id);
  const pct = Math.round(((done.filter(Boolean).length) / steps.length) * 100);
  return `
    <section class="card flex flex-col" aria-labelledby="pipe-title">
      <div class="card-head">
        <div class="min-w-0"><h2 id="pipe-title" class="card-title">Content Pipeline</h2><p class="text-[12.5px] text-sub mt-0.5 truncate">${p.address} campaign</p></div>
        <span class="badge b-indigo tnum">${pct}% complete</span>
      </div>
      <div class="p-5 flex-1">
        <ol class="pipe-steps">
          ${steps.map((s, i) => {
            const st = done[i] ? 'done' : i === activeIdx ? 'active' : 'pending';
            return `
            <li class="pipe-step ${st}">
              <span class="pipe-dot">${ic(st === 'done' ? 'check' : s.icon)}</span>
              <div class="min-w-0 flex-1 pt-0.5">
                <div class="flex items-center gap-2 flex-wrap"><span class="text-[13.5px] font-semibold ${st === 'pending' ? 'text-slate-500' : 'text-ink'}">${s.title}</span>${st === 'active' ? '<span class="badge b-amber !h-5 !text-[11px]">In progress</span>' : ''}</div>
                <div class="text-[12.5px] text-sub mt-0.5">${s.sub}</div>
                ${s.progress !== undefined && st !== 'pending' ? `<div class="progress mt-2 max-w-[220px]"><i style="width:${Math.round(s.progress * 100)}%"></i></div>` : ''}
              </div>
            </li>`;
          }).join('')}
        </ol>
      </div>
      <div class="px-5 pb-5">
        ${pending ? `<button class="btn btn-secondary w-full" data-action="go" data-route="approvals">${ic('list-checks')}Review ${pending} pending post${pending > 1 ? 's' : ''}</button>`
          : `<button class="btn btn-secondary w-full" data-action="go" data-route="calendar">${ic('calendar-days')}View in calendar</button>`}
      </div>
    </section>`;
}

function upcomingItems(limit = 6) {
  const now = new Date();
  return state.content.filter(c => c.date >= now && ['review', 'draft', 'approved', 'scheduled'].includes(c.status)).sort((a, b) => a.date - b.date).slice(0, limit);
}
function itemMenuBtn(c, cls = '') { return `<button class="icon-btn !w-8 !h-8 ${cls}" data-action="item-menu" data-id="${c.id}" aria-label="Actions for post" aria-haspopup="menu" aria-expanded="false">${ic('ellipsis')}</button>`; }
function upcomingCard() {
  const items = upcomingItems();
  const rows = items.map(c => {
    const p = getProp(c.propertyId);
    return `
      <tr>
        <td class="whitespace-nowrap"><div class="text-[13px] font-medium text-ink">${relDay(c.date)}</div><div class="text-[12px] text-sub tnum">${fmtTime(c.date)}</div></td>
        <td><div class="flex items-center gap-3 min-w-0"><img src="${itemImg(c, 400)}" alt="" class="w-10 h-10 rounded-lg object-cover flex-none thumb"><div class="min-w-0"><div class="text-[13px] font-medium text-ink truncate max-w-[150px]">${p.address}</div><div class="text-[12px] text-sub truncate">${p.city}, ${p.state}</div></div></div></td>
        <td><div class="flex items-center gap-2 whitespace-nowrap">${pIcon(c.platform, 'sm')}<span class="text-[12.5px] text-slate-600">${FORMATS[c.format].label}</span></div></td>
        <td class="max-w-0 w-full"><button class="text-left text-[13px] text-slate-600 truncate block w-full hover:text-ink" data-action="preview-item" data-id="${c.id}" title="Preview">${esc(c.caption.split('\n')[0])}</button></td>
        <td class="whitespace-nowrap">${badge(c.status)}</td>
        <td class="!pl-0 !pr-3 text-right">${itemMenuBtn(c)}</td>
      </tr>`;
  }).join('');
  const cards = items.map(c => {
    const p = getProp(c.propertyId);
    return `
      <div class="flex gap-3 p-4">
        <img src="${itemImg(c, 400)}" alt="" class="w-14 h-14 rounded-lg object-cover flex-none thumb">
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2 min-w-0">${pIcon(c.platform, 'xs')}<span class="text-[13px] font-medium text-ink truncate">${p.address}</span></div>${itemMenuBtn(c, '-mr-2 -mt-1')}</div>
          <button class="text-left text-[13px] text-slate-600 line-clamp-1 mt-0.5" data-action="preview-item" data-id="${c.id}">${esc(c.caption.split('\n')[0])}</button>
          <div class="mt-2 flex items-center justify-between gap-2"><span class="text-[12px] text-sub">${relDay(c.date)} · ${fmtTime(c.date)}</span>${badge(c.status)}</div>
        </div>
      </div>`;
  }).join('');
  return `
    <section class="card xl:col-span-2 overflow-hidden" aria-labelledby="up-title">
      <div class="card-head">
        <div><h2 id="up-title" class="card-title">Upcoming Content</h2><p class="text-[12.5px] text-sub mt-0.5">Next ${items.length} posts across your channels</p></div>
        <a href="#/calendar" class="btn btn-ghost btn-sm">View calendar${ic('arrow-right')}</a>
      </div>
      ${items.length ? `
      <div class="hidden md:block overflow-x-auto thin-scroll">
        <table class="table table-tight min-w-[680px]"><thead><tr><th>Date & time</th><th>Property</th><th>Platform</th><th>Content preview</th><th>Status</th><th class="w-10"><span class="sr-only">Actions</span></th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div class="md:hidden divide-y divide-line">${cards}</div>` : emptyState({ icon: 'calendar', title: 'Nothing scheduled yet', text: 'Generate content for a property to fill your calendar.', action: `<button class="btn btn-primary" data-action="go" data-route="studio">${ic('sparkles')}Open Content Studio</button>` })}
    </section>`;
}

function acctStatusBadge(a) {
  return a.status === 'connected' ? '<span class="badge b-green"><span class="dot"></span>Connected</span>'
    : a.status === 'expired' ? '<span class="badge b-amber"><span class="dot"></span>Reconnect</span>'
      : '<span class="badge b-gray"><span class="dot"></span>Not connected</span>';
}
function accountsCard() {
  const connected = state.accounts.filter(a => a.status === 'connected').length;
  return `
    <section class="card flex flex-col" aria-labelledby="acc-title">
      <div class="card-head">
        <div><h2 id="acc-title" class="card-title">Connected Accounts</h2><p class="text-[12.5px] text-sub mt-0.5">${connected} of 5 channels ready to publish</p></div>
        <a href="#/social" class="btn btn-ghost btn-sm">Manage</a>
      </div>
      <ul class="p-2 grid sm:grid-cols-2 xl:grid-cols-1 content-start">
        ${state.accounts.map(a => `
          <li><button class="w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-[#F7F7F9] transition-colors text-left" data-action="${a.status === 'connected' ? 'go' : 'connect'}" data-route="social" data-id="${a.id}">
            ${pIcon(a.id, 'md')}
            <span class="min-w-0 flex-1"><span class="block text-[13.5px] font-medium text-ink">${PLATFORMS[a.id].name}</span><span class="block text-[12.5px] text-sub truncate">${a.account || 'Connect to start publishing'}</span></span>
            ${acctStatusBadge(a)}
          </button></li>`).join('')}
      </ul>
      ${state.accounts.some(a => a.status !== 'connected') ? `<div class="mt-auto p-4 pt-2"><div class="rounded-[10px] bg-amber-50/70 border border-amber-100 px-3.5 py-3 flex items-center gap-3"><span class="text-amber-600">${ic('triangle-alert', 'w-4 h-4')}</span><span class="text-[12.5px] text-amber-900 flex-1">${state.accounts.filter(a => a.status !== 'connected').length} channels need attention before they can publish.</span><a href="#/social" class="text-[12.5px] font-semibold text-amber-800 hover:underline whitespace-nowrap">Fix now</a></div></div>` : ''}
    </section>`;
}

/* ==========================================================================
   11. Properties
   ========================================================================== */
function filteredProperties() {
  const { propQ, propStatus, propType, propSort } = state.ui;
  const q = propQ.trim().toLowerCase();
  let list = state.properties.filter(p =>
    (!q || `${p.address} ${p.city} ${p.state} ${p.zip} ${p.title} ${p.neighborhood}`.toLowerCase().includes(q)) &&
    (propStatus === 'all' || p.status === propStatus) &&
    (propType === 'all' || p.type === propType));
  const sorters = { newest: (a, b) => b.listedAt - a.listedAt, 'price-desc': (a, b) => b.price - a.price, 'price-asc': (a, b) => a.price - b.price, size: (a, b) => b.sqft - a.sqft };
  return list.sort(sorters[propSort]);
}
function propertyCard(p) {
  const pc = propContent(p.id);
  const plats = [...new Set(pc.items.map(c => c.platform))];
  return `
    <article class="card card-hover p-2 group cursor-pointer flex flex-col" data-action="view-property" data-id="${p.id}" role="button" tabindex="0" aria-label="${p.address}, ${money(p.price)}">
      <div class="relative aspect-[4/3] rounded-[11px] overflow-hidden img-zoom bg-slate-200">
        <img src="${p.photos[0].src.replace('w=1200', 'w=800')}" alt="${p.address}" loading="lazy" class="w-full h-full object-cover">
        <div class="absolute top-2.5 left-2.5">${glassBadge(p.status)}</div>
        <button class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-ink grid place-content-center shadow-sm transition" data-action="prop-menu" data-id="${p.id}" aria-label="More actions for ${p.address}" aria-haspopup="menu" aria-expanded="false">${ic('ellipsis')}</button>
        <span class="absolute bottom-2.5 left-2.5 badge b-dark">${ic('images')}${p.photos.length}</span>
      </div>
      <div class="px-2 pt-3 pb-1.5 flex-1 flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <h3 class="font-bold text-[15px] text-ink truncate">${p.address}</h3>
          <div class="text-[15px] font-bold text-brand-600 tnum whitespace-nowrap">${money(p.price)}</div>
        </div>
        <p class="mt-1 text-[13px] text-sub truncate flex items-center gap-1.5">${ic('map-pin', 'w-3.5 h-3.5 flex-none text-slate-500')}${p.city}, ${p.state} · <span class="truncate">${p.type}</span></p>
        <div class="mt-3">${specs(p)}</div>
        <div class="mt-auto pt-3"><div class="pt-3 border-t border-line flex items-center justify-between gap-2">
          <span class="badge ${pc.cls}"><span class="dot"></span>${pc.label}</span>
          <span class="flex av-stack">${plats.map(x => pIcon(x, 'xs')).join('')}</span>
        </div></div>
      </div>
    </article>`;
}
function propertyRow(p) {
  const pc = propContent(p.id);
  return `
    <tr class="cursor-pointer" data-action="view-property" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.address}">
      <td><div class="flex items-center gap-3 min-w-0"><img src="${p.photos[0].thumb}" alt="" class="w-14 h-11 rounded-lg object-cover flex-none thumb"><div class="min-w-0"><div class="text-[13.5px] font-medium text-ink truncate">${p.address}</div><div class="text-[12.5px] text-sub truncate">${p.city}, ${p.state} ${p.zip}</div></div></div></td>
      <td class="text-[13px] text-slate-600 whitespace-nowrap">${p.type}</td>
      <td class="text-[13.5px] font-semibold text-ink tnum whitespace-nowrap">${money(p.price)}</td>
      <td class="text-[13px] text-slate-600 whitespace-nowrap tnum">${p.beds} bd · ${p.baths} ba · ${num(p.sqft)} sqft</td>
      <td>${badge(p.status, LISTING)}</td>
      <td><span class="badge ${pc.cls}"><span class="dot"></span>${pc.label}</span></td>
      <td class="!pl-0 !pr-3 text-right"><button class="icon-btn !w-8 !h-8" data-action="prop-menu" data-id="${p.id}" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">${ic('ellipsis')}</button></td>
    </tr>`;
}
function renderProperties() {
  const u = state.ui;
  return `
    ${pageHeader({
      title: 'Properties', subtitle: 'Manage your listings and create marketing content.',
      actions: `<button class="btn btn-secondary" data-action="add-property">${ic('link')}Import from URL</button><button class="btn btn-primary" data-action="manual-property">${ic('plus')}Add Property</button>`,
    })}
    <div class="card p-3 sm:p-3.5 mb-5 flex flex-col lg:flex-row lg:items-center gap-3">
      <div class="input-icon flex-1 min-w-0">${ic('search')}<input class="input" placeholder="Search by address, city or ZIP…" value="${esc(u.propQ)}" data-input="propQ" aria-label="Search properties"></div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2.5">
        <select class="select lg:w-[150px]" data-change="propStatus" aria-label="Listing status">
          <option value="all">All statuses</option>${Object.entries(LISTING).map(([k, v]) => `<option value="${k}" ${u.propStatus === k ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select>
        <select class="select lg:w-[170px]" data-change="propType" aria-label="Property type">
          <option value="all">All property types</option>${PROPERTY_TYPES.map(t => `<option ${u.propType === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <select class="select lg:w-[170px] col-span-2 sm:col-span-1" data-change="propSort" aria-label="Sort by">
          ${[['newest', 'Newest first'], ['price-desc', 'Price: high to low'], ['price-asc', 'Price: low to high'], ['size', 'Largest first']].map(([k, l]) => `<option value="${k}" ${u.propSort === k ? 'selected' : ''}>Sort: ${l}</option>`).join('')}
        </select>
      </div>
      <div class="seg seg-icon flex-none self-start lg:self-auto" role="group" aria-label="View mode">
        <button class="${u.propView === 'grid' ? 'on' : ''}" data-action="prop-view" data-v="grid" aria-pressed="${u.propView === 'grid'}" aria-label="Grid view">${ic('layout-grid')}</button>
        <button class="${u.propView === 'list' ? 'on' : ''}" data-action="prop-view" data-v="list" aria-pressed="${u.propView === 'list'}" aria-label="List view">${ic('list')}</button>
      </div>
    </div>
    <div id="prop-results">${propertyResults()}</div>`;
}
function propertyResults() {
  const list = filteredProperties();
  const total = kpis().properties;
  const head = `<div class="flex items-center justify-between mb-3.5 text-[13px] text-sub"><span>Showing <b class="font-semibold text-ink">${list.length}</b> of ${total} listings${state.properties.length < total ? ' · <span class="text-muted">sold & archived listings hidden</span>' : ''}</span></div>`;
  if (!list.length) return `<div class="card">${emptyState({ icon: 'search-x', title: 'No properties match your filters', text: 'Try a different search term or clear the filters to see all listings.', action: `<button class="btn btn-secondary" data-action="clear-prop-filters">${ic('rotate-ccw')}Clear filters</button>` })}</div>`;
  if (state.ui.propView === 'list') {
    return head + `
      <div class="card overflow-hidden hidden md:block"><div class="overflow-x-auto thin-scroll"><table class="table min-w-[860px]"><thead><tr><th>Property</th><th>Type</th><th>Price</th><th>Details</th><th>Listing</th><th>Content</th><th class="w-10"><span class="sr-only">Actions</span></th></tr></thead><tbody>${list.map(propertyRow).join('')}</tbody></table></div></div>
      <div class="md:hidden grid gap-4">${list.map(propertyCard).join('')}</div>`;
  }
  return head + `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 stagger">${list.map(propertyCard).join('')}</div>${pagerHTML(list.length, total)}`;
}

function pagerHTML(shown, total) {
  const pages = Math.max(1, Math.ceil(total / Math.max(shown, 1)));
  return `
    <div class="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <span class="text-[13px] text-sub">Showing <b class="font-semibold text-ink">1</b> to <b class="font-semibold text-ink">${shown}</b> of <b class="font-semibold text-ink">${total}</b> entries</span>
      <div class="flex items-center gap-1.5" role="navigation" aria-label="Pagination">
        <button class="pager-btn" disabled>Prev</button>
        ${Array.from({ length: Math.min(pages, 4) }, (_, i) => `<button class="pager-btn ${i === 0 ? 'on' : ''}" ${i ? 'data-action="demo-toast" data-msg="Sold and archived listings aren’t included in this demo."' : 'aria-current="page"'}>${i + 1}</button>`).join('')}
        <button class="pager-btn" data-action="demo-toast" data-msg="Sold and archived listings aren’t included in this demo.">Next</button>
      </div>
      <select class="select input-sm !w-[110px]" aria-label="Rows per page"><option>Show ${shown}</option><option>Show 12</option><option>Show 24</option></select>
    </div>`;
}
function propMenuHTML(id) {
  return `
    ${ddItem('eye', 'View details', 'view-property', `data-id="${id}"`)}
    ${ddItem('wand-sparkles', 'Generate content', 'studio-open', `data-prop="${id}"`)}
    ${ddItem('pencil', 'Edit property', 'edit-property', `data-id="${id}"`)}
    ${ddItem('calendar-days', 'View in calendar', 'go', 'data-route="calendar"')}
    <div class="dd-sep"></div>
    ${ddItem('trash-2', 'Delete property', 'delete-property', `data-id="${id}"`, true)}`;
}

/* Property details modal */
function openPropertyModal(id) {
  const p = getProp(id); if (!p) return;
  const pc = propContent(id);
  const by = st => pc.items.filter(c => c.status === st).length;
  const m = openModal({
    size: 'modal-xl', bare: true, label: p.address,
    body: `
      <button class="icon-btn absolute top-3 right-3 z-10 !bg-white/90 hover:!bg-white shadow-sm" data-close aria-label="Close">${ic('x', 'w-5 h-5')}</button>
      <div class="modal-scroll grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div class="p-3 sm:p-4 lg:pr-0">
          <div class="relative rounded-xl overflow-hidden aspect-[16/11] bg-slate-200">
            <img id="pd-main" src="${p.photos[0].src}" alt="${p.photos[0].label}" class="w-full h-full object-cover pv-fade">
            <div class="absolute top-3 left-3">${glassBadge(p.status)}</div>
            <span id="pd-label" class="absolute bottom-3 left-3 badge b-dark">${p.photos[0].label}</span>
          </div>
          <div class="mt-3 grid grid-cols-6 gap-2" role="listbox" aria-label="Property photos">
            ${p.photos.map((ph, i) => `<button class="sel-ring rounded-lg overflow-hidden aspect-square ${i === 0 ? 'on' : ''}" data-pd-photo="${i}" aria-label="${ph.label}"><img src="${ph.thumb}" alt="" class="w-full h-full object-cover"></button>`).join('')}
          </div>
        </div>
        <div class="p-5 sm:p-6 flex flex-col">
          <div class="text-[12px] font-semibold uppercase tracking-[0.06em] text-sub">${p.type} · ${p.title}</div>
          <h2 class="mt-1 text-[22px] font-semibold tracking-tight text-ink pr-8">${p.address}</h2>
          <p class="text-[13.5px] text-sub mt-1 flex items-center gap-1.5">${ic('map-pin', 'w-3.5 h-3.5')}${p.neighborhood}, ${p.city}, ${p.state} ${p.zip}</p>
          <div class="mt-3 text-[26px] font-semibold tracking-tight text-ink tnum">${money(p.price)}</div>
          <div class="mt-4 grid grid-cols-3 gap-2">
            ${[['bed-double', p.beds, 'Beds'], ['bath', p.baths, 'Baths'], ['ruler', num(p.sqft), 'Sq Ft'], ['calendar', p.year, 'Built'], ['trees', p.lot, 'Lot'], ['car', p.garage, 'Parking']].map(([i, v, l]) => `<div class="rounded-[10px] border border-line px-3 py-2.5"><div class="flex items-center gap-1.5 text-[11.5px] text-sub">${ic(i, 'w-3.5 h-3.5')}${l}</div><div class="text-[14px] font-semibold text-ink mt-0.5 tnum truncate">${v}</div></div>`).join('')}
          </div>
          <p class="mt-4 text-[14px] text-slate-600 leading-relaxed">${esc(p.description)}</p>
          <div class="mt-4 flex flex-wrap gap-1.5">${p.features.map(f => `<span class="tag">${ic('check', 'w-3.5 h-3.5 text-brand-600')}${esc(f)}</span>`).join('')}</div>
          <div class="mt-5 rounded-xl bg-[#F7F7F9] border border-line p-4">
            <div class="flex items-center justify-between"><span class="text-[13px] font-semibold text-ink">Marketing content</span><span class="flex av-stack">${[...new Set(pc.items.map(c => c.platform))].map(x => pIcon(x, 'xs')).join('')}</span></div>
            <div class="mt-3 grid grid-cols-4 gap-2 text-center">
              ${[['review', by('review') + by('draft'), 'In review'], ['approved', by('approved'), 'Approved'], ['scheduled', by('scheduled'), 'Scheduled'], ['published', by('published'), 'Published']].map(([s, v, l]) => `<div class="rounded-lg bg-white border border-line py-2"><div class="text-[16px] font-semibold tnum" style="color:${STATUS[s].color}">${v}</div><div class="text-[11px] text-sub">${l}</div></div>`).join('')}
            </div>
          </div>
          <div class="mt-5 pt-1 flex flex-wrap gap-2.5 lg:mt-auto">
            <button class="btn btn-primary flex-1" data-close data-action="studio-open" data-prop="${p.id}">${ic('wand-sparkles')}Generate Content</button>
            <button class="btn btn-secondary" data-close data-action="edit-property" data-id="${p.id}">${ic('pencil')}Edit</button>
            <button class="btn btn-secondary btn-icon" data-pd-menu aria-label="More actions" aria-haspopup="menu" aria-expanded="false">${ic('ellipsis')}</button>
          </div>
        </div>
      </div>`,
  });
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-pd-photo]');
    if (t) {
      const i = +t.dataset.pdPhoto; const img = m.el.querySelector('#pd-main');
      img.classList.remove('pv-fade'); void img.offsetWidth; img.classList.add('pv-fade');
      img.src = p.photos[i].src; img.alt = p.photos[i].label; m.el.querySelector('#pd-label').textContent = p.photos[i].label;
      $$('[data-pd-photo]', m.el).forEach(b => b.classList.toggle('on', b === t));
    }
    const mb = e.target.closest('[data-pd-menu]');
    if (mb) openDropdown(mb, `${ddItem('images', 'Open in Media Library', 'media-for', `data-id="${p.id}"`)}${ddItem('calendar-days', 'View in calendar', 'go', 'data-route="calendar"')}<div class="dd-sep"></div>${ddItem('trash-2', 'Delete property', 'delete-property', `data-id="${p.id}"`, true)}`);
  });
}

/* ---------- Property form (manual entry, import confirmation, edit) ---------- */
const COMMON_FEATURES = ['Open-concept kitchen', 'Hardwood floors', 'Swimming pool', 'Home office', 'Two-car garage', 'Smart home', 'Walk-in closets', 'Outdoor kitchen', 'Mountain views', 'Waterfront'];
const US_STATES = ['AL', 'AZ', 'CA', 'CO', 'FL', 'GA', 'IL', 'MA', 'NC', 'NV', 'NY', 'OR', 'TN', 'TX', 'UT', 'VA', 'WA'];

function propertyFormHTML(p = {}, { photos = [], extracted = false } = {}) {
  const v = k => esc(p[k] ?? '');
  const feats = new Set(p.features || []);
  const allFeats = [...new Set([...(p.features || []), ...COMMON_FEATURES])];
  const field = (id, label, input, { req = true, cls = '', hint = '' } = {}) => `<div class="${cls}" data-field-wrap="${id}"><label class="label" for="pf-${id}">${label}${req ? '<span class="req" aria-hidden="true">*</span>' : ''}</label>${input}${hint ? `<p class="hint mt-1.5">${hint}</p>` : ''}</div>`;
  const inp = (id, ph = '', attrs = '') => `<input id="pf-${id}" name="${id}" class="input" value="${v(id)}" placeholder="${ph}" ${attrs}>`;
  return `
    <div class="space-y-6" id="prop-form" novalidate>
      <fieldset>
        <legend class="text-[13px] font-semibold text-ink mb-3 flex items-center gap-2">${ic('house', 'w-4 h-4 text-muted')}Property details</legend>
        <div class="grid sm:grid-cols-6 gap-4">
          ${field('title', 'Property title', inp('title', 'e.g. Contemporary Family Home', 'autocomplete="off"'), { cls: 'sm:col-span-4' })}
          ${field('type', 'Property type', `<select id="pf-type" name="type" class="select">${PROPERTY_TYPES.map(t => `<option ${p.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`, { cls: 'sm:col-span-2', req: false })}
          ${field('address', 'Street address', inp('address', '1428 Willow Creek Dr', 'autocomplete="street-address"'), { cls: 'sm:col-span-6' })}
          ${field('city', 'City', inp('city', 'Austin', 'autocomplete="address-level2"'), { cls: 'sm:col-span-3' })}
          ${field('state', 'State', `<select id="pf-state" name="state" class="select"><option value="">Select</option>${US_STATES.map(s => `<option ${p.state === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`, { cls: 'sm:col-span-1' })}
          ${field('zip', 'ZIP code', inp('zip', '78704', 'inputmode="numeric" maxlength="5" autocomplete="postal-code"'), { cls: 'sm:col-span-2' })}
        </div>
      </fieldset>
      <fieldset>
        <legend class="text-[13px] font-semibold text-ink mb-3 flex items-center gap-2">${ic('ruler', 'w-4 h-4 text-muted')}Pricing & size</legend>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          ${field('price', 'Price', `<div class="relative"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span><input id="pf-price" name="price" class="input !pl-7 tnum" value="${p.price ? num(p.price) : ''}" placeholder="685,000" inputmode="numeric"></div>`, { cls: 'col-span-2 sm:col-span-1' })}
          ${field('beds', 'Bedrooms', inp('beds', '4', 'type="number" min="0" max="20" inputmode="numeric"'))}
          ${field('baths', 'Bathrooms', inp('baths', '3', 'type="number" min="0" max="20" step="0.5" inputmode="decimal"'))}
          ${field('sqft', 'Square footage', inp('sqft', '2,450', 'inputmode="numeric"'), { cls: 'col-span-2 sm:col-span-1' })}
        </div>
      </fieldset>
      <fieldset>
        <legend class="sr-only">Description & features</legend>
        ${field('description', 'Property description', `<textarea id="pf-description" name="description" class="textarea" rows="4" placeholder="Describe the home, its standout features and the neighborhood…">${v('description')}</textarea>`, { hint: 'At least 40 characters. RexEngine uses this to write your marketing copy.' })}
        <div class="mt-4">
          <span class="label">Property features <span class="text-muted font-normal">(optional)</span></span>
          <div class="flex flex-wrap gap-2" id="pf-features">
            ${allFeats.map(f => `<button type="button" class="chip ${feats.has(f) ? 'on' : ''}" data-feature="${esc(f)}" aria-pressed="${feats.has(f)}">${ic(feats.has(f) ? 'check' : 'plus')}${esc(f)}</button>`).join('')}
          </div>
          <div class="mt-2.5 flex gap-2 max-w-sm"><input id="pf-feature-new" class="input input-sm" placeholder="Add a custom feature" aria-label="Custom feature"><button type="button" class="btn btn-secondary btn-sm" data-add-feature>${ic('plus')}Add</button></div>
        </div>
      </fieldset>
      <fieldset>
        <legend class="text-[13px] font-semibold text-ink mb-3 flex items-center gap-2">${ic('image', 'w-4 h-4 text-muted')}Photos${extracted ? `<span class="badge b-indigo ml-1">${photos.length} extracted</span>` : ''}</legend>
        <div id="pf-photos" class="grid grid-cols-3 sm:grid-cols-5 gap-2.5 ${photos.length ? 'mb-3' : ''}">${photos.map((src, i) => photoTile(src, i)).join('')}</div>
        <label class="dropzone flex flex-col items-center justify-center text-center gap-2 px-4 py-6 cursor-pointer" id="pf-drop">
          <span class="w-10 h-10 rounded-full bg-white border border-line grid place-content-center text-slate-500 shadow-card">${ic('cloud-upload', 'w-5 h-5')}</span>
          <span class="text-[13.5px] text-slate-600"><b class="font-semibold text-brand-700">Click to upload</b> or drag and drop</span>
          <span class="hint">JPG, PNG or WebP · up to 20 MB each</span>
          <input type="file" id="pf-files" class="sr-only" accept="image/*" multiple>
        </label>
      </fieldset>
    </div>`;
}
const photoTile = (src, i) => `<div class="relative group rounded-lg overflow-hidden aspect-[4/3] bg-slate-100" data-photo="${i}"><img src="${src}" alt="" class="w-full h-full object-cover">${i === 0 ? '<span class="absolute bottom-1.5 left-1.5 badge b-dark !h-5 !text-[10.5px]">Cover</span>' : ''}<button type="button" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/55 hover:bg-black/75 text-white grid place-content-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition" data-remove-photo="${i}" aria-label="Remove photo">${ic('x', 'w-3.5 h-3.5')}</button></div>`;

function bindPropertyForm(root, photos) {
  const renderPhotos = () => { const el = root.querySelector('#pf-photos'); el.innerHTML = photos.map((src, i) => photoTile(src, i)).join(''); el.classList.toggle('mb-3', photos.length > 0); icons(); };
  const addFiles = files => {
    const imgs = [...files].filter(f => f.type.startsWith('image/')).slice(0, 10);
    if (!imgs.length) return toast('Unsupported file', 'Please upload JPG, PNG or WebP images.', 'warn');
    imgs.forEach(f => photos.push(URL.createObjectURL(f)));
    renderPhotos(); toast(`${imgs.length} photo${imgs.length > 1 ? 's' : ''} added`, 'Photos are kept in this browser session only.', 'success');
  };
  root.addEventListener('click', e => {
    const f = e.target.closest('[data-feature]');
    if (f) { const on = !f.classList.contains('on'); f.classList.toggle('on', on); f.setAttribute('aria-pressed', on); f.innerHTML = `${ic(on ? 'check' : 'plus')}${esc(f.dataset.feature)}`; icons(); }
    if (e.target.closest('[data-add-feature]')) addCustom();
    const rp = e.target.closest('[data-remove-photo]');
    if (rp) { e.preventDefault(); photos.splice(+rp.dataset.removePhoto, 1); renderPhotos(); }
  });
  const addCustom = () => {
    const inp = root.querySelector('#pf-feature-new'); const val = inp.value.trim(); if (!val) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip on'; b.dataset.feature = val; b.setAttribute('aria-pressed', 'true'); b.innerHTML = `${ic('check')}${esc(val)}`;
    root.querySelector('#pf-features').prepend(b); inp.value = ''; icons();
  };
  root.querySelector('#pf-feature-new').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } });
  root.querySelector('#pf-files').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
  const drop = root.querySelector('#pf-drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  root.addEventListener('input', e => { if (e.target.id && e.target.id.startsWith('pf-')) clearFieldError(e.target); });
  root.addEventListener('change', e => { if (e.target.id && e.target.id.startsWith('pf-')) clearFieldError(e.target); });
  const price = root.querySelector('#pf-price');
  price.addEventListener('blur', () => { const n = parseInt(price.value.replace(/[^0-9]/g, ''), 10); if (n) price.value = num(n); });
  const sq = root.querySelector('#pf-sqft');
  sq.addEventListener('blur', () => { const n = parseInt(sq.value.replace(/[^0-9]/g, ''), 10); if (n) sq.value = num(n); });
}
function clearFieldError(el) {
  el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid');
  const wrap = el.closest('[data-field-wrap]'); const err = wrap && wrap.querySelector('.field-error'); err && err.remove();
}
function setFieldError(root, id, msg) {
  const el = root.querySelector(`#pf-${id}`); if (!el) return;
  el.classList.add('is-invalid'); el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', `pf-${id}-err`);
  const wrap = el.closest('[data-field-wrap]');
  if (!wrap.querySelector('.field-error')) wrap.insertAdjacentHTML('beforeend', `<p class="field-error" id="pf-${id}-err">${ic('circle-alert')}${msg}</p>`);
}
function readPropertyForm(root) {
  const g = id => (root.querySelector(`#pf-${id}`)?.value || '').trim();
  const d = {
    title: g('title'), type: g('type'), address: g('address'), city: g('city'), state: g('state'), zip: g('zip'),
    price: parseInt(g('price').replace(/[^0-9]/g, ''), 10), beds: parseFloat(g('beds')), baths: parseFloat(g('baths')),
    sqft: parseInt(g('sqft').replace(/[^0-9]/g, ''), 10), description: g('description'),
    features: $$('#pf-features .chip.on', root).map(c => c.dataset.feature),
  };
  const errs = {};
  ['title', 'address', 'city'].forEach(k => { if (!d[k]) errs[k] = 'This field is required.'; });
  if (!d.state) errs.state = 'Select a state.';
  if (!/^\d{5}$/.test(d.zip)) errs.zip = d.zip ? 'Enter a valid 5-digit ZIP code.' : 'This field is required.';
  if (!d.price || d.price < 1000) errs.price = 'Enter a valid price.';
  if (isNaN(d.beds) || d.beds < 0 || d.beds > 20) errs.beds = 'Enter 0–20.';
  if (isNaN(d.baths) || d.baths < 0 || d.baths > 20) errs.baths = 'Enter 0–20.';
  if (!d.sqft || d.sqft < 100) errs.sqft = 'Enter a valid size.';
  if (d.description.length < 40) errs.description = d.description ? `Add a little more detail (${d.description.length}/40 characters).` : 'This field is required.';
  $$('.field-error', root).forEach(e => e.remove());
  $$('.is-invalid', root).forEach(e => e.classList.remove('is-invalid'));
  Object.entries(errs).forEach(([k, msg]) => setFieldError(root, k, msg));
  if (Object.keys(errs).length) {
    const first = root.querySelector('.is-invalid'); first && first.focus();
    return null;
  }
  return d;
}
function saveProperty(d, photos, existing) {
  const pics = photos.length ? photos : DEFAULT_PHOTOS.map(id => U(id, 1200));
  const gal = pics.map((src, i) => ({ src, thumb: src.startsWith('http') ? src.replace(/w=\d+/, 'w=400') + '&h=300' : src, label: ROOM[i] || `Photo ${i + 1}` }));
  if (existing) {
    Object.assign(existing, d, { photos: gal });
    state.media = state.media.filter(a => !(a.kind === 'photo' && a.propertyId === existing.id));
    addPhotoAssets(existing);
    return existing;
  }
  const p = { id: uid('p'), neighborhood: d.city, year: 2020, lot: '—', garage: '—', status: 'active', listedAt: new Date(), ...d, features: d.features.length ? d.features : ['Updated interiors', 'Prime location', 'Move-in ready'], photos: gal };
  state.properties.unshift(p);
  addPhotoAssets(p);
  return p;
}
function addPhotoAssets(p) {
  p.photos.forEach((ph, i) => state.media.unshift({ id: `${p.id}-ph${i}-${Date.now()}`, kind: 'photo', propertyId: p.id, src: ph.src, thumb: ph.thumb, name: `${slug(p.address)}-${slug(ph.label)}.jpg`, label: ph.label, size: sizeFor(i), dims: '4000 × 2667', uploadedAt: new Date() }));
}

function openPropertyForm(existing = null) {
  const photos = existing ? existing.photos.map(ph => ph.src) : [];
  const m = openModal({
    size: 'modal-lg',
    title: existing ? 'Edit property' : 'Add property manually',
    subtitle: existing ? `Update the details for ${existing.address}.` : 'Enter the listing details. Fields marked * are required.',
    body: propertyFormHTML(existing || { type: 'Family Home' }, { photos }),
    footer: `
      ${existing ? '' : '<label class="mr-auto flex items-center gap-2.5 text-[13px] text-slate-600 cursor-pointer"><input type="checkbox" class="check" id="pf-gen" checked>Generate AI content after saving</label>'}
      <button class="btn btn-secondary" data-close>Cancel</button>
      <button class="btn btn-primary" data-save>${ic('save')}${existing ? 'Save changes' : 'Save Property'}</button>`,
  });
  bindPropertyForm(m.el, photos);
  m.el.querySelector('[data-save]').addEventListener('click', async e => {
    const d = readPropertyForm(m.el);
    if (!d) return toast('Please fix the highlighted fields', 'A few required details are missing or invalid.', 'error');
    const gen = m.el.querySelector('#pf-gen')?.checked;
    setLoading(e.currentTarget, true, 'Saving…'); await sleep(650);
    const p = saveProperty(d, photos, existing);
    m.close();
    afterPropertySaved(p, !existing, gen);
  });
}
function afterPropertySaved(p, isNew, gen) {
  renderSidebar();
  if (gen) {
    toast('Property saved', `${p.address} was added. Generating content…`, 'success');
    openStudio(p.id, { autoGenerate: true });
    return;
  }
  toast(isNew ? 'Property saved' : 'Changes saved', isNew ? `${p.address} is ready for marketing content.` : `${p.address} was updated.`, 'success', isNew ? { label: 'Generate', fn: () => openStudio(p.id, { autoGenerate: true }) } : null);
  if (state.route === 'properties' || state.route === 'overview') refresh(); else go('properties');
}

/* ---------- Import from URL flow ---------- */
function openImport() {
  const m = openModal({ size: 'modal-lg', title: 'Import Property', subtitle: 'Add a property and let RexEngine prepare your marketing content.', body: importChooseHTML() });
  const ctx = { m, photos: [] };
  m.el.addEventListener('click', e => {
    const t = e.target.closest('[data-imp]'); if (!t) return;
    const act = t.dataset.imp;
    if (act === 'demo-url') { const i = m.el.querySelector('#imp-url'); i.value = 'https://listings.example-brokerage.com/fl/tampa/512-harbor-view-rd'; clearUrlErr(m); i.focus(); }
    if (act === 'import') runImport(ctx);
    if (act === 'manual') { m.close(); setTimeout(() => openPropertyForm(), 190); }
    if (act === 'back') { m.update({ title: 'Import Property', subtitle: 'Add a property and let RexEngine prepare your marketing content.', body: importChooseHTML() }); }
    if (act === 'save') saveImported(ctx, t);
  });
  m.el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'imp-url') { e.preventDefault(); runImport(ctx); } });
  m.el.addEventListener('input', e => { if (e.target.id === 'imp-url') clearUrlErr(m); });
}
function clearUrlErr(m) { const i = m.el.querySelector('#imp-url'); i && i.classList.remove('is-invalid'); const e = m.el.querySelector('#imp-url-err'); e && (e.innerHTML = ''); }
function importChooseHTML() {
  return `
    <div class="grid md:grid-cols-[1.25fr_1fr] gap-4">
      <div class="rounded-xl border border-brand-200/70 p-5 bg-gradient-to-b from-brand-50/70 to-white">
        <div class="flex items-start gap-3">
          <div class="stat-icon bg-brand-600 text-white flex-none">${ic('link')}</div>
          <div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="font-semibold text-ink">Import from URL</span><span class="badge b-indigo">Recommended</span></div><div class="text-[13px] text-sub mt-0.5">Paste a listing link and we’ll extract the details, photos and features.</div></div>
        </div>
        <label class="label mt-5" for="imp-url">Listing URL</label>
        <div class="input-icon">${ic('globe')}<input id="imp-url" class="input" type="url" placeholder="https://www.yourbrokerage.com/listing/…" autocomplete="off" autofocus></div>
        <div id="imp-url-err" aria-live="polite"></div>
        <button class="mt-2 text-[12.5px] text-brand-700 font-medium hover:underline inline-flex items-center gap-1" data-imp="demo-url">${ic('sparkles', 'w-3.5 h-3.5')}Use a demo listing URL</button>
        <button class="btn btn-primary w-full mt-4" data-imp="import">${ic('download')}Import Property</button>
        <p class="hint mt-3 flex items-start gap-1.5">${ic('info', 'w-3.5 h-3.5 mt-[1px] flex-none')}Demo only — no page is fetched. A sample listing is used to show the extraction flow.</p>
      </div>
      <div class="rounded-xl border border-line p-5 flex flex-col">
        <div class="flex items-start gap-3">
          <div class="stat-icon bg-slate-100 text-slate-700 flex-none">${ic('pencil-line')}</div>
          <div><div class="font-semibold text-ink">Add Manually</div><div class="text-[13px] text-sub mt-0.5">Enter the details yourself.</div></div>
        </div>
        <ul class="mt-5 space-y-2.5 text-[13.5px] text-slate-600">
          ${['Full control over every field', 'Upload your own photos', 'Ideal for off-market & coming-soon listings'].map(t => `<li class="flex items-center gap-2.5">${ic('circle-check', 'w-4 h-4 text-brand-600 flex-none')}${t}</li>`).join('')}
        </ul>
        <button class="btn btn-secondary w-full mt-6 md:mt-auto" data-imp="manual">Open manual form${ic('arrow-right')}</button>
      </div>
    </div>`;
}
const IMPORT_STEPS = ['Connecting to listing page', 'Extracting property details', 'Analyzing 4 property photos', 'Detecting features & amenities', 'Preparing marketing profile'];
async function runImport(ctx) {
  const { m } = ctx;
  const inp = m.el.querySelector('#imp-url'); const url = inp.value.trim();
  let ok = false; try { const u = new URL(url); ok = /^https?:$/.test(u.protocol) && u.hostname.includes('.'); } catch (e) { ok = false; }
  if (!ok) {
    inp.classList.add('is-invalid'); inp.focus();
    m.el.querySelector('#imp-url-err').innerHTML = `<p class="field-error">${ic('circle-alert')}${url ? 'Enter a valid listing URL starting with https://' : 'Paste a listing URL to import.'}</p>`; icons();
    return;
  }
  const host = new URL(url).hostname.replace(/^www\./, '');
  m.update({
    title: 'Importing property', subtitle: `Reading ${esc(host)}…`, closable: false,
    body: `
      <div class="grid md:grid-cols-[260px_1fr] gap-6">
        <div>
          <div class="progress"><i id="imp-prog" style="width:4%"></i></div>
          <ol class="mt-5 space-y-3.5" id="imp-steps">${IMPORT_STEPS.map((s, i) => `<li class="gen-step" data-s="${i}"><span class="gs-ic"></span>${s}</li>`).join('')}</ol>
          <p class="hint mt-6">Demo extraction · sample data</p>
        </div>
        <div class="rounded-xl border border-line p-4 space-y-4" aria-hidden="true">
          <div class="grid grid-cols-4 gap-2">${Array.from({ length: 4 }, () => '<div class="skel aspect-[4/3]"></div>').join('')}</div>
          <div class="skel h-4 w-1/2"></div><div class="grid grid-cols-3 gap-3"><div class="skel h-9"></div><div class="skel h-9"></div><div class="skel h-9"></div></div>
          <div class="skel h-3 w-full"></div><div class="skel h-3 w-5/6"></div><div class="skel h-3 w-2/3"></div>
        </div>
      </div>`,
  });
  m.closable = false;
  for (let i = 0; i < IMPORT_STEPS.length; i++) {
    if (m.closed) return;
    const li = m.el.querySelector(`[data-s="${i}"]`);
    li.classList.add('active'); li.querySelector('.gs-ic').innerHTML = '<span class="spinner !w-3 !h-3 !border-[1.5px]"></span>';
    await sleep(480 + i * 70);
    li.classList.remove('active'); li.classList.add('done'); li.querySelector('.gs-ic').innerHTML = ic('check'); icons();
    m.el.querySelector('#imp-prog').style.width = `${((i + 1) / IMPORT_STEPS.length) * 100}%`;
  }
  await sleep(300);
  m.closable = true;
  ctx.photos = IMPORT_DEMO.photoIds.map(id => U(id, 1200));
  m.update({
    title: 'Review imported property',
    subtitle: 'We extracted these details. Edit anything before saving.',
    headExtra: `<div class="mb-3 flex items-center gap-2.5 rounded-[10px] bg-emerald-50 border border-emerald-100 px-3 py-2 text-[13px] text-emerald-800">${ic('circle-check', 'w-4 h-4 text-emerald-600 flex-none')}<span><b class="font-semibold">Extraction complete.</b> 14 fields and ${ctx.photos.length} photos found from ${esc(host)}.</span></div>`,
    body: propertyFormHTML(IMPORT_DEMO, { photos: ctx.photos, extracted: true }),
    footer: `
      <label class="mr-auto flex items-center gap-2.5 text-[13px] text-slate-600 cursor-pointer"><input type="checkbox" class="check" id="pf-gen" checked>Generate AI content after saving</label>
      <button class="btn btn-secondary" data-imp="back">${ic('arrow-left')}Back</button>
      <button class="btn btn-primary" data-imp="save">${ic('save')}Save Property</button>`,
  });
  bindPropertyForm(m.el, ctx.photos);
}
async function saveImported(ctx, btn) {
  const { m } = ctx;
  const d = readPropertyForm(m.el);
  if (!d) return toast('Please fix the highlighted fields', 'A few required details are missing or invalid.', 'error');
  const gen = m.el.querySelector('#pf-gen')?.checked;
  setLoading(btn, true, 'Saving…'); await sleep(650);
  const p = saveProperty({ ...d, neighborhood: IMPORT_DEMO.neighborhood, year: IMPORT_DEMO.year, lot: IMPORT_DEMO.lot, garage: IMPORT_DEMO.garage }, ctx.photos);
  m.close();
  afterPropertySaved(p, true, gen);
}

/* ==========================================================================
   12. Content Studio
   ========================================================================== */
const S = state.studio;
const studioProp = () => getProp(S.propertyId) || state.properties[0];
const draft = () => S.drafts[S.platform];
const limitFor = (pl, fmt) => pl === 'youtube' && fmt === 'post' ? 1000 : PLATFORMS[pl].limit;
const tagCount = s => (s.match(/#[A-Za-z0-9_]+/g) || []).length;
function composed(pl, d) {
  if (!d) return '';
  if (pl === 'youtube') return d.caption;
  return [d.caption, d.cta, d.hashtags].filter(Boolean).join(pl === 'x' ? '\n\n' : '\n\n');
}
const DESC_HINT = {
  instagram: ['Alt text', 'Describes the image for screen readers and search.'],
  facebook: ['Link preview description', 'Shown under the listing link card.'],
  linkedin: ['Post summary', 'Used for document carousels and link previews.'],
  x: ['Thread continuation', 'Each paragraph becomes a reply in the thread.'],
  youtube: ['Video description', 'Shown below the Short. Chapters are auto-formatted.'],
};

function openStudio(pid, { platform, autoGenerate = false, itemId } = {}) {
  if (pid && pid !== S.propertyId) { S.propertyId = pid; S.drafts = {}; S.images = [0]; S.v = 0; }
  if (itemId) {
    const c = getItem(itemId);
    if (c) {
      const same = S.propertyId === c.propertyId;
      S.propertyId = c.propertyId; S.platform = c.platform; S.format = c.format; S.images = c.images?.length ? [...c.images] : [c.image || 0];
      S.tone = c.tone || S.tone; S.goal = c.goal || S.goal;
      S.drafts = { ...(same ? S.drafts : {}), [c.platform]: { caption: c.caption, description: c.description, hashtags: c.hashtags, cta: c.cta, format: c.format, itemId: c.id, status: c.status } };
    }
  } else if (platform) { S.platform = platform; S.format = S.drafts[platform]?.format || PLATFORMS[platform].formats[0]; }
  S.pendingGenerate = autoGenerate;
  go('studio');
}

function renderStudio() {
  const d = draft();
  return `
    ${pageHeader({
      title: 'Content Studio',
      subtitle: 'Turn your property listings into high-performing marketing content.',
      actions: `<span id="studio-status">${studioStatusChip()}</span><button class="btn btn-secondary" data-action="go" data-route="approvals">${ic('list-checks')}Approvals</button>`,
    })}
    <div class="grid grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)_340px] 2xl:grid-cols-[296px_minmax(0,1fr)_372px] gap-5 items-start">
      <aside id="studio-left" class="space-y-5 min-w-0" aria-label="Property and media">${studioLeftHTML()}</aside>
      <section id="studio-editor" class="min-w-0" aria-label="Content editor">${studioEditorHTML()}</section>
      <aside id="studio-preview" class="min-w-0 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-[88px]" aria-label="Live preview">${studioPreviewHTML()}</aside>
    </div>`;
}
function studioStatusChip() {
  const d = draft();
  if (!d) return '<span class="badge b-gray"><span class="dot"></span>Not saved</span>';
  return d.itemId ? badge(d.status) : '<span class="badge b-gray"><span class="dot"></span>Unsaved draft</span>';
}

function studioLeftHTML() {
  const p = studioProp();
  const multi = S.format === 'carousel';
  return `
    <div class="card p-4">
      <label class="label" for="studio-prop">Property</label>
      <select id="studio-prop" class="select" data-change="studioProp">
        ${state.properties.map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.address)} — ${x.city}</option>`).join('')}
      </select>
      <div class="mt-4 rounded-xl overflow-hidden border border-line">
        <div class="relative aspect-[16/10] bg-slate-200"><img src="${(p.photos[S.images[0]] || p.photos[0]).src}" alt="${esc(p.address)}" class="w-full h-full object-cover pv-fade" id="studio-cover"><div class="absolute top-2.5 left-2.5">${glassBadge(p.status)}</div></div>
        <div class="p-3.5">
          <div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="text-[14px] font-semibold text-ink truncate">${esc(p.address)}</div><div class="text-[12.5px] text-sub truncate">${p.neighborhood}, ${p.city}, ${p.state}</div></div><div class="text-[14px] font-semibold tnum">${money(p.price)}</div></div>
          <div class="mt-2.5">${specs(p, 'text-[12px] text-slate-600 gap-x-3 gap-y-1')}</div>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap gap-1.5">${p.features.slice(0, 3).map(f => `<span class="tag !h-6 !text-[11.5px]">${esc(f)}</span>`).join('')}</div>
    </div>
    <div class="card p-4">
      <div class="flex items-center justify-between">
        <div><div class="text-[14px] font-semibold text-ink">Media</div><div class="text-[12px] text-sub">${multi ? `Select up to 10 · <b class="font-semibold text-ink">${S.images.length}</b> selected` : 'Choose the post image'}</div></div>
        <button class="btn btn-ghost btn-xs" data-action="go" data-route="media">${ic('images')}Library</button>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2" role="listbox" aria-label="Available images" aria-multiselectable="${multi}">
        ${p.photos.map((ph, i) => { const sel = S.images.indexOf(i); return `
          <button class="sel-ring relative rounded-lg overflow-hidden aspect-square bg-slate-100 ${sel > -1 ? 'on' : ''}" data-action="studio-img" data-i="${i}" role="option" aria-selected="${sel > -1}" aria-label="${esc(ph.label)}" title="${esc(ph.label)}">
            <img src="${ph.thumb}" alt="" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
            <span class="sel-check">${multi && sel > -1 ? `<span class="sel-num">${sel + 1}</span>` : ic('check')}</span>
          </button>`; }).join('')}
      </div>
      <p class="hint mt-3 flex items-center gap-1.5">${ic('info', 'w-3.5 h-3.5')}${multi ? 'Order follows your selection.' : 'Switch to Carousel to select multiple images.'}</p>
    </div>`;
}

function studioEditorHTML() {
  const p = studioProp();
  const d = draft() || { caption: '', description: '', hashtags: '', cta: '' };
  const pl = S.platform;
  const lim = limitFor(pl, S.format);
  const len = composed(pl, draft()).length;
  const busy = S.generating || S.busy;
  const capLabel = pl === 'youtube' ? (S.format === 'post' ? 'Community post' : 'Title') : pl === 'x' ? 'Post' : 'Caption';
  return `
    <div class="card overflow-hidden">
      <div class="px-3 sm:px-4 pt-3 pb-3 border-b border-line bg-[#FAFAFB]">
        <div class="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Platform">
          ${P_ORDER.map(x => `<button class="ptab ${x === pl ? 'on' : ''}" role="tab" aria-selected="${x === pl}" data-action="studio-platform" data-p="${x}">${pIcon(x, 'sm')}<span class="${x === pl ? '' : 'hidden 2xl:inline'}">${PLATFORMS[x].name}</span>${S.drafts[x] ? '<span class="pdot" title="Draft ready"></span>' : ''}</button>`).join('')}
        </div>
      </div>
      <div class="p-4 sm:p-5 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="seg seg-fmt w-full grid grid-cols-5" role="radiogroup" aria-label="Content format">
            ${Object.entries(FORMATS).map(([k, f]) => { const ok = PLATFORMS[pl].formats.includes(k); return `<button role="radio" aria-checked="${S.format === k}" class="${S.format === k ? 'on' : ''}" data-action="studio-format" data-f="${k}" ${ok ? '' : `disabled title="Not available on ${PLATFORMS[pl].name}"`}>${ic(f.icon)}${f.label}</button>`; }).join('')}
          </div>
          <span class="text-[12px] text-sub flex items-center gap-1.5 -mt-2">${ic('target', 'w-3.5 h-3.5')}${TONES[S.tone]} · ${AUDIENCES[S.audience]} · ${GOALS[S.goal]}</span>
        </div>

        <div class="ai-panel p-4 sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-content-center shadow-[0_4px_12px_-4px_rgba(5,150,105,.6)]">${ic('sparkles')}</div>
              <div><div class="text-[14.5px] font-semibold text-ink">AI generation</div><div class="text-[12.5px] text-sub">Writes platform-specific copy for all 5 channels from this listing.</div></div>
            </div>
            <span class="hidden sm:inline-flex ai-badge">${ic('zap')}25 credits</span>
          </div>
          <div class="mt-4">
            <span class="label">Tone</span>
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Tone">${Object.entries(TONES).map(([k, l]) => `<button class="chip ${S.tone === k ? 'on' : ''}" role="radio" aria-checked="${S.tone === k}" data-action="studio-tone" data-v="${k}">${ic({ professional: 'briefcase', luxury: 'gem', friendly: 'smile', investment: 'trending-up' }[k])}${l}</button>`).join('')}</div>
          </div>
          <div class="mt-4 grid sm:grid-cols-2 gap-3">
            <div><label class="label" for="st-aud">Audience</label><select id="st-aud" class="select" data-change="studioAudience">${Object.entries(AUDIENCES).map(([k, l]) => `<option value="${k}" ${S.audience === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div><label class="label" for="st-goal">Content goal</label><select id="st-goal" class="select" data-change="studioGoal">${Object.entries(GOALS).map(([k, l]) => `<option value="${k}" ${S.goal === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button id="gen-btn" class="btn btn-primary" data-action="studio-generate" ${busy ? 'disabled' : ''}>${S.generating ? '<span class="spinner"></span>Generating…' : `${ic('sparkles')}${Object.keys(S.drafts).length ? 'Regenerate all with AI' : 'Generate with AI'}`}</button>
            <span class="hint flex items-center gap-1.5">${ic('flask-conical', 'w-3.5 h-3.5')}Demo mode — sample copy, no AI API is called.</span>
          </div>
          <div id="gen-progress" class="${S.generating ? '' : 'hidden'}"></div>
        </div>

        <div id="studio-fields" class="space-y-5 ${S.generating ? 'opacity-60 pointer-events-none' : ''}">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="label !mb-0" for="f-caption">${capLabel}</label>
              <span id="cap-count" class="text-[12px] tnum ${len > lim ? 'text-red-600 font-medium' : 'text-muted'}">${num(len)} / ${num(lim)}</span>
            </div>
            <div class="relative ${S.busy ? 'ai-shimmer rounded-[9px]' : ''}">
              <textarea id="f-caption" class="textarea ${len > lim ? 'is-invalid' : ''}" rows="${pl === 'youtube' && S.format !== 'post' ? 2 : 8}" data-field="caption" placeholder="${Object.keys(S.drafts).length ? 'Write your caption…' : 'Click “Generate with AI” or start writing your caption…'}" ${busy ? 'readonly' : ''}>${esc(d.caption)}</textarea>
            </div>
            <div class="mt-2.5 flex flex-wrap gap-2" aria-label="AI writing tools">
              ${[['regenerate', 'refresh-cw', 'Regenerate'], ['improve', 'wand-sparkles', 'Improve Copy'], ['shorten', 'scissors', 'Shorten'], ['professional', 'briefcase', 'Make More Professional']].map(([k, i, l]) => `<button class="btn btn-secondary btn-xs" data-action="studio-tool" data-k="${k}" ${busy ? 'disabled' : ''}>${ic(i)}${l}</button>`).join('')}
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5"><label class="label !mb-0" for="f-description">Description <span class="font-normal text-muted">· ${DESC_HINT[pl][0]}</span></label></div>
            <textarea id="f-description" class="textarea" rows="${pl === 'youtube' || pl === 'x' ? 5 : 3}" data-field="description" placeholder="${DESC_HINT[pl][1]}" ${busy ? 'readonly' : ''}>${esc(d.description)}</textarea>
            <p class="hint mt-1.5">${DESC_HINT[pl][1]}</p>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-1.5"><label class="label !mb-0" for="f-hashtags">Hashtags</label><span id="tag-count" class="text-[12px] text-muted tnum">${tagCount(d.hashtags)} tags</span></div>
              <div class="input-icon">${ic('hash')}<input id="f-hashtags" class="input" data-field="hashtags" value="${esc(d.hashtags)}" placeholder="#JustListed #DreamHome" ${busy ? 'readonly' : ''}></div>
            </div>
            <div>
              <label class="label" for="f-cta">Call to action</label>
              <div class="input-icon">${ic('mouse-pointer-click')}<input id="f-cta" class="input" data-field="cta" value="${esc(d.cta)}" placeholder="Book a private tour" ${busy ? 'readonly' : ''}></div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-4 sm:px-5 py-4 border-t border-line bg-[#FAFAFB] flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3">
        <span class="text-[12.5px] text-sub flex items-center gap-1.5" id="save-meta">${ic('cloud', 'w-4 h-4')}${draft()?.itemId ? `Saved to ${PLATFORMS[pl].name} queue` : 'Drafts auto-save in this session'}</span>
        <div class="flex flex-wrap gap-2 [&>.btn]:flex-1 [&>.btn]:min-w-[112px] 2xl:[&>.btn]:flex-none">
          <button class="btn btn-secondary" data-action="studio-save" ${busy ? 'disabled' : ''}>${ic('save')}Save Draft</button>
          <button class="btn btn-soft" data-action="studio-approve" ${busy ? 'disabled' : ''}>${ic('badge-check')}Approve</button>
          <button class="btn btn-primary" data-action="studio-schedule" ${busy ? 'disabled' : ''}>${ic('calendar-clock')}Schedule</button>
        </div>
      </div>
    </div>`;
}

/* ---------- Live preview ---------- */
function studioPreviewData() {
  const p = studioProp();
  const d = draft() || { caption: '', description: '', hashtags: '', cta: '' };
  return { platform: S.platform, format: S.format, ...d, images: S.images.map(i => (p.photos[i] || p.photos[0]).src), property: p, idx: S.carouselIdx, expanded: S.expanded, empty: !d.caption };
}
function studioPreviewHTML() {
  const data = studioPreviewData();
  return `
    <div class="flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-2 min-w-0"><span class="text-[14px] font-semibold text-ink">Live preview</span><span class="badge b-gray truncate">${PLATFORMS[S.platform].name} · ${FORMATS[S.format].label}</span></div>
      <span class="flex items-center gap-1.5 text-[12px] font-medium text-emerald-700"><span class="relative flex w-2 h-2"><span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60"></span><span class="relative w-2 h-2 rounded-full bg-emerald-500"></span></span>Live</span>
    </div>
    <div id="pv-device">${buildPreview(data)}</div>
    <div class="card mt-4 p-4" id="pv-checks">${checksHTML()}</div>
    <p class="hint mt-3 px-1 text-center">Previews approximate each platform’s layout and may differ slightly when published.</p>`;
}
function checksHTML() {
  const d = draft(); const pl = S.platform; const lim = limitFor(pl, S.format);
  const len = composed(pl, d).length; const tags = d ? tagCount(d.hashtags) : 0; const [lo, hi] = PLATFORMS[pl].tagRange;
  const acct = getAcct(pl);
  const rows = [
    !d || !d.caption ? ['warn', 'Caption is empty', 'Generate or write copy to continue.']
      : len > lim ? ['bad', `Over the ${num(lim)}-character limit`, `Shorten by ${num(len - lim)} characters.`]
        : ['ok', 'Length looks good', `${num(len)} of ${num(lim)} characters used.`],
    !d ? ['warn', 'No hashtags yet', `${lo}–${hi} recommended on ${PLATFORMS[pl].name}.`]
      : tags < lo || tags > hi ? ['warn', `${tags} hashtag${tags === 1 ? '' : 's'}`, `${lo}–${hi} recommended on ${PLATFORMS[pl].name}.`]
        : ['ok', `${tags} hashtags`, 'Within the recommended range.'],
    S.format === 'carousel' && S.images.length < 2 ? ['warn', 'Add more images', 'Carousels need at least 2 images.']
      : ['ok', S.format === 'carousel' ? `${S.images.length} images selected` : 'Media ready', ['reel', 'short'].includes(S.format) ? 'Cropped to 9:16 for vertical video.' : 'Auto-cropped for this placement.'],
    acct.status === 'connected' ? ['ok', 'Account connected', `Publishing as ${acct.account}.`]
      : ['bad', acct.status === 'expired' ? `${PLATFORMS[pl].name} needs reconnecting` : `${PLATFORMS[pl].name} not connected`, `<button class="text-brand-700 font-medium hover:underline" data-action="connect" data-id="${pl}">${acct.status === 'expired' ? 'Reconnect' : 'Connect'} account</button> before scheduling.`],
  ];
  const ico = { ok: ['circle-check', 'text-emerald-600'], warn: ['circle-alert', 'text-amber-500'], bad: ['circle-x', 'text-red-500'] };
  const okCount = rows.filter(r => r[0] === 'ok').length;
  return `
    <div class="flex items-center justify-between mb-3"><span class="text-[13px] font-semibold text-ink">Pre-publish checks</span><span class="text-[12px] text-sub tnum">${okCount}/${rows.length} passed</span></div>
    <ul class="space-y-2.5">${rows.map(([s, t, d2]) => `<li class="flex items-start gap-2.5">${ic(ico[s][0], `w-4 h-4 mt-0.5 flex-none ${ico[s][1]}`)}<div class="min-w-0"><div class="text-[13px] text-ink font-medium">${t}</div><div class="text-[12px] text-sub">${d2}</div></div></li>`).join('')}</ul>`;
}

function rich(t, cls = 'pv-tag') {
  return esc(t).replace(/(^|[\s(])(#[A-Za-z0-9_]+)/g, `$1<span class="${cls}">$2</span>`).replace(/(^|\s)(@[A-Za-z0-9_.]+)/g, `$1<span class="${cls}">$2</span>`);
}
function truncated(text, n, more, expanded) {
  if (expanded || text.length <= n) return { html: text, cut: false };
  return { html: text.slice(0, n).replace(/\s+\S*$/, ''), cut: true };
}
const statusBar = (dark = false) => `<div class="device-status ${dark ? 'text-white' : 'text-ink'}"><span>9:41</span><span class="st-icons">${ic('signal', 'w-3.5 h-3.5')}${ic('wifi', 'w-3.5 h-3.5')}${ic('battery-full', 'w-[18px] h-[18px]')}</span></div>`;
const skelLines = (dark = false) => `<div class="space-y-1.5 py-1" aria-hidden="true"><div class="h-2.5 rounded ${dark ? 'bg-white/20' : 'bg-slate-200'} w-[92%]"></div><div class="h-2.5 rounded ${dark ? 'bg-white/20' : 'bg-slate-200'} w-[78%]"></div><div class="h-2.5 rounded ${dark ? 'bg-white/20' : 'bg-slate-200'} w-[60%]"></div></div>`;
const counter = (i, n) => n > 1 ? `<span class="absolute top-3 right-3 badge b-dark !h-6 tnum">${i + 1}/${n}</span>` : '';
const carouselNav = (n) => n > 1 ? `<button class="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 grid place-content-center shadow" data-action="pv-slide" data-d="-1" aria-label="Previous image">${ic('chevron-left', 'w-4 h-4 text-ink')}</button><button class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 grid place-content-center shadow" data-action="pv-slide" data-d="1" aria-label="Next image">${ic('chevron-right', 'w-4 h-4 text-ink')}</button>` : '';

function buildPreview(data) {
  const fn = { instagram: pvInstagram, facebook: pvFacebook, linkedin: pvLinkedIn, x: pvX, youtube: pvYouTube }[data.platform];
  return `<div class="pv-fade">${fn(data)}</div>`;
}
function pvInstagram(d) {
  const p = d.property; const n = d.images.length; const i = clamp(d.idx || 0, 0, n - 1);
  const body = [d.caption, d.cta].filter(Boolean).join('\n\n');
  if (d.format === 'reel') {
    return `
      <div class="device dark"><div class="device-screen"><div class="device-notch"></div>
        <div class="absolute inset-0"><img src="${d.images[0]}" alt="" class="w-full h-full object-cover"><div class="absolute inset-0 vertical-shade"></div></div>
        <div class="relative z-[2]">${statusBar(true)}<div class="flex items-center justify-between px-4 pt-1"><span class="text-[17px] font-semibold">Reels</span>${ic('camera', 'w-5 h-5')}</div></div>
        <div class="absolute right-3 bottom-24 z-[2] flex flex-col items-center gap-4 text-[11px] font-medium">
          ${[['heart', '1.2K'], ['message-circle', '48'], ['send', ''], ['ellipsis', '']].map(([ico, l]) => `<span class="flex flex-col items-center gap-1">${ic(ico, 'w-6 h-6')}${l}</span>`).join('')}
        </div>
        <div class="absolute left-0 right-14 bottom-0 z-[2] p-4 pb-5">
          <div class="flex items-center gap-2">${avatar(AV.alex, 28, 'ring-2 ring-white/70')}<span class="text-[13px] font-semibold">${HANDLE.instagram}</span><span class="text-[11.5px] font-semibold border border-white/70 rounded-md px-2 py-0.5">Follow</span></div>
          <div class="mt-2 text-[12.5px] leading-snug line-clamp-2 pv-caption">${d.empty ? skelLines(true) : rich(d.caption, 'font-semibold')}</div>
          <div class="mt-2 text-[11.5px] flex items-center gap-1.5 opacity-90">${ic('music', 'w-3 h-3')}Original audio · alexmorgan.homes</div>
        </div>
      </div></div>`;
  }
  const t = truncated(body, 125, true, d.expanded);
  return `
    <div class="device"><div class="device-screen"><div class="device-notch"></div>${statusBar()}
      <div class="flex items-center gap-2 px-3 h-10 border-b border-slate-100 flex-none">${ic('chevron-left', 'w-5 h-5')}<span class="text-[14px] font-semibold mx-auto pr-5">Posts</span></div>
      <div class="device-body thin-scroll">
        <div class="flex items-center gap-2.5 px-3 py-2.5">
          <span class="p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-fuchsia-600"><span class="block p-[2px] bg-white rounded-full">${avatar(AV.alex, 28)}</span></span>
          <div class="leading-tight min-w-0"><div class="text-[13px] font-semibold">${HANDLE.instagram}</div><div class="text-[11px] text-slate-500 truncate">${p.neighborhood}, ${p.city}</div></div>
          <span class="ml-auto">${ic('ellipsis', 'w-4 h-4')}</span>
        </div>
        <div class="relative ${d.format === 'carousel' ? 'aspect-[4/5]' : 'aspect-square'} bg-slate-100"><img src="${d.images[i]}" alt="" class="w-full h-full object-cover">${d.format === 'carousel' ? counter(i, n) + carouselNav(n) : ''}</div>
        <div class="flex items-center gap-4 px-3 pt-2.5">${ic('heart', 'w-[22px] h-[22px]')}${ic('message-circle', 'w-[22px] h-[22px]')}${ic('send', 'w-[22px] h-[22px]')}
          ${d.format === 'carousel' && n > 1 ? `<span class="pv-dots mx-auto -translate-x-6">${d.images.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>` : '<span class="mx-auto"></span>'}
          ${ic('bookmark', 'w-[22px] h-[22px]')}</div>
        <div class="px-3 pt-2 text-[13px] font-semibold">1,284 likes</div>
        <div class="px-3 pt-1 text-[13px] leading-[1.45] pv-caption">${d.empty ? skelLines() : `<span class="font-semibold">${HANDLE.instagram}</span> ${rich(t.html)}${t.cut ? `… <button class="text-slate-500" data-action="pv-more">more</button>` : ''}${(!t.cut && d.hashtags) ? `\n\n${rich(d.hashtags)}` : ''}`}</div>
        <div class="px-3 pt-1.5 text-[13px] text-slate-500">View all 48 comments</div>
        <div class="px-3 pt-1 pb-6 text-[10.5px] uppercase tracking-wide text-slate-400">Just now</div>
      </div>
      <div class="h-12 border-t border-slate-100 flex items-center justify-around flex-none">${['house', 'search', 'square-plus', 'clapperboard'].map(x => ic(x, 'w-[22px] h-[22px]')).join('')}${avatar(AV.alex, 22)}</div>
    </div></div>`;
}
function pvFacebook(d) {
  const p = d.property; const n = d.images.length;
  const body = [d.caption, d.cta].filter(Boolean).join('\n\n') + (d.hashtags ? `\n\n${d.hashtags}` : '');
  const t = truncated(body, 220, true, d.expanded);
  const btn = { leads: 'Book now', awareness: 'Learn more', engagement: 'Learn more' }[S.goal] || 'Learn more';
  const media = d.format === 'reel'
    ? `<div class="relative aspect-[4/5] bg-black"><img src="${d.images[0]}" alt="" class="w-full h-full object-cover opacity-95"><span class="absolute inset-0 grid place-content-center"><span class="play-badge">${ic('play')}</span></span><span class="absolute bottom-3 left-3 badge b-dark">${ic('clapperboard')}Reel · 0:30</span></div>`
    : d.format === 'carousel' && n > 1
      ? `<div class="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-1">${d.images.map((src, k) => `<div class="w-[72%] flex-none rounded-lg overflow-hidden border border-slate-200"><img src="${src}" alt="" class="w-full aspect-square object-cover"><div class="p-2.5 text-[12.5px] font-semibold truncate">${k === 0 ? esc(p.address) : esc(p.photos[S.images[k]]?.label || 'Photo')}</div></div>`).join('')}</div>`
      : `<div class="relative aspect-[4/3] bg-slate-100"><img src="${d.images[0]}" alt="" class="w-full h-full object-cover"></div>
         <div class="bg-[#F0F2F5] px-3 py-2.5 flex items-center gap-3"><div class="min-w-0 flex-1"><div class="text-[10.5px] uppercase text-slate-500 tracking-wide">morganco.realty</div><div class="text-[13.5px] font-semibold truncate text-[#050505]">${esc(p.address)} · ${money(p.price)}</div><div class="text-[12px] text-slate-500 truncate">${esc(d.description || `${p.beds} bd · ${p.baths} ba · ${num(p.sqft)} sq ft`)}</div></div><span class="px-3 h-8 rounded-md bg-[#E4E6EB] text-[12.5px] font-semibold grid place-content-center flex-none">${btn}</span></div>`;
  return `
    <div class="device"><div class="device-screen !bg-[#F0F2F5]"><div class="device-notch"></div><div class="bg-white">${statusBar()}</div>
      <div class="device-body thin-scroll">
        <div class="bg-white mt-2">
          <div class="px-3 pt-3 flex items-center gap-2.5">${avatar(AV.alex, 38)}<div class="leading-tight min-w-0 flex-1"><div class="text-[14px] font-semibold text-[#050505] truncate">${HANDLE.facebook}</div><div class="text-[12px] text-slate-500 flex items-center gap-1">Just now · ${ic('globe', 'w-3 h-3')}</div></div>${ic('ellipsis', 'w-5 h-5 text-slate-500')}</div>
          <div class="px-3 pt-2.5 pb-3 text-[14px] leading-[1.4] text-[#050505] pv-caption">${d.empty ? skelLines() : `${rich(t.html, 'pv-tag-fb')}${t.cut ? `… <button class="font-semibold text-slate-600" data-action="pv-more">See more</button>` : ''}`}</div>
          ${media}
          <div class="px-3 py-2.5 flex items-center justify-between text-[12.5px] text-slate-500"><span class="flex items-center gap-1.5"><span class="flex -space-x-1"><span class="w-[18px] h-[18px] rounded-full bg-[#1877F2] grid place-content-center ring-2 ring-white">${ic('thumbs-up', 'w-2.5 h-2.5 text-white')}</span><span class="w-[18px] h-[18px] rounded-full bg-[#F33E58] grid place-content-center ring-2 ring-white">${ic('heart', 'w-2.5 h-2.5 text-white')}</span></span>342</span><span>28 comments · 12 shares</span></div>
          <div class="mx-3 border-t border-slate-200 h-11 flex items-center justify-around text-[13px] font-semibold text-slate-600">${[['thumbs-up', 'Like'], ['message-circle', 'Comment'], ['share-2', 'Share']].map(([x, l]) => `<span class="flex items-center gap-1.5">${ic(x, 'w-[18px] h-[18px]')}${l}</span>`).join('')}</div>
        </div>
        <div class="bg-white mt-2 h-24"></div>
      </div>
    </div></div>`;
}
function pvLinkedIn(d) {
  const p = d.property; const n = d.images.length; const i = clamp(d.idx || 0, 0, n - 1);
  const body = [d.caption, d.cta].filter(Boolean).join('\n\n') + (d.hashtags ? `\n\n${d.hashtags}` : '');
  const t = truncated(body, 210, true, d.expanded);
  const media = d.format === 'carousel'
    ? `<div class="relative bg-slate-100"><div class="px-3 py-2 bg-white border-y border-slate-200 text-[12.5px] font-semibold truncate">${esc(p.address)} — Listing overview · ${Math.max(n, 6)} pages</div><div class="relative aspect-square"><img src="${d.images[i]}" alt="" class="w-full h-full object-cover">${carouselNav(n)}<span class="absolute bottom-3 right-3 badge b-dark tnum">${i + 1} / ${Math.max(n, 6)}</span></div></div>`
    : `<div class="relative aspect-[1.25/1] bg-slate-100"><img src="${d.images[0]}" alt="" class="w-full h-full object-cover"></div>`;
  return `
    <div class="device"><div class="device-screen !bg-[#F4F2EE]"><div class="device-notch"></div><div class="bg-white">${statusBar()}</div>
      <div class="device-body thin-scroll">
        <div class="bg-white mt-2">
          <div class="px-3 pt-3 flex items-start gap-2.5">${avatar(AV.alex, 44)}<div class="leading-tight min-w-0 flex-1"><div class="text-[14px] font-semibold text-[rgba(0,0,0,.9)]">${HANDLE.linkedin}</div><div class="text-[12px] text-slate-500 truncate mt-0.5">Real Estate Advisor · Morgan & Co. Realty</div><div class="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">1m · ${ic('globe', 'w-3 h-3')}</div></div><span class="text-[#0A66C2] text-[13.5px] font-semibold flex items-center gap-0.5">${ic('plus', 'w-4 h-4')}Follow</span></div>
          <div class="px-3 pt-2.5 pb-3 text-[13.5px] leading-[1.45] text-[rgba(0,0,0,.9)] pv-caption">${d.empty ? skelLines() : `${rich(t.html, 'pv-tag-li')}${t.cut ? `…<button class="text-slate-500 ml-1" data-action="pv-more">see more</button>` : ''}`}</div>
          ${media}
          <div class="px-3 py-2 flex items-center justify-between text-[12px] text-slate-500"><span class="flex items-center gap-1"><span class="flex -space-x-1"><span class="w-4 h-4 rounded-full bg-[#378FE9] grid place-content-center ring-2 ring-white">${ic('thumbs-up', 'w-2.5 h-2.5 text-white')}</span><span class="w-4 h-4 rounded-full bg-[#DF704D] grid place-content-center ring-2 ring-white">${ic('heart', 'w-2.5 h-2.5 text-white')}</span></span>86</span><span>14 comments · 6 reposts</span></div>
          <div class="mx-3 border-t border-slate-200 h-12 grid grid-cols-4 text-[11.5px] font-semibold text-slate-600">${[['thumbs-up', 'Like'], ['message-square', 'Comment'], ['repeat-2', 'Repost'], ['send', 'Send']].map(([x, l]) => `<span class="flex flex-col items-center justify-center gap-0.5">${ic(x, 'w-[18px] h-[18px]')}${l}</span>`).join('')}</div>
        </div>
      </div>
    </div></div>`;
}
function pvX(d) {
  const text = [d.caption, d.cta].filter(Boolean).join('\n\n') + (d.hashtags ? ` ${d.hashtags}` : '');
  const thread = d.format === 'thread' ? (d.description || '').split(/\n\n+/).filter(Boolean) : [];
  const tweet = (content, img, last) => `
    <div class="flex gap-2.5 px-3 pt-3 relative">
      <div class="flex flex-col items-center flex-none">${avatar(AV.alex, 38)}${!last ? '<span class="w-0.5 flex-1 bg-slate-200 mt-1 min-h-[16px]"></span>' : ''}</div>
      <div class="min-w-0 flex-1 pb-3 ${last ? 'border-b border-slate-100' : ''}">
        <div class="flex items-center gap-1 text-[13.5px] leading-tight"><span class="font-bold text-[#0F1419] truncate">Alex Morgan</span><span class="text-slate-500 truncate">${HANDLE.x} · 1m</span><span class="ml-auto text-slate-400">${ic('ellipsis', 'w-4 h-4')}</span></div>
        <div class="mt-1 text-[14px] leading-[1.4] text-[#0F1419] pv-caption">${content}</div>
        ${img ? `<div class="mt-2.5 rounded-2xl overflow-hidden border border-slate-200 aspect-[16/10] bg-slate-100"><img src="${img}" alt="" class="w-full h-full object-cover"></div>` : ''}
        <div class="mt-2.5 flex items-center justify-between text-[12px] text-slate-500 pr-2">${[['message-circle', '12'], ['repeat-2', '8'], ['heart', '64'], ['chart-no-axes-column', '2.1K'], ['share', '']].map(([x, l]) => `<span class="flex items-center gap-1">${ic(x, 'w-4 h-4')}${l}</span>`).join('')}</div>
      </div>
    </div>`;
  return `
    <div class="device"><div class="device-screen"><div class="device-notch"></div>${statusBar()}
      <div class="flex items-center px-3 h-11 border-b border-slate-100 flex-none">${ic('arrow-left', 'w-5 h-5')}<span class="ml-6 text-[16px] font-bold">Post</span></div>
      <div class="device-body thin-scroll">
        ${tweet(d.empty ? skelLines() : rich(text, 'pv-tag-x'), d.images[0], !thread.length)}
        ${thread.map((t2, k) => tweet(rich(t2, 'pv-tag-x'), null, k === thread.length - 1)).join('')}
      </div>
    </div></div>`;
}
function pvYouTube(d) {
  if (d.format === 'post') {
    return `
      <div class="device"><div class="device-screen"><div class="device-notch"></div>${statusBar()}
        <div class="flex items-center px-3 h-11 border-b border-slate-100 flex-none">${ic('arrow-left', 'w-5 h-5')}<span class="ml-5 text-[15px] font-semibold">Community</span></div>
        <div class="device-body thin-scroll p-3">
          <div class="rounded-xl border border-slate-200 p-3">
            <div class="flex items-center gap-2.5">${avatar(AV.alex, 32)}<div class="leading-tight"><div class="text-[13px] font-semibold">${HANDLE.youtube}</div><div class="text-[11.5px] text-slate-500">1 minute ago</div></div></div>
            <div class="mt-2.5 text-[13.5px] leading-[1.45] pv-caption">${d.empty ? skelLines() : rich([d.caption, d.cta].filter(Boolean).join('\n\n'), 'text-[#065FD4]')}</div>
            <div class="mt-2.5 rounded-lg overflow-hidden aspect-square bg-slate-100"><img src="${d.images[0]}" alt="" class="w-full h-full object-cover"></div>
            <div class="mt-2.5 flex items-center gap-5 text-[12px] text-slate-600">${[['thumbs-up', '214'], ['thumbs-down', ''], ['message-square', '18']].map(([x, l]) => `<span class="flex items-center gap-1.5">${ic(x, 'w-4 h-4')}${l}</span>`).join('')}</div>
          </div>
        </div>
      </div></div>`;
  }
  return `
    <div class="device dark"><div class="device-screen"><div class="device-notch"></div>
      <div class="absolute inset-0"><img src="${d.images[0]}" alt="" class="w-full h-full object-cover"><div class="absolute inset-0 vertical-shade"></div></div>
      <div class="relative z-[2]">${statusBar(true)}<div class="flex items-center justify-between px-4 pt-1"><span class="text-[16px] font-semibold flex items-center gap-1.5">${GLYPH.youtube.replace('<svg', '<svg width="22" height="22"')}Shorts</span><span class="flex gap-4">${ic('search', 'w-5 h-5')}${ic('ellipsis-vertical', 'w-5 h-5')}</span></div></div>
      <div class="absolute right-2.5 bottom-24 z-[2] flex flex-col items-center gap-4 text-[11px] font-medium">
        ${[['thumbs-up', '4.2K'], ['thumbs-down', 'Dislike'], ['message-square', '128'], ['share', 'Share'], ['repeat-2', 'Remix']].map(([x, l]) => `<span class="flex flex-col items-center gap-1"><span class="w-10 h-10 rounded-full bg-white/15 backdrop-blur grid place-content-center">${ic(x, 'w-5 h-5')}</span>${l}</span>`).join('')}
      </div>
      <div class="absolute left-0 right-16 bottom-0 z-[2] p-4 pb-6">
        <div class="flex items-center gap-2">${avatar(AV.alex, 28)}<span class="text-[13px] font-semibold">${HANDLE.youtube}</span><span class="text-[12px] font-semibold bg-white text-black rounded-full px-3 py-1">Subscribe</span></div>
        <div class="mt-2.5 text-[13.5px] font-medium leading-snug line-clamp-2">${d.empty ? skelLines(true) : esc(d.caption)}</div>
        <div class="mt-2 text-[11.5px] flex items-center gap-1.5 opacity-90">${ic('music', 'w-3 h-3')}Original sound · ${HANDLE.youtube}</div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/25 z-[2]"><div class="h-full w-[38%] bg-[#FF0033]"></div></div>
    </div></div>`;
}

/* ---------- Studio partial renders ---------- */
function rStudioLeft() { const el = $('#studio-left'); if (el) { el.innerHTML = studioLeftHTML(); icons(); } }
function rStudioEditor() { const el = $('#studio-editor'); if (el) { el.innerHTML = studioEditorHTML(); icons(); } const s = $('#studio-status'); if (s) s.innerHTML = studioStatusChip(); }
function rStudioPreview() {
  const dev = $('#pv-device'); if (!dev) return;
  const body = dev.querySelector('.device-body'); const scroll = body ? body.scrollTop : 0;
  $('#studio-preview').innerHTML = studioPreviewHTML(); icons();
  const nb = $('#pv-device .device-body'); if (nb && scroll) nb.scrollTop = scroll;
}
let pvTimer = null;
function livePreview() {
  clearTimeout(pvTimer);
  pvTimer = setTimeout(() => {
    const dev = $('#pv-device'); if (!dev) return;
    const body = dev.querySelector('.device-body'); const scroll = body ? body.scrollTop : 0;
    dev.innerHTML = buildPreview(studioPreviewData()).replace('class="pv-fade"', 'class=""');
    const ch = $('#pv-checks'); if (ch) ch.innerHTML = checksHTML();
    icons();
    const nb = dev.querySelector('.device-body'); if (nb) nb.scrollTop = scroll;
  }, 90);
}
function updateCounters() {
  const len = composed(S.platform, draft()).length; const lim = limitFor(S.platform, S.format);
  const cc = $('#cap-count'); if (cc) { cc.textContent = `${num(len)} / ${num(lim)}`; cc.className = `text-[12px] tnum ${len > lim ? 'text-red-600 font-medium' : 'text-muted'}`; }
  const cap = $('#f-caption'); if (cap) cap.classList.toggle('is-invalid', len > lim);
  const tc = $('#tag-count'); if (tc) tc.textContent = `${tagCount(draft()?.hashtags || '')} tags`;
  const s = $('#studio-status'); if (s) s.innerHTML = studioStatusChip();
}
function onStudioField(el) {
  const k = el.dataset.field;
  if (!S.drafts[S.platform]) S.drafts[S.platform] = { caption: '', description: '', hashtags: '', cta: '', format: S.format, itemId: null, status: 'draft' };
  const d = S.drafts[S.platform];
  d[k] = el.value;
  if (d.itemId && d.status !== 'draft') { d.dirty = true; }
  updateCounters(); livePreview();
}

async function studioGenerate() {
  if (S.generating) return;
  const p = studioProp();
  S.generating = true; S.expanded = false;
  rStudioEditor();
  const steps = [`Reading ${p.address} details & ${p.photos.length} photos`, `Applying ${TONES[S.tone].toLowerCase()} brand voice for ${AUDIENCES[S.audience].toLowerCase()}`, 'Writing Instagram, Facebook & LinkedIn copy', 'Writing X thread & YouTube Short script', 'Optimizing hashtags & calls to action'];
  const prog = $('#gen-progress');
  prog.innerHTML = `
    <div class="mt-4 rounded-[10px] border border-brand-100 bg-white p-4" role="status" aria-live="polite">
      <div class="flex items-center justify-between text-[12.5px]"><span class="font-medium text-ink flex items-center gap-2">${ic('sparkles', 'w-4 h-4 text-brand-600')}Generating content</span><span id="gen-pct" class="text-sub tnum">0%</span></div>
      <div class="progress mt-2.5"><i id="gen-bar"></i></div>
      <ol class="mt-3.5 space-y-2.5">${steps.map((s, i) => `<li class="gen-step" data-g="${i}"><span class="gs-ic"></span>${s}</li>`).join('')}</ol>
    </div>`;
  icons();
  for (let i = 0; i < steps.length; i++) {
    if (state.route !== 'studio') { S.generating = false; return; }
    const li = $(`[data-g="${i}"]`); if (!li) break;
    li.classList.add('active'); li.querySelector('.gs-ic').innerHTML = '<span class="spinner !w-3 !h-3 !border-[1.5px]"></span>';
    await sleep(430 + (i % 2) * 140);
    li.classList.remove('active'); li.classList.add('done'); li.querySelector('.gs-ic').innerHTML = ic('check'); icons();
    const pct = Math.round(((i + 1) / steps.length) * 100);
    $('#gen-bar').style.width = pct + '%'; $('#gen-pct').textContent = pct + '%';
  }
  await sleep(250);
  if (Object.keys(S.drafts).length) S.v++;
  P_ORDER.forEach(pl => {
    const prev = S.drafts[pl];
    const fmt = pl === S.platform ? S.format : (prev?.format || PLATFORMS[pl].formats[0]);
    S.drafts[pl] = { ...generateContent(p, pl, fmt, { tone: S.tone, audience: S.audience, goal: S.goal, v: S.v }), format: fmt, itemId: prev?.itemId || null, status: prev?.itemId ? prev.status : 'draft', generated: true };
  });
  state.credits.used = Math.min(state.credits.total, state.credits.used + 25);
  S.generating = false;
  rStudioEditor(); rStudioPreview(); renderSidebar();
  ['#f-caption', '#f-description', '#f-hashtags', '#f-cta'].forEach(s => { const el = $(s); el && el.classList.add('flash'); });
  toast('Content generated', `5 platform-ready posts created for ${p.address}.`, 'ai');
}

async function studioTool(kind) {
  const d = draft();
  if (!d || !d.caption.trim()) { toast('Nothing to work with yet', 'Generate with AI or write a caption first.', 'info'); $('#f-caption')?.focus(); return; }
  if (S.busy || S.generating) return;
  const p = studioProp();
  S.busy = true; rStudioEditor();
  await sleep(750);
  const opts = { tone: S.tone, audience: S.audience, goal: S.goal, v: S.v };
  let next = d;
  if (kind === 'regenerate') { S.v++; next = { ...d, ...generateContent(p, S.platform, S.format, { ...opts, v: S.v }) }; }
  if (kind === 'improve') next = improveContent(p, S.platform, S.format, opts, d);
  if (kind === 'shorten') next = shortenContent(p, S.platform, S.format, d);
  if (kind === 'professional') { const g = generateContent(p, S.platform, S.format, { ...opts, tone: 'professional' }); next = { ...d, caption: stripEmoji(g.caption), cta: stripEmoji(d.cta), hashtags: d.hashtags.split(' ').slice(0, Math.max(3, PLATFORMS[S.platform].tagRange[0])).join(' ') }; }
  S.drafts[S.platform] = { ...next, dirty: !!d.itemId };
  S.busy = false; S.expanded = false;
  rStudioEditor(); livePreview();
  $('#f-caption')?.classList.add('flash');
  if (kind === 'professional') state.credits.used += 2; else state.credits.used += 5;
  renderSidebar();
  const msg = { regenerate: ['New variation ready', 'A fresh take on your copy.'], improve: ['Copy improved', 'Added richer, more descriptive language.'], shorten: ['Copy shortened', 'Trimmed to the essentials.'], professional: ['Tone adjusted', 'Your copy now reads more professionally.'] }[kind];
  toast(msg[0], msg[1], 'ai');
}

function suggestedSlot(pl) {
  const t = { instagram: '18:30', facebook: '12:00', linkedin: '09:00', x: '12:30', youtube: '17:00' }[pl];
  return at(1, t);
}
function studioCommit(status, date) {
  const d = draft();
  if (!d || !d.caption.trim()) { toast('Nothing to save yet', 'Generate with AI or write a caption first.', 'info'); $('#f-caption')?.focus(); return null; }
  return commitDraft(S.platform, status, date);
}
function commitDraft(pl, status, date) {
  const d = S.drafts[pl];
  let item = d.itemId && getItem(d.itemId);
  if (!item) {
    item = { id: uid('c'), propertyId: S.propertyId, platform: pl, generatedAt: new Date(), note: '', date: date || suggestedSlot(pl) };
    state.content.push(item); d.itemId = item.id;
  }
  Object.assign(item, {
    format: d.format || S.format, caption: d.caption, description: d.description, hashtags: d.hashtags, cta: d.cta,
    image: S.images[0] || 0, images: [...S.images], tone: S.tone, audience: S.audience, goal: S.goal, status,
    date: date || item.date,
  });
  d.status = status; d.dirty = false;
  return item;
}

/* Schedule modal (used by Studio, Approvals, Calendar) */
function timeOptions(sel) {
  const out = [];
  for (let h = 6; h <= 22; h++) for (const m of [0, 30]) { const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; out.push(`<option value="${v}" ${v === sel ? 'selected' : ''}>${hmLabel(v)}</option>`); }
  return out.join('');
}
function openScheduleModal({ title = 'Schedule post', subtitle = '', date, platform, confirmLabel = 'Schedule', extraPlatforms = [], onConfirm }) {
  const d0 = date && date > new Date() ? date : suggestedSlot(platform);
  let hm = toHM(d0); if (!/:(00|30)$/.test(hm)) hm = hm.slice(0, 3) + (Number(hm.slice(3)) < 30 ? '30' : '00');
  const sugg = [[1, { instagram: '18:30', facebook: '12:00', linkedin: '09:00', x: '12:30', youtube: '17:00' }[platform]], [2, '12:00'], [4, '10:30']].map(([o, t]) => at(o, t));
  const m = openModal({
    title, subtitle, size: 'modal-sm',
    body: `
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label" for="sch-date">Date</label><input type="date" id="sch-date" class="input" value="${toISODate(d0)}" min="${toISODate(TODAY)}"></div>
        <div><label class="label" for="sch-time">Time</label><select id="sch-time" class="select">${timeOptions(hm)}</select></div>
      </div>
      <p class="hint mt-2 flex items-center gap-1.5">${ic('globe', 'w-3.5 h-3.5')}Times shown in Central Time (CT)</p>
      <div class="mt-4">
        <span class="label">Suggested times</span>
        <div class="flex flex-wrap gap-2">${sugg.map((s, i) => `<button type="button" class="chip ${i === 0 ? '' : ''}" data-sugg="${toISODate(s)}|${toHM(s)}">${i === 0 ? ic('sparkles') : ic('clock')}${fmtDate(s, { weekday: 'short' })} ${fmtTime(s)}</button>`).join('')}</div>
        <p class="hint mt-2">Based on when your ${PLATFORMS[platform].name} audience is typically most active.</p>
      </div>
      ${extraPlatforms.length ? `
      <div class="mt-5 pt-4 border-t border-line">
        <span class="label">Also schedule for</span>
        <div class="space-y-2">${extraPlatforms.map(x => `<label class="flex items-center gap-3 text-[13.5px] cursor-pointer">${'<input type="checkbox" class="check" data-extra="' + x + '">'}${pIcon(x, 'sm')}<span class="flex-1">${PLATFORMS[x].name}</span><span class="text-[12px] text-sub">${fmtDate(suggestedSlot(x), { weekday: 'short' })} ${fmtTime(suggestedSlot(x))}</span></label>`).join('')}</div>
      </div>` : ''}`,
    footer: `<button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-ok>${ic('calendar-check')}${confirmLabel}</button>`,
  });
  m.el.addEventListener('click', e => {
    const s = e.target.closest('[data-sugg]');
    if (s) { const [dd2, tt] = s.dataset.sugg.split('|'); m.el.querySelector('#sch-date').value = dd2; m.el.querySelector('#sch-time').value = tt; $$('[data-sugg]', m.el).forEach(b => b.classList.toggle('on', b === s)); }
  });
  m.el.querySelector('[data-ok]').addEventListener('click', () => {
    const dv = m.el.querySelector('#sch-date').value; const tv = m.el.querySelector('#sch-time').value;
    if (!dv) { m.el.querySelector('#sch-date').classList.add('is-invalid'); return; }
    const [y, mo, da] = dv.split('-').map(Number); const [h, mi] = tv.split(':').map(Number);
    const when = new Date(y, mo - 1, da, h, mi);
    if (when < new Date()) { m.el.querySelector('#sch-date').classList.add('is-invalid'); toast('Pick a future time', 'Posts can only be scheduled in the future.', 'warn'); return; }
    const extras = $$('[data-extra]', m.el).filter(c => c.checked).map(c => c.dataset.extra);
    m.close(); onConfirm(when, extras);
  });
}

/* ==========================================================================
   13. Content Calendar
   ========================================================================== */
const C = state.ui;
const calItems = () => state.content.filter(c => C.calPlatform === 'all' || c.platform === C.calPlatform);
const itemsOn = day => calItems().filter(c => sameDay(c.date, day)).sort((a, b) => a.date - b.date);
const weekStart = d => addDays(startOfDay(d), -d.getDay());
function calLabel() {
  const d = C.calCursor;
  if (C.calView === 'week') { const s = weekStart(d), e = addDays(s, 6); return s.getMonth() === e.getMonth() ? `${fmtDate(s, { month: 'long' })} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}` : `${fmtDate(s)} – ${fmtDate(e)}, ${e.getFullYear()}`; }
  if (C.calView === 'day') return fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return fmtDate(d, { month: 'long', year: 'numeric' });
}
function calShift(dir) {
  const d = new Date(C.calCursor);
  if (C.calView === 'month' || C.calView === 'list') { d.setDate(1); d.setMonth(d.getMonth() + dir); }
  else d.setDate(d.getDate() + (C.calView === 'week' ? 7 * dir : dir));
  C.calCursor = d;
  if (C.calView === 'day') C.calSelected = new Date(d);
}
function renderCalendar() {
  const legend = ['draft', 'review', 'approved', 'scheduled', 'published', 'failed'];
  return `
    ${pageHeader({
      title: 'Content Calendar', subtitle: 'Plan, review, and schedule your property marketing.',
      actions: `<button class="btn btn-secondary" data-action="go" data-route="approvals">${ic('list-checks')}Review queue</button><button class="btn btn-primary" data-action="go" data-route="studio">${ic('plus')}New post</button>`,
    })}
    <div class="card overflow-hidden">
      <div class="flex flex-col xl:flex-row xl:items-center gap-3 justify-between px-4 sm:px-5 py-3.5 border-b border-line">
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center">
            <button class="btn btn-secondary btn-sm btn-icon !rounded-r-none" data-action="cal-prev" aria-label="Previous">${ic('chevron-left')}</button>
            <button class="btn btn-secondary btn-sm !rounded-none -ml-px" data-action="cal-today">Today</button>
            <button class="btn btn-secondary btn-sm btn-icon !rounded-l-none -ml-px" data-action="cal-next" aria-label="Next">${ic('chevron-right')}</button>
          </div>
          <h2 class="text-[16px] sm:text-[17px] font-semibold tracking-tight text-ink ml-1.5" aria-live="polite">${calLabel()}</h2>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <label class="sr-only" for="cal-date">Jump to date</label>
          <input id="cal-date" type="date" class="input input-sm !w-[150px]" value="${toISODate(C.calSelected)}" data-change="calDate">
          <select class="select input-sm !w-[150px]" data-change="calPlatform" aria-label="Filter by platform">
            <option value="all">All platforms</option>${P_ORDER.map(p => `<option value="${p}" ${C.calPlatform === p ? 'selected' : ''}>${PLATFORMS[p].name}</option>`).join('')}
          </select>
          <div class="seg" role="tablist" aria-label="Calendar view">
            ${[['month', 'Month'], ['week', 'Week'], ['day', 'Day'], ['list', 'List']].map(([k, l]) => `<button role="tab" aria-selected="${C.calView === k}" class="${C.calView === k ? 'on' : ''}" data-action="cal-view" data-v="${k}">${l}</button>`).join('')}
          </div>
        </div>
      </div>
      <div id="cal-body">${calBody()}</div>
      <div class="px-4 sm:px-5 py-3 border-t border-line flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-sub bg-[#FAFAFB]">
        ${legend.map(s => `<span class="inline-flex items-center gap-1.5">${statusDot(s)}${STATUS[s].label}</span>`).join('')}
        <span class="ml-auto hidden sm:inline-flex items-center gap-1.5">${ic('mouse-pointer-click', 'w-3.5 h-3.5')}Click an event for details</span>
      </div>
    </div>`;
}
function calBody() { return { month: calMonth, week: () => calTimeGrid(7), day: () => calTimeGrid(1), list: calList }[C.calView](); }
const evChip = c => {
  const p = getProp(c.propertyId);
  return `<button class="cal-event" style="--c:${STATUS[c.status].color}" data-action="event" data-id="${c.id}" title="${PLATFORMS[c.platform].name} · ${STATUS[c.status].label} · ${esc(p.address)}">${pIcon(c.platform, 'xs', '!w-4 !h-4 !rounded-[4px]')}<span class="ce-time tnum">${fmtTime(c.date).replace(':00', '').replace(' ', '').toLowerCase()}</span><span class="truncate font-medium">${esc(p.address.split(' ').slice(1).join(' '))}</span></button>`;
};
function calMonth() {
  const cur = C.calCursor; const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((first.getDay() + days) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const sel = C.calSelected;
  const dayAgenda = itemsOn(sel);
  return `
    <div class="cal-grid" role="grid" aria-label="${calLabel()}">
      ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-dow" role="columnheader">${d}</div>`).join('')}
      ${cells.map(d => {
        const ev = itemsOn(d); const muted = d.getMonth() !== cur.getMonth();
        return `
        <div class="cal-cell ${muted ? 'muted' : ''} ${sameDay(d, TODAY) ? 'today' : ''} ${sameDay(d, sel) ? 'selected' : ''}" role="gridcell" data-action="cal-select" data-d="${toISODate(d)}" aria-label="${fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric' })}, ${ev.length} posts">
          <button class="cal-num tnum" data-action="cal-open-day" data-d="${toISODate(d)}" aria-label="Open ${fmtDate(d, { month: 'long', day: 'numeric' })} in day view">${d.getDate()}</button>
          ${ev.slice(0, 3).map(evChip).join('')}
          ${ev.length > 3 ? `<button class="cal-more text-[11.5px] font-medium text-sub hover:text-ink text-left px-1.5" data-action="cal-open-day" data-d="${toISODate(d)}">+${ev.length - 3} more</button>` : ''}
          ${ev.length ? `<span class="cal-dots">${ev.slice(0, 4).map(c => `<i style="background:${STATUS[c.status].color}"></i>`).join('')}</span>` : ''}
        </div>`;
      }).join('')}
    </div>
    <div class="md:hidden border-t border-line">
      <div class="px-4 pt-4 pb-2 text-[13px] font-semibold text-ink">${relDay(sel)}${relDay(sel).includes(',') ? '' : `, ${fmtDate(sel)}`} <span class="text-sub font-normal">· ${dayAgenda.length} post${dayAgenda.length === 1 ? '' : 's'}</span></div>
      ${dayAgenda.length ? `<div class="divide-y divide-line">${dayAgenda.map(agendaRow).join('')}</div>` : '<p class="px-4 pb-5 text-[13px] text-sub">No posts on this day.</p>'}
    </div>`;
}
function agendaRow(c) {
  const p = getProp(c.propertyId);
  return `
    <button class="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left hover:bg-[#FAFAFB] transition-colors" data-action="event" data-id="${c.id}">
      <span class="w-16 flex-none text-[12.5px] font-medium text-slate-600 tnum">${fmtTime(c.date)}</span>
      <span class="w-1 self-stretch rounded-full flex-none" style="background:${STATUS[c.status].color}"></span>
      <img src="${itemImg(c, 400)}" alt="" class="w-10 h-10 rounded-lg object-cover flex-none thumb">
      <span class="min-w-0 flex-1"><span class="flex items-center gap-2"><span class="text-[13.5px] font-medium text-ink truncate">${esc(p.address)}</span></span><span class="block text-[12.5px] text-sub truncate">${esc(c.caption.split('\n')[0])}</span></span>
      <span class="hidden sm:flex items-center gap-2 flex-none">${pIcon(c.platform, 'sm')}<span class="text-[12.5px] text-slate-600 w-[64px]">${FORMATS[c.format].label}</span></span>
      <span class="flex-none hidden sm:block">${badge(c.status)}</span>
      <span class="sm:hidden flex-none">${pIcon(c.platform, 'sm')}</span>
    </button>`;
}
function calTimeGrid(n) {
  const H0 = 7, H1 = 21, RH = 56;
  const start = n === 7 ? weekStart(C.calCursor) : startOfDay(C.calCursor);
  const days = Array.from({ length: n }, (_, i) => addDays(start, i));
  const now = new Date();
  const col = d => {
    const ev = itemsOn(d);
    const lanes = []; const placed = ev.map(c => { const top = clamp((c.date.getHours() + c.date.getMinutes() / 60 - H0) * RH, 0, (H1 - H0) * RH - 44); let lane = lanes.findIndex(end => end <= top); if (lane === -1) { lane = lanes.length; lanes.push(0); } lanes[lane] = top + 50; return { c, top, lane }; });
    const L = Math.max(1, lanes.length);
    return `
      <div class="tg-col ${sameDay(d, TODAY) ? 'today' : ''}" style="height:${(H1 - H0) * RH}px">
        ${Array.from({ length: H1 - H0 }, () => '<div class="tg-hour"></div>').join('')}
        ${placed.map(({ c, top, lane }) => { const p = getProp(c.propertyId); return `
          <button class="tg-event" style="--c:${STATUS[c.status].color};top:${top + 2}px;height:${n === 1 ? 52 : 48}px;left:calc(${(lane / L) * 100}% + 4px);right:auto;width:calc(${100 / L}% - 8px)" data-action="event" data-id="${c.id}" aria-label="${PLATFORMS[c.platform].name} post for ${esc(p.address)} at ${fmtTime(c.date)}">
            <span class="flex items-center gap-1.5 min-w-0">${pIcon(c.platform, 'xs', '!w-4 !h-4 !rounded-[4px]')}<span class="font-semibold text-ink truncate">${esc(n === 1 ? p.address : p.address.split(' ').slice(1, 3).join(' '))}</span></span>
            <span class="block text-[11px] text-sub mt-0.5 truncate tnum">${fmtTime(c.date)} · ${n === 1 ? `${FORMATS[c.format].label} · ${STATUS[c.status].label} · ${esc(c.caption.split('\n')[0])}` : STATUS[c.status].label}</span>
          </button>`; }).join('')}
        ${sameDay(d, now) && now.getHours() >= H0 && now.getHours() < H1 ? `<div class="now-line" style="top:${(now.getHours() + now.getMinutes() / 60 - H0) * RH}px"></div>` : ''}
      </div>`;
  };
  return `
    <div class="overflow-x-auto thin-scroll">
      <div class="${n === 7 ? 'min-w-[760px]' : ''}">
        <div class="grid border-b border-line sticky top-0 bg-white z-[3]" style="grid-template-columns:56px repeat(${n},minmax(0,1fr))">
          <div></div>
          ${days.map(d => `<button class="py-2.5 text-center border-l border-line hover:bg-[#FAFAFB] transition-colors" data-action="cal-open-day" data-d="${toISODate(d)}"><div class="text-[11.5px] font-semibold uppercase tracking-wider ${sameDay(d, TODAY) ? 'text-brand-700' : 'text-sub'}">${fmtDate(d, { weekday: 'short' })}</div><div class="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full text-[15px] font-semibold tnum ${sameDay(d, TODAY) ? 'bg-brand-600 text-white' : 'text-ink'}">${d.getDate()}</div></button>`).join('')}
        </div>
        <div class="grid max-h-[620px] overflow-y-auto thin-scroll tg-wrap" style="grid-template-columns:56px repeat(${n},minmax(0,1fr))">
          <div class="pt-0">${Array.from({ length: H1 - H0 }, (_, i) => `<div class="tg-label tnum">${i === 0 ? '' : hmLabel(`${String(H0 + i).padStart(2, '0')}:00`).replace(':00', '')}</div>`).join('')}</div>
          ${days.map(col).join('')}
        </div>
      </div>
    </div>
    ${n === 1 && !itemsOn(start).length ? `<div class="border-t border-line">${emptyState({ icon: 'calendar', title: 'No posts this day', text: 'Pick another date or create new content in the Studio.', action: `<button class="btn btn-primary btn-sm" data-action="go" data-route="studio">${ic('sparkles')}Create content</button>` })}</div>` : ''}`;
}
function calList() {
  const cur = C.calCursor;
  const items = calItems().filter(c => c.date.getMonth() === cur.getMonth() && c.date.getFullYear() === cur.getFullYear()).sort((a, b) => a.date - b.date);
  if (!items.length) return emptyState({ icon: 'calendar', title: 'No posts this month', text: 'Generate content for a property to fill your calendar.' });
  const groups = {};
  items.forEach(c => { const k = toISODate(c.date); (groups[k] = groups[k] || []).push(c); });
  return Object.entries(groups).map(([k, list]) => {
    const d = list[0].date;
    return `<div><div class="px-4 sm:px-5 py-2 bg-[#FAFAFB] border-b border-line text-[12px] font-semibold uppercase tracking-wider ${sameDay(d, TODAY) ? 'text-brand-700' : 'text-sub'} sticky top-0">${relDay(d)}${['Today', 'Tomorrow', 'Yesterday'].includes(relDay(d)) ? ` · ${fmtDate(d)}` : ''}</div><div class="divide-y divide-line border-b border-line">${list.map(agendaRow).join('')}</div></div>`;
  }).join('');
}

/* Event details modal */
function openEventModal(id) {
  const c = getItem(id); if (!c) return;
  const p = getProp(c.propertyId);
  const canResched = !['published'].includes(c.status);
  const m = openModal({
    size: 'modal-lg', bare: true, label: `${PLATFORMS[c.platform].name} post`,
    body: `
      <div class="relative h-[180px] sm:h-[200px] rounded-t-2xl overflow-hidden bg-slate-200">
        <img src="${itemImg(c)}" alt="" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20"></div>
        <button class="icon-btn absolute top-3 right-3 !bg-white/90 hover:!bg-white" data-close aria-label="Close">${ic('x', 'w-5 h-5')}</button>
        <div class="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 text-white">
          <div class="flex items-center gap-3 min-w-0">${pIcon(c.platform, 'lg', 'ring-2 ring-white/40')}<div class="min-w-0"><div class="text-[18px] font-semibold tracking-tight truncate">${esc(p.address)}</div><div class="text-[13px] text-white/80">${PLATFORMS[c.platform].name} ${FORMATS[c.format].label} · ${p.city}, ${p.state}</div></div></div>
          <span class="flex-none">${badge(c.status)}</span>
        </div>
      </div>
      <div class="modal-body">
        <div class="grid sm:grid-cols-3 gap-3">
          ${[['calendar', 'Publish date', fmtDate(c.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })], ['clock', 'Time', `${fmtTime(c.date)} CT`], ['sparkles', 'Generated', `${fmtDate(c.generatedAt)} · ${TONES[c.tone] || 'Professional'}`]].map(([i, l, v]) => `<div class="rounded-[10px] border border-line px-3.5 py-2.5"><div class="text-[11.5px] text-sub flex items-center gap-1.5">${ic(i, 'w-3.5 h-3.5')}${l}</div><div class="text-[13.5px] font-medium text-ink mt-0.5">${v}</div></div>`).join('')}
        </div>
        ${c.note ? `<div class="mt-4 rounded-[10px] ${c.status === 'failed' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-rose-50 border-rose-100 text-rose-800'} border px-3.5 py-2.5 text-[13px] flex items-start gap-2">${ic('circle-alert', 'w-4 h-4 mt-0.5 flex-none')}${esc(c.note)}</div>` : ''}
        <div class="mt-4">
          <div class="text-[12px] font-semibold uppercase tracking-wider text-sub mb-2">Content</div>
          <div class="rounded-[10px] bg-[#F7F7F9] border border-line p-4 text-[13.5px] text-slate-700 leading-relaxed pv-caption max-h-[200px] overflow-y-auto thin-scroll">${rich([c.caption, c.cta].filter(Boolean).join('\n\n'), 'text-brand-700')}${c.hashtags ? `\n\n<span class="text-brand-700">${esc(c.hashtags)}</span>` : ''}</div>
        </div>
      </div>
      <div class="modal-foot !justify-between">
        <button class="btn btn-soft-danger btn-sm" data-ev="delete">${ic('trash-2')}Delete</button>
        <div class="flex flex-wrap gap-2">
          <button class="btn btn-secondary btn-sm" data-ev="preview">${ic('eye')}Preview</button>
          ${canResched ? `<button class="btn btn-secondary btn-sm" data-ev="reschedule">${ic('calendar-clock')}Reschedule</button>` : ''}
          <button class="btn btn-secondary btn-sm" data-ev="edit">${ic('pencil')}Edit</button>
          ${c.status === 'review' || c.status === 'draft' ? `<button class="btn btn-primary btn-sm" data-ev="approve">${ic('check')}Approve</button>` : ''}
          ${c.status === 'failed' ? `<button class="btn btn-primary btn-sm" data-ev="retry">${ic('refresh-cw')}Retry</button>` : ''}
        </div>
      </div>`,
  });
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-ev]'); if (!b) return;
    const a = b.dataset.ev;
    if (a === 'edit') { m.close(); openStudio(null, { itemId: c.id }); }
    if (a === 'preview') { m.close(); openPreviewModal(c.id); }
    if (a === 'approve') { m.close(); setStatus(c.id, 'approved'); }
    if (a === 'reschedule') { m.close(); rescheduleItem(c.id); }
    if (a === 'retry') { m.close(); retryItem(c.id); }
    if (a === 'delete') { m.close(); deleteItem(c.id); }
  });
}

/* ==========================================================================
   14. Shared content-item actions
   ========================================================================== */
function afterContentChange() { renderSidebar(); refresh(); }
function setStatus(id, status, { silent = false, note } = {}) {
  const c = getItem(id); if (!c) return;
  const prev = { status: c.status, note: c.note };
  c.status = status; if (note !== undefined) c.note = note;
  syncStudioDraft(c);
  afterContentChange();
  if (silent) return;
  const p = getProp(c.propertyId);
  const msgs = {
    approved: ['Content approved', `${PLATFORMS[c.platform].name} post for ${p.address} is ready to schedule.`],
    rejected: ['Content rejected', 'Sent back with your feedback.'],
    review: ['Moved to review', 'The post is back in the approval queue.'],
    scheduled: ['Post scheduled', `${PLATFORMS[c.platform].name} · ${fmtLong(c.date)} at ${fmtTime(c.date)}`],
  };
  const [t, m] = msgs[status] || ['Status updated', ''];
  toast(t, m, status === 'rejected' ? 'info' : 'success', { label: 'Undo', fn: () => { c.status = prev.status; c.note = prev.note; syncStudioDraft(c); afterContentChange(); toast('Change undone', '', 'info'); } });
}
function syncStudioDraft(c) { const d = S.drafts[c.platform]; if (d && d.itemId === c.id) d.status = c.status; }
function rescheduleItem(id) {
  const c = getItem(id); const p = getProp(c.propertyId);
  openScheduleModal({
    title: c.status === 'scheduled' ? 'Reschedule post' : 'Schedule post', subtitle: `${PLATFORMS[c.platform].name} · ${p.address}`,
    date: c.date, platform: c.platform, confirmLabel: c.status === 'scheduled' ? 'Reschedule' : 'Schedule',
    onConfirm: when => {
      const was = c.status; c.date = when;
      if (['approved', 'failed', 'review', 'draft'].includes(c.status)) { c.status = 'scheduled'; c.note = ''; }
      syncStudioDraft(c);
      C.calCursor = new Date(when); C.calSelected = new Date(when);
      afterContentChange();
      toast(was === 'scheduled' ? 'Post rescheduled' : 'Post scheduled', `${PLATFORMS[c.platform].name} · ${fmtLong(when)} at ${fmtTime(when)}`, 'success');
    },
  });
}
function retryItem(id) {
  const c = getItem(id); const a = getAcct(c.platform);
  if (a.status !== 'connected') { toast(`Reconnect ${PLATFORMS[c.platform].name} first`, 'The account session has expired.', 'warn', { label: 'Reconnect', fn: () => openConnect(c.platform) }); return; }
  rescheduleItem(id);
}
function deleteItem(id) {
  const c = getItem(id); if (!c) return;
  confirmDialog({
    title: 'Delete this post?', danger: true, confirm: 'Delete post',
    message: `The ${PLATFORMS[c.platform].name} ${FORMATS[c.format].label.toLowerCase()} for ${esc(getProp(c.propertyId).address)} will be removed from your calendar. This can’t be undone.`,
    onConfirm: () => { state.content = state.content.filter(x => x.id !== id); Object.values(S.drafts).forEach(d => { if (d.itemId === id) d.itemId = null; }); afterContentChange(); toast('Post deleted', '', 'success'); },
  });
}
function openPreviewModal(id) {
  const c = getItem(id); if (!c) return;
  const p = getProp(c.propertyId);
  const data = { platform: c.platform, format: c.format, caption: c.caption, description: c.description, hashtags: c.hashtags, cta: c.cta, images: (c.images || [c.image]).map(i => (p.photos[i] || p.photos[0]).src), property: p, idx: 0, expanded: true, empty: false };
  const canAct = c.status === 'review' || c.status === 'draft';
  const m = openModal({
    size: 'modal-lg', title: `${PLATFORMS[c.platform].name} preview`, subtitle: `${esc(p.address)} · ${FORMATS[c.format].label}`,
    body: `
      <div class="grid md:grid-cols-[minmax(0,1fr)_220px] gap-6 items-start">
        <div class="bg-[#F1F4F9] rounded-2xl py-6 px-3">${buildPreview(data)}</div>
        <div class="space-y-4 text-[13px]">
          <div><div class="text-sub text-[12px] mb-1">Status</div>${badge(c.status)}</div>
          <div><div class="text-sub text-[12px] mb-1">Publish</div><div class="font-medium text-ink">${fmtLong(c.date)} · ${fmtTime(c.date)}</div></div>
          <div><div class="text-sub text-[12px] mb-1">Account</div><div class="font-medium text-ink flex items-center gap-2">${pIcon(c.platform, 'xs')}${getAcct(c.platform).account || 'Not connected'}</div></div>
          <div><div class="text-sub text-[12px] mb-1">AI settings</div><div class="text-ink">${TONES[c.tone] || 'Professional'} · ${AUDIENCES[c.audience] || 'Buyers'} · ${GOALS[c.goal] || 'Lead Generation'}</div></div>
          <div><div class="text-sub text-[12px] mb-1">Generated</div><div class="text-ink">${fmtDate(c.generatedAt)} at ${fmtTime(c.generatedAt)}</div></div>
        </div>
      </div>`,
    footer: `
      <button class="btn btn-secondary mr-auto" data-pv="edit">${ic('pencil')}Edit in Studio</button>
      ${canAct ? `<button class="btn btn-soft-danger" data-pv="reject">${ic('x')}Reject</button><button class="btn btn-primary" data-pv="approve">${ic('check')}Approve</button>` : `<button class="btn btn-secondary" data-close>Close</button>`}`,
  });
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-pv]'); if (!b) return;
    m.close();
    if (b.dataset.pv === 'edit') openStudio(null, { itemId: c.id });
    if (b.dataset.pv === 'approve') approveItem(c.id);
    if (b.dataset.pv === 'reject') rejectItem(c.id);
  });
}
function itemMenuHTML(id) {
  const c = getItem(id);
  return `
    ${ddItem('eye', 'Preview', 'preview-item', `data-id="${id}"`)}
    ${ddItem('pencil', 'Edit in Studio', 'edit-item', `data-id="${id}"`)}
    ${c.status === 'review' || c.status === 'draft' ? ddItem('check', 'Approve', 'approve-item', `data-id="${id}"`) : ''}
    ${c.status !== 'published' ? ddItem('calendar-clock', c.status === 'scheduled' ? 'Reschedule' : 'Schedule', 'reschedule-item', `data-id="${id}"`) : ''}
    <div class="dd-sep"></div>
    ${ddItem('trash-2', 'Delete', 'delete-item', `data-id="${id}"`, true)}`;
}

/* ==========================================================================
   15. Approvals
   ========================================================================== */
const AP_TABS = [['review', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['scheduled', 'Scheduled']];
function apItems(tab = C.apTab) {
  return state.content.filter(c => c.status === tab && (C.apPlatform === 'all' || c.platform === C.apPlatform))
    .sort((a, b) => tab === 'review' ? b.generatedAt - a.generatedAt : a.date - b.date);
}
function renderApprovals() {
  const pend = apItems('review');
  return `
    ${pageHeader({
      title: 'Content Approvals', subtitle: 'Review AI-generated content before it goes live.',
      actions: `${C.apTab === 'review' && pend.length ? `<button class="btn btn-secondary" data-action="approve-all">${ic('check-check')}Approve all (${pend.length})</button>` : ''}<button class="btn btn-primary" data-action="go" data-route="studio">${ic('sparkles')}Generate more</button>`,
    })}
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
      <div class="tabs flex-1 no-scrollbar" role="tablist" aria-label="Approval status">
        ${AP_TABS.map(([k, l]) => `<button class="tab ${C.apTab === k ? 'on' : ''}" role="tab" aria-selected="${C.apTab === k}" data-action="ap-tab" data-v="${k}">${l}<span class="tab-count tnum">${state.content.filter(c => c.status === k).length}</span></button>`).join('')}
      </div>
      <select class="select input-sm sm:!w-[170px] sm:mb-1.5" data-change="apPlatform" aria-label="Filter by platform">
        <option value="all">All platforms</option>${P_ORDER.map(p => `<option value="${p}" ${C.apPlatform === p ? 'selected' : ''}>${PLATFORMS[p].name}</option>`).join('')}
      </select>
    </div>
    <div id="ap-list">${apListHTML()}</div>`;
}
function apListHTML() {
  const items = apItems();
  if (!items.length) {
    const E = {
      review: ['circle-check-big', 'You’re all caught up', 'No content is waiting for review. New AI drafts will appear here.'],
      approved: ['badge-check', 'No approved posts waiting', 'Approved posts ready to schedule will appear here.'],
      rejected: ['circle-x', 'Nothing rejected', 'Posts you send back with feedback will be listed here.'],
      scheduled: ['calendar-clock', 'No scheduled posts', 'Schedule approved content to see it here.'],
    }[C.apTab];
    return `<div class="card">${emptyState({ icon: E[0], title: E[1], text: E[2], action: `<button class="btn btn-secondary" data-action="go" data-route="studio">${ic('sparkles')}Open Content Studio</button>` })}</div>`;
  }
  return `<div class="grid gap-4 xl:grid-cols-2 stagger">${items.map(approvalCard).join('')}</div>`;
}
function approvalCard(c) {
  const p = getProp(c.propertyId);
  const actions = {
    review: `<button class="btn btn-ghost btn-sm btn-icon" data-action="preview-item" data-id="${c.id}" aria-label="Preview" title="Preview">${ic('eye')}</button>
             <button class="btn btn-ghost btn-sm btn-icon" data-action="edit-item" data-id="${c.id}" aria-label="Edit" title="Edit">${ic('pencil')}</button>
             <button class="btn btn-soft-danger btn-sm" data-action="reject-item" data-id="${c.id}">${ic('x')}Reject</button>
             <button class="btn btn-secondary btn-sm" data-action="reschedule-item" data-id="${c.id}" title="Approve & schedule">${ic('calendar-clock')}<span class="hidden 2xl:inline">Schedule</span></button>
             <button class="btn btn-primary btn-sm" data-action="approve-item" data-id="${c.id}">${ic('check')}Approve</button>`,
    approved: `<button class="btn btn-ghost btn-sm btn-icon" data-action="preview-item" data-id="${c.id}" aria-label="Preview">${ic('eye')}</button>
               <button class="btn btn-ghost btn-sm btn-icon" data-action="edit-item" data-id="${c.id}" aria-label="Edit">${ic('pencil')}</button>
               <button class="btn btn-secondary btn-sm" data-action="set-status" data-id="${c.id}" data-s="review">${ic('undo-2')}Unapprove</button>
               <button class="btn btn-primary btn-sm" data-action="reschedule-item" data-id="${c.id}">${ic('calendar-clock')}Schedule</button>`,
    rejected: `<button class="btn btn-ghost btn-sm btn-icon" data-action="preview-item" data-id="${c.id}" aria-label="Preview">${ic('eye')}</button>
               <button class="btn btn-secondary btn-sm" data-action="edit-item" data-id="${c.id}">${ic('pencil')}Edit</button>
               <button class="btn btn-primary btn-sm" data-action="set-status" data-id="${c.id}" data-s="review">${ic('rotate-ccw')}Restore</button>`,
    scheduled: `<button class="btn btn-ghost btn-sm btn-icon" data-action="preview-item" data-id="${c.id}" aria-label="Preview">${ic('eye')}</button>
                <button class="btn btn-ghost btn-sm btn-icon" data-action="edit-item" data-id="${c.id}" aria-label="Edit">${ic('pencil')}</button>
                <button class="btn btn-secondary btn-sm" data-action="set-status" data-id="${c.id}" data-s="approved">${ic('calendar-x')}Unschedule</button>
                <button class="btn btn-primary btn-sm" data-action="reschedule-item" data-id="${c.id}">${ic('calendar-clock')}Reschedule</button>`,
  }[c.status] || '';
  return `
    <article class="card overflow-hidden flex flex-col sm:flex-row transition-shadow hover:shadow-lift" data-card="${c.id}">
      <button class="relative sm:w-[176px] flex-none aspect-[16/9] sm:aspect-auto bg-slate-200 overflow-hidden img-zoom" data-action="preview-item" data-id="${c.id}" aria-label="Preview post">
        <img src="${itemImg(c, 800)}" alt="" class="absolute inset-0 w-full h-full object-cover" loading="lazy">
        <span class="absolute top-2.5 left-2.5 flex items-center gap-1.5">${pIcon(c.platform, 'sm', 'shadow')}<span class="badge b-dark !h-6">${ic(FORMATS[c.format].icon)}${FORMATS[c.format].label}</span></span>
      </button>
      <div class="flex-1 min-w-0 p-4 flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0"><h3 class="font-semibold text-[14.5px] text-ink truncate">${esc(p.address)}</h3><p class="text-[12.5px] text-sub mt-0.5 truncate">${PLATFORMS[c.platform].name} · ${p.city}, ${p.state} · ${TONES[c.tone] || 'Professional'} tone</p></div>
          ${badge(c.status, STATUS, 'flex-none')}
        </div>
        <p class="mt-2.5 text-[13.5px] text-slate-600 leading-relaxed line-clamp-3">${esc(c.caption.replace(/\s*\n+\s*/g, ' '))}</p>
        ${c.status === 'rejected' && c.note ? `<div class="mt-2.5 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-[12.5px] text-rose-800 flex items-start gap-2">${ic('message-square-warning', 'w-3.5 h-3.5 mt-0.5 flex-none')}<span class="line-clamp-2">${esc(c.note)}</span></div>` : ''}
        ${c.status === 'scheduled' || c.status === 'approved' ? `<div class="mt-2.5 text-[12.5px] text-slate-600 flex items-center gap-1.5">${ic('calendar-clock', 'w-3.5 h-3.5 text-blue-600')}${c.status === 'scheduled' ? 'Publishes' : 'Planned for'} ${relDay(c.date)} at ${fmtTime(c.date)}</div>` : ''}
        <div class="mt-auto pt-3.5 flex flex-wrap items-center justify-between gap-2">
          <span class="text-[12px] text-muted flex items-center gap-1.5">${ic('sparkles', 'w-3.5 h-3.5')}Generated ${timeAgo(c.generatedAt)}</span>
          <div class="flex flex-wrap items-center gap-1.5">${actions}</div>
        </div>
      </div>
    </article>`;
}
async function animateOut(id) {
  const el = document.querySelector(`[data-card="${id}"]`);
  if (el && state.route === 'approvals') { el.classList.add('leaving'); await sleep(300); }
}
async function approveItem(id) { await animateOut(id); setStatus(id, 'approved'); }
function rejectItem(id) {
  const c = getItem(id);
  const reasons = ['Pricing or details need updating', 'Tone doesn’t match our brand', 'Wrong photo selected', 'Other'];
  const m = confirmDialog({
    title: 'Reject this post?', icon: 'message-square-warning', confirm: 'Reject post',
    message: 'Add a note so the content can be revised. It will move to the Rejected tab.',
    extra: `<div class="mt-4 flex flex-wrap gap-1.5">${reasons.map(r => `<button type="button" class="chip !h-7 !text-[12px]" data-reason="${esc(r)}">${esc(r)}</button>`).join('')}</div><label class="sr-only" for="rej-note">Feedback</label><textarea id="rej-note" class="textarea mt-3" rows="3" placeholder="e.g. Lead with the rooftop deck and mention the new price."></textarea>`,
    onConfirm: async () => { const note = m.el.querySelector('#rej-note').value.trim() || 'Needs revision before publishing.'; m.close(); await animateOut(id); setStatus(id, 'rejected', { note }); },
  });
  m.el.addEventListener('click', e => { const r = e.target.closest('[data-reason]'); if (r) { $$('[data-reason]', m.el).forEach(b => b.classList.toggle('on', b === r)); const t = m.el.querySelector('#rej-note'); if (r.dataset.reason !== 'Other') t.value = r.dataset.reason + '.'; t.focus(); } });
}
function approveAll() {
  const items = apItems('review');
  confirmDialog({
    title: `Approve ${items.length} posts?`, icon: 'check-check', confirm: 'Approve all',
    message: 'All pending posts in the current view will be approved and become ready to schedule.',
    onConfirm: () => {
      items.forEach(c => { c.status = 'approved'; syncStudioDraft(c); });
      afterContentChange();
      toast(`${items.length} posts approved`, 'They’re ready to schedule from the Approved tab.', 'success', { label: 'Undo', fn: () => { items.forEach(c => { c.status = 'review'; syncStudioDraft(c); }); afterContentChange(); } });
    },
  });
}

/* ==========================================================================
   16. Media Library
   ========================================================================== */
const MEDIA_CATS = [['all', 'All Assets', 'layers'], ['photo', 'Property Photos', 'image'], ['floorplan', 'Floor Plans', 'layout-panel-left'], ['creative', 'AI Creatives', 'sparkles'], ['video', 'Videos', 'video']];
function filteredMedia() {
  const q = C.mediaQ.trim().toLowerCase();
  return state.media.filter(a => (C.mediaCat === 'all' || a.kind === C.mediaCat) && (!q || `${a.name} ${a.label} ${getProp(a.propertyId)?.address || ''}`.toLowerCase().includes(q)));
}
function creativeHTML(a, cls = '') {
  const c = a.creative;
  return `<div class="creative ${c.style === 'light' ? 'cr-light' : ''} ${c.style === 'frame' ? 'cr-frame' : ''} ${cls}"><img src="${a.thumb === a.src ? a.src : a.src}" alt=""><div class="cr-shade"></div><div class="cr-brand">${LOGO(14).replace('class="flex-none"', 'class="flex-none" style="width:1.3em;height:1.3em"')}Morgan & Co.</div><div class="cr-body"><span class="cr-kicker">${esc(c.kicker)}</span><div class="cr-title">${esc(c.title)}</div><div class="cr-sub">${esc(c.sub)}</div></div></div>`;
}
function assetVisual(a, big = false) {
  if (a.kind === 'creative') return creativeHTML(a, 'absolute inset-0');
  if (a.kind === 'video') return `<img src="${big ? a.src : a.thumb}" alt="" class="absolute inset-0 w-full h-full object-cover" loading="lazy"><div class="absolute inset-0 bg-black/15"></div><span class="absolute inset-0 grid place-content-center"><span class="play-badge">${ic('play')}</span></span><span class="absolute bottom-2 right-2 badge b-dark tnum">${a.duration}</span>`;
  if (a.kind === 'floorplan') return `<img src="${a.src}" alt="" class="absolute inset-0 w-full h-full object-contain bg-[#F8FAFC] p-1">`;
  return `<img src="${big ? a.src : a.thumb}" alt="" class="absolute inset-0 w-full h-full object-cover" loading="lazy">`;
}
const KIND_LABEL = { photo: 'Photo', floorplan: 'Floor plan', creative: 'AI creative', video: 'Video' };
function renderMedia() {
  return `
    ${pageHeader({
      title: 'Media Library', subtitle: 'Organize your property images and marketing assets.',
      actions: `<label class="btn btn-primary cursor-pointer">${ic('upload')}Upload<input type="file" class="sr-only" accept="image/*,video/*" multiple data-upload></label>`,
    })}
    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4" role="tablist" aria-label="Asset categories">
      ${MEDIA_CATS.map(([k, l, i]) => { const n = k === 'all' ? state.media.length : state.media.filter(a => a.kind === k).length; return `<button class="chip flex-none ${C.mediaCat === k ? 'on' : ''}" role="tab" aria-selected="${C.mediaCat === k}" data-action="media-cat" data-v="${k}">${ic(i)}${l}<span class="text-[11.5px] tnum ${C.mediaCat === k ? 'text-brand-700/70' : 'text-muted'}">${n}</span></button>`; }).join('')}
    </div>
    <div class="card p-3 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="input-icon flex-1">${ic('search')}<input class="input" placeholder="Search by file name or property…" value="${esc(C.mediaQ)}" data-input="mediaQ" aria-label="Search assets"></div>
      <div class="flex items-center gap-2 justify-between">
        <button class="btn btn-ghost btn-sm" data-action="media-select-all">${ic('square-check-big')}Select all</button>
        <div class="seg seg-icon" role="group" aria-label="View mode">
          <button class="${C.mediaView === 'grid' ? 'on' : ''}" data-action="media-view" data-v="grid" aria-label="Grid view" aria-pressed="${C.mediaView === 'grid'}">${ic('layout-grid')}</button>
          <button class="${C.mediaView === 'list' ? 'on' : ''}" data-action="media-view" data-v="list" aria-label="List view" aria-pressed="${C.mediaView === 'list'}">${ic('list')}</button>
        </div>
      </div>
    </div>
    <div id="media-sel-bar">${mediaSelBar()}</div>
    <div id="media-results">${mediaResults()}</div>`;
}
function mediaSelBar() {
  const n = C.mediaSel.size; if (!n) return '';
  return `
    <div class="sticky top-[76px] z-20 mb-4 flex items-center gap-3 rounded-xl bg-navy text-white px-4 py-2.5 shadow-lift pv-fade">
      <span class="text-[13.5px] font-medium tnum">${n} selected</span>
      <button class="text-[13px] text-slate-400 hover:text-white" data-action="media-clear">Clear</button>
      <div class="ml-auto flex items-center gap-1.5">
        <button class="btn btn-sm !bg-white/10 hover:!bg-white/15 !text-white" data-action="media-use">${ic('sparkles')}<span class="hidden sm:inline">Use in Studio</span></button>
        <button class="btn btn-sm !bg-white/10 hover:!bg-white/15 !text-white" data-action="demo-toast" data-msg="${n} files prepared for download (demo).">${ic('download')}<span class="hidden sm:inline">Download</span></button>
        <button class="btn btn-sm btn-danger" data-action="media-delete">${ic('trash-2')}<span class="hidden sm:inline">Delete</span></button>
      </div>
    </div>`;
}
function mediaResults() {
  const list = filteredMedia();
  if (!list.length) return `<div class="card">${emptyState({ icon: 'image-off', title: 'No assets found', text: 'Try another search or category, or upload new files.', action: `<button class="btn btn-secondary" data-action="media-reset">${ic('rotate-ccw')}Reset filters</button>` })}</div>`;
  if (C.mediaView === 'list') {
    return `<div class="card overflow-hidden"><div class="overflow-x-auto thin-scroll"><table class="table min-w-[720px]"><thead><tr><th class="w-10"><span class="sr-only">Select</span></th><th>Name</th><th>Type</th><th>Property</th><th>Size</th><th>Added</th><th class="w-10"></th></tr></thead><tbody>
      ${list.map(a => { const p = getProp(a.propertyId); const sel = C.mediaSel.has(a.id); return `
        <tr class="${sel ? 'bg-brand-50/60' : ''}">
          <td><input type="checkbox" class="check" ${sel ? 'checked' : ''} data-action="media-toggle" data-id="${a.id}" aria-label="Select ${esc(a.name)}"></td>
          <td><button class="flex items-center gap-3 text-left min-w-0" data-action="media-open" data-id="${a.id}"><span class="relative w-12 h-9 rounded-md overflow-hidden flex-none bg-slate-100">${assetVisual(a)}</span><span class="text-[13px] font-medium text-ink truncate max-w-[260px]">${esc(a.name)}</span></button></td>
          <td class="text-[13px] text-slate-600">${KIND_LABEL[a.kind]}</td>
          <td class="text-[13px] text-slate-600 truncate max-w-[180px]">${p ? esc(p.address) : '—'}</td>
          <td class="text-[13px] text-slate-600 tnum">${a.size}</td>
          <td class="text-[13px] text-slate-600">${fmtDate(a.uploadedAt)}</td>
          <td class="!pl-0"><button class="icon-btn !w-8 !h-8" data-action="media-open" data-id="${a.id}" aria-label="Preview">${ic('maximize-2')}</button></td>
        </tr>`; }).join('')}
    </tbody></table></div></div>`;
  }
  return `
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
      ${list.map(a => { const p = getProp(a.propertyId); const sel = C.mediaSel.has(a.id); return `
        <div class="asset-card card relative overflow-hidden group transition-all duration-200 hover:shadow-lift ${sel ? 'selected' : ''}">
          <button class="relative block w-full aspect-[4/3] bg-slate-100 overflow-hidden img-zoom" data-action="media-open" data-id="${a.id}" aria-label="Preview ${esc(a.name)}">${assetVisual(a)}</button>
          <label class="asset-check absolute top-2 left-2 z-[3] w-7 h-7 rounded-lg bg-white/95 shadow grid place-content-center cursor-pointer" title="Select">
            <input type="checkbox" class="check" ${sel ? 'checked' : ''} data-action="media-toggle" data-id="${a.id}" aria-label="Select ${esc(a.name)}">
          </label>
          ${a.kind === 'creative' ? `<span class="absolute top-2 right-2 z-[3] ai-badge !h-6 !text-[11px]">${ic('sparkles')}AI</span>` : ''}
          <div class="p-3">
            <div class="text-[12.5px] font-medium text-ink truncate" title="${esc(a.name)}">${esc(a.name)}</div>
            <div class="text-[11.5px] text-sub truncate mt-0.5">${KIND_LABEL[a.kind]} · ${a.size}${p ? ` · ${esc(p.address.split(' ').slice(1).join(' '))}` : ''}</div>
          </div>
        </div>`; }).join('')}
    </div>`;
}
function rMedia() { const r = $('#media-results'); if (r) { r.innerHTML = mediaResults(); } const b = $('#media-sel-bar'); if (b) b.innerHTML = mediaSelBar(); icons(); }
function openAssetModal(id) {
  const a = state.media.find(x => x.id === id); if (!a) return;
  const p = getProp(a.propertyId);
  const m = openModal({
    size: 'modal-xl', bare: true, label: a.name,
    body: `
      <div class="modal-scroll grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div class="relative bg-[#0B1220] rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none min-h-[260px] aspect-[4/3] lg:aspect-auto lg:min-h-[520px] overflow-hidden">
          ${a.kind === 'creative' ? `<div class="absolute inset-0 grid place-content-center p-6"><div class="relative w-[min(440px,70vw)] aspect-square rounded-xl overflow-hidden shadow-2xl">${creativeHTML(a, 'absolute inset-0')}</div></div>` : assetVisual(a, true).replace('object-cover', a.kind === 'floorplan' ? 'object-contain' : 'object-cover')}
        </div>
        <div class="p-5 flex flex-col">
          <div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="text-[12px] font-medium text-sub">${KIND_LABEL[a.kind]}</div><h2 class="text-[15px] font-semibold text-ink break-all mt-0.5">${esc(a.name)}</h2></div><button class="icon-btn -mr-2 -mt-1 flex-none" data-close aria-label="Close">${ic('x', 'w-5 h-5')}</button></div>
          <dl class="mt-5 space-y-3 text-[13px]">
            ${[['Property', p ? esc(p.address) : '—'], ['Dimensions', a.dims], ['File size', a.size], ['Added', fmtDate(a.uploadedAt, { month: 'short', day: 'numeric', year: 'numeric' })], ['Used in', `${state.content.filter(c => c.propertyId === a.propertyId).length} posts`]].map(([k, v]) => `<div class="flex justify-between gap-4"><dt class="text-sub">${k}</dt><dd class="text-ink font-medium text-right truncate">${v}</dd></div>`).join('')}
          </dl>
          <div class="mt-5 flex flex-wrap gap-1.5">${[KIND_LABEL[a.kind], a.label, p?.city].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="mt-6 lg:mt-auto pt-4 grid gap-2">
            ${p && a.kind === 'photo' ? `<button class="btn btn-primary" data-as="use">${ic('sparkles')}Use in Content Studio</button>` : ''}
            <div class="grid grid-cols-2 gap-2"><button class="btn btn-secondary" data-as="download">${ic('download')}Download</button><button class="btn btn-soft-danger" data-as="delete">${ic('trash-2')}Delete</button></div>
          </div>
        </div>
      </div>`,
  });
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-as]'); if (!b) return;
    if (b.dataset.as === 'download') toast('Download started', `${a.name} (demo — no file is saved).`, 'info');
    if (b.dataset.as === 'use') { m.close(); useAssetsInStudio([a.id]); }
    if (b.dataset.as === 'delete') { deleteAssets([a.id], () => m.close()); }
  });
}
function useAssetsInStudio(ids) {
  const assets = ids.map(id => state.media.find(a => a.id === id)).filter(a => a && a.kind === 'photo');
  if (!assets.length) return toast('Select property photos', 'Only property photos can be used as post images.', 'info');
  const pid = assets[0].propertyId; const p = getProp(pid);
  const idx = assets.filter(a => a.propertyId === pid).map(a => p.photos.findIndex(ph => ph.src === a.src)).filter(i => i > -1);
  if (pid !== S.propertyId) { S.propertyId = pid; S.drafts = {}; S.v = 0; }
  S.images = idx.length ? idx : [0];
  if (S.images.length > 1 && PLATFORMS[S.platform].formats.includes('carousel')) S.format = 'carousel';
  C.mediaSel.clear();
  go('studio');
  toast('Media added to Studio', `${S.images.length} image${S.images.length > 1 ? 's' : ''} from ${p.address} selected.`, 'success');
}
function deleteAssets(ids, after) {
  confirmDialog({
    title: ids.length > 1 ? `Delete ${ids.length} assets?` : 'Delete this asset?', danger: true, confirm: 'Delete',
    message: ids.length > 1 ? 'These files will be permanently removed from your media library.' : 'This file will be permanently removed from your media library. Published posts are not affected.',
    onConfirm: () => { state.media = state.media.filter(a => !ids.includes(a.id)); ids.forEach(id => C.mediaSel.delete(id)); after && after(); refresh(); toast(ids.length > 1 ? `${ids.length} assets deleted` : 'Asset deleted', '', 'success'); },
  });
}
async function uploadMedia(files) {
  const list = [...files].filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 12);
  if (!list.length) return toast('Unsupported file type', 'Upload images or videos.', 'warn');
  toast(`Uploading ${list.length} file${list.length > 1 ? 's' : ''}…`, 'Optimizing for social platforms.', 'info');
  await sleep(900);
  list.forEach((f, i) => {
    const url = URL.createObjectURL(f); const isVid = f.type.startsWith('video/');
    state.media.unshift({ id: uid('up'), kind: isVid ? 'video' : 'photo', propertyId: null, src: isVid ? FALLBACK_IMG : url, thumb: isVid ? FALLBACK_IMG : url, name: f.name, label: 'Upload', size: `${(f.size / 1048576).toFixed(1)} MB`, dims: '—', duration: isVid ? '0:00' : undefined, uploadedAt: new Date() });
  });
  C.mediaCat = 'all';
  if (state.route === 'media') refresh();
  toast('Upload complete', `${list.length} file${list.length > 1 ? 's' : ''} added to your library.`, 'success');
}

/* ==========================================================================
   17. Social Accounts
   ========================================================================== */
function renderSocial() {
  const connected = state.accounts.filter(a => a.status === 'connected').length;
  const attention = state.accounts.filter(a => a.status === 'expired').length;
  return `
    ${pageHeader({ title: 'Social Accounts', subtitle: 'Connect your social channels and manage publishing access.', actions: `<button class="btn btn-secondary" data-action="sync-all">${ic('refresh-cw')}Sync all</button>` })}
    <div class="grid sm:grid-cols-3 gap-4 mb-6">
      ${[['plug', 'bg-emerald-50 text-emerald-600', `${connected} of 5`, 'Channels connected'], ['triangle-alert', attention ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600', String(attention), 'Need attention'], ['shield-check', 'bg-blue-50 text-blue-600', 'Secure', 'Tokens encrypted at rest']].map(([i, t, v, l]) => `<div class="card p-4 flex items-center gap-3.5"><div class="stat-icon ${t}">${ic(i)}</div><div><div class="text-[18px] font-semibold text-ink leading-tight">${v}</div><div class="text-[12.5px] text-sub">${l}</div></div></div>`).join('')}
    </div>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger">${state.accounts.map(accountCard).join('')}</div>
    <div class="mt-6 rounded-xl border border-dashed border-line-strong bg-white/60 p-4 flex items-start gap-3 text-[13px] text-sub" style="border-color:#D6DDE7">${ic('info', 'w-4 h-4 mt-0.5 flex-none text-slate-500')}<p><b class="font-semibold text-slate-700">Demo environment.</b> Connections here are simulated — no real OAuth authorization is performed and nothing is posted to your accounts.</p></div>`;
}
function accountCard(a) {
  const P = PLATFORMS[a.id];
  const st = a.status;
  return `
    <article class="card p-5 flex flex-col card-hover">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3.5 min-w-0">${pIcon(a.id, 'lg')}<div class="min-w-0"><h3 class="text-[15px] font-semibold text-ink">${P.name}</h3><p class="text-[13px] text-sub truncate">${a.account ? esc(a.account) : 'No account connected'}</p></div></div>
        ${acctStatusBadge(a).replace('Reconnect', 'Reconnect needed')}
      </div>
      <dl class="mt-5 grid grid-cols-2 gap-3 text-[12.5px]">
        <div class="rounded-[10px] bg-[#F7F7F9] border border-line px-3 py-2.5"><dt class="text-sub">${a.id === 'youtube' ? 'Subscribers' : a.id === 'linkedin' ? 'Connections' : 'Followers'}</dt><dd class="text-[14px] font-semibold text-ink mt-0.5 tnum">${a.followers || '—'}</dd></div>
        <div class="rounded-[10px] bg-[#F7F7F9] border border-line px-3 py-2.5"><dt class="text-sub">Last sync</dt><dd class="text-[14px] font-semibold mt-0.5 ${st === 'expired' ? 'text-amber-700' : 'text-ink'}">${a.lastSync ? timeAgo(a.lastSync) : '—'}</dd></div>
      </dl>
      <ul class="mt-4 space-y-1.5 text-[12.5px] text-slate-600">${a.perms.map(x => `<li class="flex items-center gap-2">${ic(st === 'connected' ? 'check' : 'minus', `w-3.5 h-3.5 ${st === 'connected' ? 'text-emerald-600' : 'text-muted'}`)}${x}</li>`).join('')}</ul>
      ${st === 'expired' ? `<div class="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-[12.5px] text-amber-800 flex items-start gap-2">${ic('triangle-alert', 'w-3.5 h-3.5 mt-0.5 flex-none')}Session expired — 1 post failed to publish.</div>` : ''}
      <div class="mt-5 pt-4 border-t border-line flex items-center gap-2 mt-auto">
        ${st === 'connected'
          ? `<button class="btn btn-secondary btn-sm flex-1" data-action="sync-one" data-id="${a.id}">${ic('refresh-cw')}Sync now</button><button class="btn btn-ghost btn-sm btn-icon" data-action="acct-menu" data-id="${a.id}" aria-label="More options" aria-haspopup="menu" aria-expanded="false">${ic('ellipsis')}</button>`
          : `<button class="btn btn-primary btn-sm flex-1" data-action="connect" data-id="${a.id}">${ic(st === 'expired' ? 'refresh-cw' : 'plug')}${st === 'expired' ? 'Reconnect' : 'Connect'} ${P.name}</button>`}
      </div>
    </article>`;
}
function openConnect(pid) {
  const P = PLATFORMS[pid]; const a = getAcct(pid);
  const opts = DEMO_ACCOUNT_OPTIONS[pid];
  let choice = 0;
  const m = openModal({
    size: 'modal-sm', title: `${a.status === 'expired' ? 'Reconnect' : 'Connect'} ${P.name}`, subtitle: 'Authorize RexEngine to publish on your behalf.',
    body: `
      <div class="flex items-center justify-center gap-4 py-3">
        <span class="rounded-[14px] shadow-lift">${LOGO(52)}</span>
        <span class="flex gap-1 text-muted">${ic('arrow-left-right', 'w-5 h-5')}</span>
        ${pIcon(pid, 'xl', 'shadow-lift')}
      </div>
      <div class="mt-3 rounded-[10px] bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-[12.5px] text-amber-800 flex items-start gap-2">${ic('flask-conical', 'w-4 h-4 mt-px flex-none')}<span><b class="font-semibold">Demo only.</b> No real ${P.name} login or OAuth flow will happen.</span></div>
      <div class="mt-5"><span class="label">RexEngine will be able to</span><ul class="space-y-2 text-[13px] text-slate-600">${a.perms.concat(['View basic profile information']).map(x => `<li class="flex items-center gap-2">${ic('check', 'w-4 h-4 text-emerald-600')}${x}</li>`).join('')}</ul></div>`,
    footer: `<button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-cn="next">Continue${ic('arrow-right')}</button>`,
  });
  const chooseStep = () => m.update({
    title: 'Choose an account', subtitle: `Select the ${P.name} account to connect.`,
    body: `<div class="space-y-2.5" role="radiogroup" aria-label="Accounts">${opts.map(([n, d], i) => `<div class="radio-card ${i === choice ? 'on' : ''}" role="radio" aria-checked="${i === choice}" tabindex="0" data-cn-pick="${i}">${avatar(i ? AV.sam : AV.alex, 36)}<div class="min-w-0 flex-1"><div class="text-[13.5px] font-medium text-ink">${esc(n)}</div><div class="text-[12px] text-sub">${esc(d)}</div></div><span class="radio-dot"></span></div>`).join('')}</div>`,
    footer: `<button class="btn btn-secondary" data-cn="back">${ic('arrow-left')}Back</button><button class="btn btn-primary" data-cn="confirm">${ic('plug')}Connect account</button>`,
  });
  m.el.addEventListener('click', async e => {
    const pick = e.target.closest('[data-cn-pick]');
    if (pick) { choice = +pick.dataset.cnPick; $$('[data-cn-pick]', m.el).forEach((r, i) => { r.classList.toggle('on', i === choice); r.setAttribute('aria-checked', i === choice); }); return; }
    const b = e.target.closest('[data-cn]'); if (!b) return;
    if (b.dataset.cn === 'next') chooseStep();
    if (b.dataset.cn === 'back') { m.close(); openConnect(pid); }
    if (b.dataset.cn === 'confirm') {
      m.closable = false;
      m.update({ body: `<div class="py-8 text-center"><span class="spinner !w-8 !h-8 !border-[3px] text-brand-600 mx-auto block"></span><div class="mt-4 font-semibold text-ink">Connecting ${P.name}…</div><div class="text-[13px] text-sub mt-1">Verifying permissions (simulated)</div></div>`, title: '' });
      await sleep(1300);
      Object.assign(a, { status: 'connected', account: opts[choice][0], display: opts[choice][1], followers: opts[choice][1].match(/[\d.,]+K?/)?.[0] || '—', lastSync: new Date() });
      m.closable = true;
      m.update({ title: '', body: `<div class="py-6 text-center"><div class="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 grid place-content-center mx-auto">${ic('circle-check', 'w-7 h-7')}</div><div class="mt-4 text-[16px] font-semibold text-ink">${P.name} connected</div><div class="text-[13.5px] text-sub mt-1">Publishing as <b class="font-medium text-ink">${esc(a.account)}</b></div><p class="hint mt-3">Demo connection — no real account was linked.</p></div>`, footer: `<button class="btn btn-primary w-full" data-close>Done</button>` });
      renderSidebar(); refresh();
      toast(`${P.name} connected`, `Publishing as ${a.account}.`, 'success');
    }
  });
  m.el.addEventListener('keydown', e => { const r = e.target.closest('[data-cn-pick]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); } });
}

/* ==========================================================================
   18. Settings
   ========================================================================== */
const SET_TABS = [['profile', 'Profile', 'user'], ['workspace', 'Workspace', 'building'], ['publishing', 'Publishing Preferences', 'send'], ['notifications', 'Notifications', 'bell'], ['accounts', 'Connected Accounts', 'share-2'], ['preferences', 'Account Preferences', 'sliders-horizontal']];
const fRow = (label, input, hint = '') => `<div class="grid xl:grid-cols-[200px_minmax(0,1fr)] gap-2.5 xl:gap-6 py-5 border-b border-line last:border-0"><div><div class="text-[13.5px] font-medium text-ink">${label}</div>${hint ? `<div class="text-[12.5px] text-sub mt-0.5">${hint}</div>` : ''}</div><div class="min-w-0 max-w-xl">${input}</div></div>`;
const toggleRow = (id, label, desc, on) => `<label class="flex items-start justify-between gap-4 py-3.5 cursor-pointer" for="${id}"><span><span class="block text-[13.5px] font-medium text-ink">${label}</span><span class="block text-[12.5px] text-sub mt-0.5">${desc}</span></span><span class="switch mt-0.5"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} data-setting><span></span></span></label>`;
const sel = (opts, v, attrs = '') => `<select class="select" data-setting ${attrs}>${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
function settingsSection(tab) {
  switch (tab) {
    case 'profile': return `
      ${fRow('Photo', `<div class="flex flex-wrap items-center gap-4">${avatar(AV.alex, 56)}<div class="flex gap-2"><button class="btn btn-secondary btn-sm" data-action="demo-toast" data-msg="Photo upload is available in the full product.">${ic('upload')}Change</button><button class="btn btn-ghost btn-sm">Remove</button></div></div>`, 'Shown on posts and approvals.')}
      ${fRow('Full name', `<div class="grid sm:grid-cols-2 gap-3"><input class="input" value="Alex" data-setting aria-label="First name"><input class="input" value="Morgan" data-setting aria-label="Last name"></div>`)}
      ${fRow('Email address', `<div class="input-icon">${ic('mail')}<input class="input" type="email" value="alex@morganco.realty" data-setting aria-label="Email"></div>`)}
      ${fRow('Title & license', `<div class="grid sm:grid-cols-2 gap-3"><input class="input" value="Real Estate Advisor" data-setting aria-label="Title"><input class="input" value="TX #0712384" data-setting aria-label="License number"></div>`, 'Used in post disclaimers.')}
      ${fRow('Bio', `<textarea class="textarea" rows="3" data-setting aria-label="Bio">Helping Austin families find homes they love for 12+ years. Specializing in Zilker, Travis Heights and Barton Hills.</textarea>`)}`;
    case 'workspace': return `
      ${fRow('Workspace name', `<input class="input" value="Morgan & Co. Realty" data-setting aria-label="Workspace name">`)}
      ${fRow('Brand voice', sel(['Luxury', 'Professional', 'Friendly', 'Investment-focused'], 'Luxury', 'aria-label="Default brand voice"'), 'Default tone for AI generation.')}
      ${fRow('Brand color', `<div class="flex items-center gap-2">${['#059669', '#0B1220', '#2563EB', '#B45309', '#7C3AED'].map((c, i) => `<button class="w-8 h-8 rounded-full ring-offset-2 ${i === 0 ? 'ring-2 ring-brand-500' : ''}" style="background:${c}" data-swatch aria-label="Brand color ${c}"></button>`).join('')}</div>`, 'Applied to AI creatives.')}
      ${fRow('Timezone', sel(['Central Time (CT)', 'Eastern Time (ET)', 'Mountain Time (MT)', 'Pacific Time (PT)'], 'Central Time (CT)', 'aria-label="Timezone"'))}
      ${fRow('Team', `<div class="flex items-center justify-between gap-3"><div class="flex av-stack">${[AV.alex, AV.jordan, AV.priya, AV.sam].map(s => avatar(s, 32)).join('')}</div><button class="btn btn-secondary btn-sm" data-action="demo-toast" data-msg="Invitations are disabled in the demo workspace.">${ic('user-plus')}Invite</button></div>`, '4 members')}`;
    case 'publishing': return `
      ${fRow('Approval workflow', `${toggleRow('s-req', 'Require approval before publishing', 'All AI-generated content must be approved by an admin.', true)}${toggleRow('s-auto', 'Auto-schedule approved posts', 'Approved posts are placed in the next suggested time slot.', false)}`)}
      ${fRow('Default posting times', `<div class="grid sm:grid-cols-2 gap-3">${P_ORDER.map(p => `<div class="flex items-center gap-2.5">${pIcon(p, 'sm')}<select class="select input-sm" data-setting aria-label="${PLATFORMS[p].name} default time">${['9:00 AM', '12:00 PM', '5:00 PM', '6:30 PM'].map((t, i) => `<option ${i === { instagram: 3, facebook: 1, linkedin: 0, x: 1, youtube: 2 }[p] ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`).join('')}</div>`)}
      ${fRow('Default hashtags', `<input class="input" value="#MorganCoRealty #AustinHomes" data-setting aria-label="Default hashtags">`, 'Appended to every post.')}
      ${fRow('Link in bio', `<div class="input-icon">${ic('link')}<input class="input" value="https://morganco.realty/listings" data-setting aria-label="Link in bio"></div>`)}
      ${fRow('Watermark', toggleRow('s-wm', 'Add logo watermark to images', 'Places your logo in the bottom-right corner.', true))}`;
    case 'notifications': return `
      <div class="overflow-x-auto"><table class="w-full min-w-[460px] text-[13.5px]"><thead><tr class="text-left text-[12px] text-sub"><th class="py-3 font-medium">Event</th><th class="py-3 font-medium text-center w-24">Email</th><th class="py-3 font-medium text-center w-24">In-app</th></tr></thead><tbody class="divide-y divide-line">
        ${[['Content ready for review', 'When AI finishes generating posts', 1, 1], ['Post published', 'When a scheduled post goes live', 0, 1], ['Publishing failed', 'When a post fails to publish', 1, 1], ['Account needs attention', 'Expired or revoked connections', 1, 1], ['Weekly performance summary', 'Every Monday at 8:00 AM', 1, 0]].map(([l, d, e, i], k) => `<tr><td class="py-3.5 pr-4"><div class="font-medium text-ink">${l}</div><div class="text-[12.5px] text-sub">${d}</div></td><td class="text-center"><span class="switch"><input type="checkbox" ${e ? 'checked' : ''} data-setting aria-label="${l} email"><span></span></span></td><td class="text-center"><span class="switch"><input type="checkbox" ${i ? 'checked' : ''} data-setting aria-label="${l} in-app"><span></span></span></td></tr>`).join('')}
      </tbody></table></div>`;
    case 'accounts': return `<div class="divide-y divide-line">${state.accounts.map(a => `<div class="flex items-center gap-3 py-3.5">${pIcon(a.id, 'md')}<div class="min-w-0 flex-1"><div class="text-[13.5px] font-medium text-ink">${PLATFORMS[a.id].name}</div><div class="text-[12.5px] text-sub truncate">${a.account || 'Not connected'}</div></div>${acctStatusBadge(a)}<button class="btn btn-secondary btn-sm" data-action="${a.status === 'connected' ? 'go' : 'connect'}" data-route="social" data-id="${a.id}">${a.status === 'connected' ? 'Manage' : a.status === 'expired' ? 'Reconnect' : 'Connect'}</button></div>`).join('')}</div>`;
    case 'preferences': return `
      ${fRow('Language', sel(['English (US)', 'English (UK)', 'Español'], 'English (US)', 'aria-label="Language"'))}
      ${fRow('Date format', sel(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], 'MM/DD/YYYY', 'aria-label="Date format"'))}
      ${fRow('Week starts on', sel(['Sunday', 'Monday'], 'Sunday', 'aria-label="Week starts on"'))}
      ${fRow('Appearance', `<div class="seg"><button class="on">${ic('sun')}Light</button><button disabled title="Coming soon">${ic('moon')}Dark</button><button disabled title="Coming soon">${ic('monitor')}System</button></div>`, 'Dark mode is coming soon.')}
      ${fRow('Danger zone', `<div class="rounded-[10px] border border-red-100 bg-red-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div class="text-[13.5px] font-medium text-red-800">Delete workspace</div><div class="text-[12.5px] text-red-700/80">Permanently remove all properties and content.</div></div><button class="btn btn-sm btn-danger" data-action="delete-workspace">${ic('trash-2')}Delete</button></div>`)}`;
  }
  return '';
}
function renderSettings() {
  const t = C.settingsTab; const meta = SET_TABS.find(x => x[0] === t);
  return `
    ${pageHeader({ title: 'Settings', subtitle: 'Manage your profile, workspace and publishing preferences.' })}
    <div class="grid lg:grid-cols-[232px_minmax(0,1fr)] gap-6 items-start">
      <nav class="set-nav flex lg:flex-col gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-[88px]" aria-label="Settings sections">
        ${SET_TABS.map(([k, l, i]) => `<a href="#/settings" class="${t === k ? 'on' : ''}" data-action="set-tab" data-v="${k}" ${t === k ? 'aria-current="page"' : ''}>${ic(i)}${l}</a>`).join('')}
      </nav>
      <section class="card" aria-labelledby="set-title">
        <div class="card-head !py-4"><div><h2 id="set-title" class="card-title">${meta[1]}</h2><p class="text-[12.5px] text-sub mt-0.5">${{ profile: 'Your personal information and agent details.', workspace: 'Brand settings shared by your whole team.', publishing: 'Control how content is approved and published.', notifications: 'Choose how you want to be notified.', accounts: 'Overview of your connected social channels.', preferences: 'Language, formats and appearance.' }[t]}</p></div><span id="dirty-chip"></span></div>
        <div class="px-5 sm:px-6 py-1">${settingsSection(t)}</div>
        ${t !== 'accounts' ? `<div class="px-5 sm:px-6 py-4 border-t border-line bg-[#FAFAFB] rounded-b-[12px] flex items-center justify-end gap-2.5"><button class="btn btn-ghost" data-action="set-cancel">Cancel</button><button class="btn btn-primary" data-action="set-save">${ic('check')}Save changes</button></div>` : ''}
      </section>
    </div>`;
}

/* ==========================================================================
   19. Router
   ========================================================================== */
const PAGES = { overview: renderOverview, properties: renderProperties, studio: renderStudio, calendar: renderCalendar, approvals: renderApprovals, media: renderMedia, social: renderSocial, settings: renderSettings };
const parseRoute = () => { const r = (location.hash || '').replace(/^#\/?/, '').split('?')[0]; return PAGES[r] ? r : 'overview'; };
function go(route) {
  closeDropdown(); closeDrawer(); closeAllModals();
  if (parseRoute() !== route) location.hash = '/' + route;
  else { state.route = route; render(); }
}
function render({ keep = false } = {}) {
  const view = $('#view');
  const scrollY = window.scrollY;
  view.innerHTML = keep ? PAGES[state.route]() : `<div class="page-enter">${PAGES[state.route]()}</div>`;
  renderSidebar();
  const crumb = $('#crumb'); if (crumb) crumb.textContent = ROUTE_TITLES[state.route];
  document.title = `${ROUTE_TITLES[state.route]} · RexEngine`;
  icons();
  if (!keep) countUp(view);
  if (keep) window.scrollTo(0, scrollY); else window.scrollTo(0, 0);
  if (!keep && state.route === 'studio' && S.pendingGenerate) { S.pendingGenerate = false; setTimeout(studioGenerate, 450); }
}
const refresh = () => render({ keep: true });

/* ==========================================================================
   20. Actions (event delegation)
   ========================================================================== */
const A = {
  go: el => { if (el.dataset.tab) C.settingsTab = el.dataset.tab; go(el.dataset.route); },
  'open-drawer': () => openDrawer(),
  'close-drawer': () => closeDrawer(),
  'toggle-rail': () => toggleRail(),
  'user-menu': el => openDropdown(el, userMenuHTML(), { align: el.closest('#sidebar') ? (window.innerWidth >= 1024 ? 'side' : 'left') : 'right', width: 248 }),
  'help-menu': el => openDropdown(el, helpMenuHTML(), { align: el.closest('#sidebar') && window.innerWidth >= 1024 ? 'side' : 'left', width: 230 }),
  'notif-menu': el => openDropdown(el, notifMenuHTML(), { width: 360, focus: false }),
  'notif-read-all': () => { state.notifications.forEach(n => { n.unread = false; }); renderTopbar(); toast('All caught up', 'Notifications marked as read.', 'success'); },
  'notif-open': el => { const n = state.notifications.find(x => x.id === el.dataset.id); if (!n) return; n.unread = false; renderTopbar(); go(n.route); },
  'mobile-search': () => openMobileSearch(),
  shortcuts: () => openShortcuts(),
  tour: () => openTour(),
  upgrade: () => toast('You’re on the Pro plan', 'Plan upgrades are available in the full product.', 'info'),
  'sign-out': () => { closeDropdown(); closeAllModals(); location.href = 'landing.html'; },
  'demo-toast': el => toast('Demo action', el.dataset.msg || 'Available in the full product.', 'info'),
  'hide-banner': () => { state.bannerHidden = true; store.set('bannerHidden', true); refresh(); },

  /* Dashboard */
  'feat-platform': el => { state.ui.featuredPlatform = el.dataset.p; const box = $('#feat-preview'); if (box) { box.innerHTML = featuredPreviewHTML(getProp('p1')); icons(); } },

  /* Properties */
  'add-property': () => openImport(),
  'manual-property': () => openPropertyForm(),
  'view-property': el => openPropertyModal(el.dataset.id),
  'edit-property': el => openPropertyForm(getProp(el.dataset.id)),
  'prop-menu': el => openDropdown(el, propMenuHTML(el.dataset.id), { width: 220 }),
  'prop-view': el => { state.ui.propView = el.dataset.v; store.set('propView', el.dataset.v); refresh(); },
  'clear-prop-filters': () => { Object.assign(state.ui, { propQ: '', propStatus: 'all', propType: 'all' }); refresh(); },
  'delete-property': el => {
    const p = getProp(el.dataset.id); if (!p) return;
    const n = count(c => c.propertyId === p.id);
    confirmDialog({
      title: `Delete ${esc(p.address)}?`, danger: true, confirm: 'Delete property',
      message: `This removes the listing${n ? ` and its ${n} content item${n > 1 ? 's' : ''}` : ''} from RexEngine. This can’t be undone.`,
      onConfirm: () => {
        state.properties = state.properties.filter(x => x.id !== p.id);
        state.content = state.content.filter(c => c.propertyId !== p.id);
        state.media = state.media.filter(a => a.propertyId !== p.id);
        if (S.propertyId === p.id) { S.propertyId = state.properties[0]?.id; S.drafts = {}; S.images = [0]; }
        closeAllModals(); renderSidebar();
        if (p.id === 'p1' && state.route === 'overview') go('properties'); else refresh();
        toast('Property deleted', `${p.address} was removed.`, 'success');
      },
    });
  },
  'media-for': el => { const p = getProp(el.dataset.id); C.mediaQ = p ? p.address : ''; C.mediaCat = 'all'; go('media'); },

  /* Studio */
  'studio-open': el => openStudio(el.dataset.prop, { platform: el.dataset.platform }),
  'studio-platform': el => {
    S.platform = el.dataset.p; S.format = S.drafts[S.platform]?.format || PLATFORMS[S.platform].formats[0];
    if (S.format !== 'carousel' && S.images.length > 1) S.images = [S.images[0]];
    S.carouselIdx = 0; S.expanded = false; rStudioLeft(); rStudioEditor(); rStudioPreview();
  },
  'studio-format': el => {
    const f = el.dataset.f; if (!PLATFORMS[S.platform].formats.includes(f)) return;
    S.format = f; if (S.drafts[S.platform]) S.drafts[S.platform].format = f;
    if (f !== 'carousel' && S.images.length > 1) S.images = [S.images[0]];
    if (f === 'carousel' && S.images.length < 2) { const n = studioProp().photos.length; S.images = [S.images[0], (S.images[0] + 1) % n, (S.images[0] + 2) % n].filter((v, i, a) => a.indexOf(v) === i); }
    S.carouselIdx = 0; rStudioLeft(); rStudioEditor(); rStudioPreview();
  },
  'studio-img': el => {
    const i = +el.dataset.i;
    if (S.format === 'carousel') {
      const at2 = S.images.indexOf(i);
      if (at2 > -1) { if (S.images.length > 1) S.images.splice(at2, 1); else return toast('Keep at least one image', '', 'info'); }
      else if (S.images.length < 10) S.images.push(i);
      S.carouselIdx = Math.min(S.carouselIdx, S.images.length - 1);
    } else S.images = [i];
    rStudioLeft(); rStudioPreview();
  },
  'studio-tone': el => { S.tone = el.dataset.v; rStudioEditor(); },
  'studio-generate': () => studioGenerate(),
  'studio-tool': el => studioTool(el.dataset.k),
  'studio-save': () => { const it = studioCommit('draft'); if (it) { rStudioEditor(); renderSidebar(); toast('Draft saved', `${PLATFORMS[it.platform].name} draft for ${getProp(it.propertyId).address}.`, 'success'); } },
  'studio-approve': () => { const it = studioCommit('approved'); if (it) { rStudioEditor(); renderSidebar(); toast('Content approved', `Ready to schedule · planned for ${relDay(it.date)} at ${fmtTime(it.date)}.`, 'success', { label: 'Schedule', fn: () => A['studio-schedule']() }); } },
  'studio-schedule': () => {
    const d = draft();
    if (!d || !d.caption.trim()) { toast('Nothing to schedule yet', 'Generate with AI or write a caption first.', 'info'); return; }
    const acct = getAcct(S.platform);
    const extras = P_ORDER.filter(x => x !== S.platform && S.drafts[x]?.caption && S.drafts[x].status !== 'scheduled');
    openScheduleModal({
      title: 'Schedule post', subtitle: `${PLATFORMS[S.platform].name} ${FORMATS[S.format].label} · ${studioProp().address}`,
      date: d.itemId ? getItem(d.itemId)?.date : null, platform: S.platform, extraPlatforms: extras,
      onConfirm: (when, more) => {
        const it = commitDraft(S.platform, 'scheduled', when);
        more.forEach(x => commitDraft(x, 'scheduled', suggestedSlot(x)));
        rStudioEditor(); renderSidebar();
        const total = 1 + more.length;
        toast(total > 1 ? `${total} posts scheduled` : 'Post scheduled', `${PLATFORMS[it.platform].name} · ${fmtLong(when)} at ${fmtTime(when)}${total > 1 ? ` + ${more.length} more` : ''}`, 'success', { label: 'View', fn: () => { C.calCursor = new Date(when); C.calSelected = new Date(when); C.calView = 'month'; go('calendar'); } });
        if (acct.status !== 'connected') setTimeout(() => toast(`${PLATFORMS[S.platform].name} isn’t connected`, 'Connect the account before the publish time.', 'warn', { label: 'Connect', fn: () => openConnect(acct.id) }), 600);
      },
    });
  },
  'pv-more': () => { S.expanded = true; livePreview(); },
  'pv-slide': el => { S.carouselIdx = (S.carouselIdx + Number(el.dataset.d) + S.images.length) % S.images.length; livePreview(); },

  /* Content items */
  'item-menu': el => openDropdown(el, itemMenuHTML(el.dataset.id), { width: 200 }),
  'preview-item': el => openPreviewModal(el.dataset.id),
  'edit-item': el => openStudio(null, { itemId: el.dataset.id }),
  'approve-item': el => approveItem(el.dataset.id),
  'reject-item': el => rejectItem(el.dataset.id),
  'reschedule-item': el => rescheduleItem(el.dataset.id),
  'delete-item': el => deleteItem(el.dataset.id),
  'set-status': el => setStatus(el.dataset.id, el.dataset.s, el.dataset.s === 'review' ? { note: '' } : {}),
  'approve-all': () => approveAll(),
  'ap-tab': el => { C.apTab = el.dataset.v; refresh(); },

  /* Calendar */
  event: el => openEventModal(el.dataset.id),
  'cal-prev': () => { calShift(-1); refresh(); },
  'cal-next': () => { calShift(1); refresh(); },
  'cal-today': () => { C.calCursor = new Date(TODAY); C.calSelected = new Date(TODAY); refresh(); },
  'cal-view': el => { C.calView = el.dataset.v; if (C.calView === 'day') C.calCursor = new Date(C.calSelected); refresh(); },
  'cal-select': el => { const [y, m, d] = el.dataset.d.split('-').map(Number); C.calSelected = new Date(y, m - 1, d); if (C.calSelected.getMonth() !== C.calCursor.getMonth()) C.calCursor = new Date(C.calSelected); refresh(); },
  'cal-open-day': el => { const [y, m, d] = el.dataset.d.split('-').map(Number); const dt = new Date(y, m - 1, d); C.calSelected = dt; C.calCursor = new Date(dt); if (window.innerWidth < 768 && C.calView === 'month') { refresh(); return; } C.calView = 'day'; refresh(); },

  /* Media */
  'media-cat': el => { C.mediaCat = el.dataset.v; refresh(); },
  'media-view': el => { C.mediaView = el.dataset.v; refresh(); },
  'media-open': el => openAssetModal(el.dataset.id),
  'media-toggle': (el, e) => { e.stopPropagation(); const id = el.dataset.id; if (el.checked) C.mediaSel.add(id); else C.mediaSel.delete(id); rMedia(); },
  'media-select-all': () => { const list = filteredMedia(); const all = list.every(a => C.mediaSel.has(a.id)); list.forEach(a => all ? C.mediaSel.delete(a.id) : C.mediaSel.add(a.id)); rMedia(); },
  'media-clear': () => { C.mediaSel.clear(); rMedia(); },
  'media-delete': () => deleteAssets([...C.mediaSel]),
  'media-use': () => useAssetsInStudio([...C.mediaSel]),
  'media-reset': () => { C.mediaQ = ''; C.mediaCat = 'all'; refresh(); },

  /* Social */
  connect: el => openConnect(el.dataset.id),
  'acct-menu': el => openDropdown(el, `${ddItem('refresh-cw', 'Sync now', 'sync-one', `data-id="${el.dataset.id}"`)}${ddItem('external-link', 'Open profile', 'demo-toast', 'data-msg="Opens the profile on the platform in the full product."')}<div class="dd-sep"></div>${ddItem('unplug', 'Disconnect', 'disconnect', `data-id="${el.dataset.id}"`, true)}`, { width: 200 }),
  'sync-one': async el => { const a = getAcct(el.dataset.id); setLoading(el.tagName === 'BUTTON' && !el.classList.contains('dd-item') ? el : null, true, 'Syncing…'); await sleep(900); a.lastSync = new Date(); refresh(); toast(`${PLATFORMS[a.id].name} synced`, 'Profile and permissions are up to date.', 'success'); },
  'sync-all': async el => { setLoading(el, true, 'Syncing…'); await sleep(1100); state.accounts.forEach(a => { if (a.status === 'connected') a.lastSync = new Date(); }); refresh(); toast('All accounts synced', `${state.accounts.filter(a => a.status === 'connected').length} connected channels refreshed.`, 'success'); },
  disconnect: el => {
    const a = getAcct(el.dataset.id);
    confirmDialog({ title: `Disconnect ${PLATFORMS[a.id].name}?`, danger: true, icon: 'unplug', confirm: 'Disconnect', message: `Scheduled posts for ${esc(a.account)} won’t publish until you reconnect.`, onConfirm: () => { Object.assign(a, { status: 'disconnected', account: null, followers: null, lastSync: null }); renderSidebar(); refresh(); toast(`${PLATFORMS[a.id].name} disconnected`, '', 'info'); } });
  },

  /* Settings */
  'set-tab': (el, e) => { e.preventDefault(); C.settingsTab = el.dataset.v; C.settingsDirty = false; refresh(); },
  'set-save': async el => { setLoading(el, true, 'Saving…'); await sleep(700); setLoading(el, false); C.settingsDirty = false; const d = $('#dirty-chip'); if (d) d.innerHTML = ''; toast('Settings saved', 'Your changes have been applied.', 'success'); },
  'set-cancel': () => { C.settingsDirty = false; refresh(); toast('Changes discarded', '', 'info'); },
  'delete-workspace': () => confirmDialog({ title: 'Delete workspace?', danger: true, confirm: 'I understand', message: 'This is a demo workspace, so nothing will actually be deleted.', onConfirm: () => toast('Nothing was deleted', 'Workspace deletion is disabled in the demo.', 'info') }),
};
function closeAllModals() { [...modalStack].forEach(m => m.close()); }

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const inDD = dd && dd.el.contains(el);
  const fn = A[el.dataset.action];
  if (!fn) return;
  if (el.tagName === 'A' || el.dataset.action === 'set-tab') e.preventDefault();
  if (inDD) closeDropdown();
  fn(el, e);
});
/* Sidebar links close mobile drawer */
document.addEventListener('click', e => { if (e.target.closest('#sidebar a.nav-item')) closeDrawer(); });

/* Inputs & selects */
let inputTimer = null;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.field) return onStudioField(t);
  if (t.dataset.input) {
    state.ui[t.dataset.input] = t.value;
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => {
      if (t.dataset.input === 'propQ') { const r = $('#prop-results'); if (r) { r.innerHTML = propertyResults(); icons(); } }
      if (t.dataset.input === 'mediaQ') rMedia();
    }, 120);
  }
  if (t.id === 'global-search') openSearch(t);
  if (t.hasAttribute('data-setting') && !C.settingsDirty) { C.settingsDirty = true; const d = $('#dirty-chip'); if (d) d.innerHTML = '<span class="badge b-amber"><span class="dot"></span>Unsaved changes</span>'; }
});
document.addEventListener('change', e => {
  const t = e.target; const k = t.dataset.change;
  if (t.hasAttribute('data-setting') && !C.settingsDirty) { C.settingsDirty = true; const d = $('#dirty-chip'); if (d) d.innerHTML = '<span class="badge b-amber"><span class="dot"></span>Unsaved changes</span>'; }
  if (t.matches('[data-upload]')) { uploadMedia(t.files); t.value = ''; return; }
  if (!k) return;
  if (['propStatus', 'propType', 'propSort'].includes(k)) { state.ui[k] = t.value; const r = $('#prop-results'); if (r) { r.innerHTML = propertyResults(); icons(); } }
  if (k === 'studioProp') {
    const hadDrafts = Object.keys(S.drafts).length;
    S.propertyId = t.value; S.drafts = {}; S.images = S.format === 'carousel' ? [0, 1, 2] : [0]; S.v = 0; S.carouselIdx = 0;
    rStudioLeft(); rStudioEditor(); rStudioPreview();
    toast(`Switched to ${getProp(t.value).address}`, hadDrafts ? 'Unsaved drafts for the previous property were cleared.' : 'Generate fresh content for this listing.', 'info');
  }
  if (k === 'studioAudience') S.audience = t.value;
  if (k === 'studioGoal') { S.goal = t.value; livePreview(); }
  if (k === 'calPlatform') { C.calPlatform = t.value; refresh(); }
  if (k === 'calDate' && t.value) { const [y, m, d] = t.value.split('-').map(Number); C.calSelected = new Date(y, m - 1, d); C.calCursor = new Date(y, m - 1, d); refresh(); }
  if (k === 'apPlatform') { C.apPlatform = t.value; const l = $('#ap-list'); if (l) { l.innerHTML = apListHTML(); icons(); } }
});
document.addEventListener('focusin', e => { if (e.target.id === 'global-search') openSearch(e.target); });

/* Brand color swatches (settings) */
document.addEventListener('click', e => {
  const sw = e.target.closest('[data-swatch]'); if (!sw) return;
  $$('[data-swatch]').forEach(b => b.classList.toggle('ring-2', b === sw));
  $$('[data-swatch]').forEach(b => b.classList.toggle('ring-brand-500', b === sw));
  if (!C.settingsDirty) { C.settingsDirty = true; const d = $('#dirty-chip'); if (d) d.innerHTML = '<span class="badge b-amber"><span class="dot"></span>Unsaved changes</span>'; }
});

/* Outside click closes dropdown */
document.addEventListener('mousedown', e => { if (dd && !dd.el.contains(e.target) && !dd.anchor.contains(e.target)) closeDropdown(); });
window.addEventListener('resize', () => { closeDropdown(); if (window.innerWidth >= 1024) closeDrawer(); });
window.addEventListener('scroll', e => { if (dd && !(e.target instanceof Node && dd.el.contains(e.target)) && dd.anchor.id !== 'global-search') closeDropdown(); }, true);

/* Keyboard */
let gPending = false, gTimer = null;
document.addEventListener('keydown', e => {
  const t = e.target instanceof Element ? e.target : document.body;
  const typing = t.matches('input, textarea, select, [contenteditable]');
  if (e.key === 'Escape') {
    if (dd) { const a = dd.anchor; closeDropdown(); a.focus && a.focus(); e.preventDefault(); return; }
    const m = topModal(); if (m && m.closable) { m.close(); return; }
    if ($('#sidebar').classList.contains('open')) { closeDrawer(); return; }
    if (t.id === 'global-search') t.blur();
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const s = $('#global-search'); if (s && window.innerWidth >= 1024 && !document.documentElement.classList.contains('rail')) s.focus(); else openMobileSearch(); return; }
  if (!typing && e.key === '/' && !modalStack.length) { e.preventDefault(); const s = $('#global-search'); if (s && window.innerWidth >= 1024 && !document.documentElement.classList.contains('rail')) s.focus(); else openMobileSearch(); return; }
  if (t.id === 'global-search' && e.key === 'Enter') { const first = dd && dd.el.querySelector('[data-action]'); if (first) { first.click(); t.blur(); } return; }
  if (t.id === 'global-search' && e.key === 'ArrowDown' && dd) { e.preventDefault(); const f = dd.el.querySelector('.dd-item'); f && f.focus(); return; }
  if (dd && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && dd.el.contains(t)) {
    e.preventDefault(); const items = $$('.dd-item', dd.el); const i = items.indexOf(t);
    const n = items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]; n && n.focus(); return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && t.matches('[role="button"][data-action], tr[data-action]') && !typing) { e.preventDefault(); t.click(); return; }
  /* Focus trap inside modals */
  if (e.key === 'Tab' && modalStack.length) {
    const m = topModal(); const f = $$('button:not([disabled]), [href], input:not([disabled]):not(.sr-only), select, textarea, [tabindex]:not([tabindex="-1"])', m.el).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!m.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    return;
  }
  /* "G then X" navigation */
  if (!typing && !modalStack.length && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const key = e.key.toLowerCase();
    if (gPending) {
      const map = { o: 'overview', p: 'properties', s: 'studio', c: 'calendar', a: 'approvals', m: 'media', x: 'social' };
      gPending = false; clearTimeout(gTimer);
      if (map[key]) { e.preventDefault(); go(map[key]); }
      return;
    }
    if (key === 'g') { gPending = true; gTimer = setTimeout(() => { gPending = false; }, 900); }
  }
});

/* Global image fallback */
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && !t.dataset.fb) { t.dataset.fb = '1'; t.src = FALLBACK_IMG; }
}, true);

/* ==========================================================================
   21. Boot
   ========================================================================== */
function boot() {
  initData();
  state.route = parseRoute();
  renderTopbar();
  render();
  window.addEventListener('hashchange', () => { state.route = parseRoute(); closeAllModals(); render(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
