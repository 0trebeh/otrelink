// ─────────────────────────────────────────────────────────────
//  PAGE TEMPLATES
//  Ready-made pages to start from (dashboard → Templates, and “New page”).
//  Each template = a theme (+ design tweaks), a profile, social icons and blocks.
//  buildTemplatePage(id) returns { profile, socials, blocks, design, settings }.
//  Add one: append an entry; blocks are [type, data, children?] (see blocks/).
// ─────────────────────────────────────────────────────────────
import { newBlock, applyTheme, sanitizePage } from './page.js';
import { defaultDesign, resolveDesign } from './design.js';
import { uid } from './util/html.js';

const ex = 'https://example.com';
// A date some days from today ("YYYY-MM-DD"), so countdowns and events stay in the future.
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const weekdays = (from, to, days = ['mon', 'tue', 'wed', 'thu', 'fri']) => days.map((day, i) => ({ id: `h${i}`, day, from, to }));
const item = (o) => ({ id: uid('i'), ...o });

export const TEMPLATE_CATEGORIES = ['Personal', 'Creators', 'Business', 'Food', 'Services', 'Events'];

export const TEMPLATES = [
  {
    id: 'minimal', name: 'Minimal', category: 'Personal', description: 'Clean and simple: your links, nothing else.',
    theme: 'air',
    profile: { title: 'Alex Rivera', bio: 'Designer · Coffee lover · Based in Madrid' },
    socials: [['instagram', 'https://instagram.com/'], ['linkedin', 'https://linkedin.com/in/'], ['email', 'hello@example.com']],
    blocks: [
      ['link', { title: 'My portfolio', url: ex }],
      ['link', { title: 'Latest article', subtitle: 'How I plan my week', url: ex }],
      ['link', { title: 'Book a coffee chat', url: ex }],
    ],
  },
  {
    id: 'creator', name: 'Content creator', category: 'Creators', description: 'Latest video, collabs and every social in one place.',
    theme: 'sunset',
    profile: { title: 'Mia Creates', bio: 'Lifestyle & travel videos every Sunday 🎬', verified: true },
    socials: [['youtube', 'https://youtube.com/'], ['tiktok', 'https://tiktok.com/'], ['instagram', 'https://instagram.com/'], ['patreon', 'https://patreon.com/']],
    blocks: [
      ['video', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Newest video' }],
      ['link', { title: 'Join my community', subtitle: 'Exclusive posts and behind the scenes', url: ex, layout: 'featured' }],
      ['header', { text: 'Collabs' }],
      ['link', { title: 'Brand partnerships', url: ex }],
      ['copy', { title: 'Discount code', text: 'MIA15', subtitle: '15% off my favourite gear' }],
    ],
  },
  {
    id: 'musician', name: 'Musician', category: 'Creators', description: 'New release, tour dates and streaming links.',
    theme: 'aurora',
    profile: { title: 'The Night Owls', bio: 'Indie band from Austin. New album out now 🌙' },
    socials: [['spotify', 'https://open.spotify.com/'], ['applemusic', 'https://music.apple.com/'], ['youtube', 'https://youtube.com/'], ['instagram', 'https://instagram.com/']],
    blocks: [
      ['music', { url: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy' }],
      ['events', { title: 'Tour dates', layout: 'banners', dateFormat: 'medium', events: [
        item({ title: 'Austin — The Parish', subtitle: 'Album release show', date: inDays(12), from: '20:00', to: '23:00', location: 'Austin, TX', url: ex, buttonLabel: 'Tickets' }),
        item({ title: 'Dallas — Trees', date: inDays(19), from: '21:00', to: '23:30', location: 'Dallas, TX', url: ex, buttonLabel: 'Tickets' }),
        item({ title: 'Houston — White Oak', date: inDays(26), from: '20:00', to: '23:00', location: 'Houston, TX', url: ex, buttonLabel: 'Tickets' }),
      ] }],
      ['link', { title: 'Merch store', url: ex }],
    ],
  },
  {
    id: 'photographer', name: 'Photographer', category: 'Creators', description: 'Portfolio gallery, packages and bookings.',
    theme: 'noir',
    profile: { title: 'Lena Brooks Photo', bio: 'Weddings · Portraits · Editorial' },
    socials: [['instagram', 'https://instagram.com/'], ['behance', 'https://behance.net/'], ['pinterest', 'https://pinterest.com/']],
    blocks: [
      ['banner', { eyebrow: 'Now booking', title: '2026 weddings', text: 'A few dates left this season.', bgColor: '#111111', gradient: true, bgColor2: '#3a3a3a', textColor: '#ffffff', url: ex, buttonLabel: 'Check availability' }],
      ['booking', { buttonLabel: 'Book a session', services: [
        item({ name: 'Portrait session', description: '1 hour, 20 edited photos', duration: '60', price: '$150' }),
        item({ name: 'Engagement shoot', description: '2 hours, 40 edited photos', duration: '120', price: '$300' }),
      ], hours: weekdays('10:00', '18:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['link', { title: 'Full portfolio', url: ex }],
      ['reviews', { title: 'What clients say' }],
    ],
  },
  {
    id: 'restaurant', name: 'Restaurant & café', category: 'Food', description: 'Menu, open hours, map and reviews.',
    theme: 'paper',
    design: { titleFont: 'playfair' },
    profile: { title: 'Casa Olivo', bio: 'Mediterranean kitchen · Since 2012' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['phone', '+15551234567']],
    blocks: [
      ['status', { hours: weekdays('12:00', '23:00', ['tue', 'wed', 'thu', 'fri', 'sat', 'sun']) }],
      ['catalog', { display: 'always', title: 'Menu', layout: 'list', products: [
        item({ name: 'Burrata & tomatoes', category: 'Starters', description: 'Heirloom tomatoes, basil oil', price: 12, tags: ['vegetarian'] }),
        item({ name: 'Grilled octopus', category: 'Starters', description: 'Potato, paprika, olive oil', price: 16, tags: ['popular'] }),
        item({ name: 'Seafood paella', category: 'Mains', description: 'For two people', price: 38 }),
        item({ name: 'Lamb tagine', category: 'Mains', description: 'Apricots, almonds, couscous', price: 24, tags: ['spicy'] }),
        item({ name: 'Basque cheesecake', category: 'Desserts', price: 8 }),
      ] }],
      ['link', { title: 'Book a table', url: ex, icon: 'calendar' }],
      ['map', { address: 'Gran Vía 1, Madrid', title: 'Find us' }],
      ['reviews', { title: 'Reviews' }],
    ],
  },
  {
    id: 'foodtruck', name: 'Food truck', category: 'Food', description: 'Where you are today, weekly route, pickup orders and a loyalty card.',
    theme: 'punk',
    profile: { title: 'Burger Bus', bio: 'Smash burgers on wheels 🍔 Order ahead, skip the line!' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['status', { source: 'route' }],
      ['location', {}],
      ['catalog', { display: 'always', title: 'Menu', ordering: 'pickup', products: [
        item({ name: 'Classic smash', category: 'Burgers', description: 'Double patty, cheddar, pickles', price: 9, tags: ['popular'], extras: 'Bacon = 2\nExtra cheese = 1\nNo onion' }),
        item({ name: 'Spicy chicken', category: 'Burgers', price: 10, tags: ['spicy'], extras: 'Jalapeños = 0.5' }),
        item({ name: 'Veggie burger', category: 'Burgers', price: 9, tags: ['vegetarian'] }),
        item({ name: 'Fries', category: 'Sides', price: 4 }),
        item({ name: 'Lemonade', category: 'Drinks', price: 3 }),
      ] }],
      ['route', { stops: [
        item({ day: 'mon', place: 'Downtown square', from: '11:00', to: '15:00' }),
        item({ day: 'wed', place: 'University campus', from: '12:00', to: '16:00' }),
        item({ day: 'fri', place: 'Night market', from: '18:00', to: '23:00' }),
        item({ day: 'sat', place: 'Beach parking', from: '12:00', to: '20:00' }),
      ] }],
      ['loyalty', { reward: 'A free burger', stamps: 8, icon: '🍔' }],
    ],
  },
  {
    id: 'bakery', name: 'Bakery & desserts', category: 'Food', description: 'Sweet catalog with WhatsApp orders and FAQs.',
    theme: 'bloom',
    design: { titleFont: 'pacifico' },
    profile: { title: 'Sugar & Flour', bio: 'Custom cakes and fresh pastries 🧁 Orders 48h ahead' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['facebook', 'https://facebook.com/']],
    blocks: [
      ['catalog', { display: 'always', layout: 'grid', whatsapp: '+15551234567', products: [
        item({ name: 'Chocolate cake', description: '8 slices', price: 35, badge: 'Best seller' }),
        item({ name: 'Croissant box', description: '6 butter croissants', price: 14 }),
        item({ name: 'Macarons', description: 'Box of 12', price: 18, discount: 10 }),
        item({ name: 'Custom cake', description: 'Tell us your idea', price: 0 }),
      ] }],
      ['faq', { title: 'Good to know', items: [
        item({ question: 'Do you deliver?', answer: 'Yes, within the city for $5.' }),
        item({ question: 'How early should I order?', answer: 'At least 48 hours before, one week for custom cakes.' }),
      ] }],
    ],
  },
  {
    id: 'store', name: 'Online store', category: 'Business', description: 'Products, a promo banner and shipping FAQs.',
    theme: 'blocks',
    profile: { title: 'Nord Goods', bio: 'Minimal home objects, made to last.' },
    socials: [['instagram', 'https://instagram.com/'], ['pinterest', 'https://pinterest.com/'], ['etsy', 'https://etsy.com/']],
    blocks: [
      ['banner', { eyebrow: 'This week', title: '20% off ceramics', text: 'Use the code at checkout.', bgColor: '#1d4ed8', gradient: true, bgColor2: '#7c3aed', textColor: '#ffffff', url: ex, buttonLabel: 'Shop now' }],
      ['catalog', { display: 'always', title: 'New in', products: [
        item({ name: 'Ceramic mug', price: 18, discount: 20, stock: '12', badge: 'New', url: ex }),
        item({ name: 'Linen tote', price: 32, url: ex }),
        item({ name: 'Candle set', price: 26, stock: '3', url: ex }),
        item({ name: 'Oak tray', price: 45, stock: '0', url: ex }),
      ] }],
      ['copy', { title: 'Promo code', text: 'NORD20' }],
      ['faq', { title: 'Shipping & returns', items: [
        item({ question: 'How long is shipping?', answer: '2–4 business days.' }),
        item({ question: 'Can I return an item?', answer: 'Yes, within 30 days.' }),
      ] }],
    ],
  },
  {
    id: 'coach', name: 'Coach & consultant', category: 'Services', description: 'Booking with services, testimonials and FAQs.',
    theme: 'mineral',
    profile: { title: 'Dr. Sam Patel', bio: 'Career coach · Helping you land the job you want' },
    socials: [['linkedin', 'https://linkedin.com/in/'], ['youtube', 'https://youtube.com/'], ['email', 'sam@example.com']],
    blocks: [
      ['booking', { buttonLabel: 'Book a session', description: 'Online via Google Meet', services: [
        item({ name: 'Free intro call', duration: '20', price: 'Free' }),
        item({ name: 'Coaching session', duration: '60', price: '$90' }),
        item({ name: 'CV review', duration: '45', price: '$60' }),
      ], hours: weekdays('09:00', '17:00') }],
      ['reviews', { title: 'Client stories' }],
      ['faq', { title: 'FAQ', items: [
        item({ question: 'How does it work?', answer: 'We meet online, set goals and follow up every two weeks.' }),
        item({ question: 'Can I cancel?', answer: 'Yes, up to 24 hours before.' }),
      ] }],
      ['link', { title: 'Free career guide (PDF)', url: ex, icon: 'download' }],
    ],
  },
  {
    id: 'developer', name: 'Developer', category: 'Personal', description: 'Projects, a code snippet and how to hire you.',
    theme: 'neon',
    profile: { title: 'dev.jordan', bio: 'Full-stack developer · Open source · Coffee-driven' },
    socials: [['github', 'https://github.com/'], ['linkedin', 'https://linkedin.com/in/'], ['x', 'https://x.com/']],
    blocks: [
      ['code', { filename: 'hello.js', code: "const me = {\n  stack: ['React', 'Node', 'Postgres'],\n  available: true,\n};\n\nconsole.log(`Let's build something!`);", theme: 'night-owl' }],
      ['header', { text: 'Projects' }],
      ['link', { title: 'Otrelink', subtitle: 'Open-source link pages', url: ex }],
      ['link', { title: 'TinyURL clone', subtitle: 'Short links with analytics', url: ex }],
      ['contact', { email: 'jordan@example.com', emailLabel: 'Hire me' }],
    ],
  },
  {
    id: 'realestate', name: 'Real estate agent', category: 'Business', description: 'Featured listing, contact card and office map.',
    theme: 'lake',
    profile: { title: 'Grace Kim · Realtor', bio: 'Helping families find home in San Diego 🏡' },
    socials: [['instagram', 'https://instagram.com/'], ['facebook', 'https://facebook.com/'], ['phone', '+15551234567']],
    blocks: [
      ['banner', { eyebrow: 'Featured listing', title: '3-bed house in La Jolla', text: '$1,250,000 · Ocean view · Open house Sunday', bgColor: '#0f766e', gradient: true, bgColor2: '#0e7490', textColor: '#ffffff', url: ex, buttonLabel: 'See photos' }],
      ['link', { title: 'All my listings', url: ex }],
      ['link', { title: 'What is my home worth?', url: ex }],
      ['vcard', { name: 'Grace Kim', role: 'Realtor', org: 'Sunrise Realty', phone: '+15551234567', email: 'grace@example.com' }],
      ['map', { address: 'La Jolla, San Diego, CA', title: 'Office' }],
    ],
  },
  {
    id: 'fitness', name: 'Fitness trainer', category: 'Services', description: 'Classes calendar, booking and a challenge countdown.',
    theme: 'dark',
    design: { titleFont: 'unbounded' },
    profile: { title: 'FitWithLuis', bio: 'Personal trainer · HIIT · Strength 💪' },
    socials: [['instagram', 'https://instagram.com/'], ['youtube', 'https://youtube.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['countdown', { title: '30-day challenge starts in', date: `${inDays(9)}T07:00:00.000Z` }],
      ['booking', { buttonLabel: 'Book a training', services: [
        item({ name: 'Personal training', duration: '60', price: '$40' }),
        item({ name: 'Online plan call', duration: '30', price: '$25' }),
      ], hours: weekdays('06:00', '20:00', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['events', { title: 'Group classes', layout: 'carousel', events: [
        item({ title: 'HIIT in the park', date: inDays(2), from: '07:00', to: '08:00', location: 'Central Park' }),
        item({ title: 'Strength basics', date: inDays(4), from: '18:00', to: '19:00', location: 'Iron Gym' }),
        item({ title: 'Sunday mobility', date: inDays(6), from: '09:00', to: '10:00', location: 'Online' }),
      ] }],
    ],
  },
  {
    id: 'salon', name: 'Beauty salon & barber', category: 'Services', description: 'Services with booking, gallery and location.',
    theme: 'bloom',
    profile: { title: 'Velvet Studio', bio: 'Hair · Nails · Brows ✨ Walk-ins welcome' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['booking', { buttonLabel: 'Book an appointment', services: [
        item({ name: 'Haircut', duration: '45', price: '$35' }),
        item({ name: 'Color', duration: '120', price: '$90' }),
        item({ name: 'Manicure', duration: '45', price: '$25' }),
        item({ name: 'Brow lamination', duration: '60', price: '$45' }),
      ], hours: weekdays('10:00', '19:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['status', { style: 'card', hours: weekdays('10:00', '19:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['reviews', { title: 'Reviews' }],
      ['map', { address: 'Main Street 10, Miami', title: 'Visit us' }],
    ],
  },
  {
    id: 'podcast', name: 'Podcast', category: 'Creators', description: 'Latest episode, where to listen and a listener survey.',
    theme: 'retro',
    profile: { title: 'Curious Minds', bio: 'A weekly podcast about science and everyday questions 🎙️' },
    socials: [['spotify', 'https://open.spotify.com/'], ['applemusic', 'https://podcasts.apple.com/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      ['music', { url: 'https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk' }],
      ['collection', { title: 'Listen on', layout: 'grid', columns: 2 }, [
        ['link', { title: 'Spotify', url: ex, icon: 'spotify' }],
        ['link', { title: 'Apple Podcasts', url: ex, icon: 'applemusic' }],
        ['link', { title: 'YouTube', url: ex, icon: 'youtube' }],
        ['link', { title: 'RSS', url: ex }],
      ]],
      ['survey', { buttonLabel: 'Suggest a topic', title: 'What should we talk about next?' }],
      ['link', { title: 'Support the show', url: ex, icon: 'patreon' }],
    ],
  },
  {
    id: 'conference', name: 'Conference & event', category: 'Events', description: 'Countdown, schedule, venue and FAQs.',
    theme: '3d',
    profile: { title: 'FutureDev Summit', bio: 'Two days of talks, workshops and networking 🚀' },
    socials: [['linkedin', 'https://linkedin.com/'], ['x', 'https://x.com/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      ['countdown', { title: 'Doors open in', date: `${inDays(30)}T09:00:00.000Z` }],
      ['link', { title: 'Get your ticket', subtitle: 'Early bird ends soon', url: ex, layout: 'featured' }],
      ['events', { title: 'Schedule', layout: 'calendar', events: [
        item({ title: 'Opening keynote', date: inDays(30), from: '09:30', to: '10:30', location: 'Main hall' }),
        item({ title: 'Workshops', date: inDays(30), from: '11:00', to: '17:00', location: 'Rooms A–D' }),
        item({ title: 'Day 2: talks & party', date: inDays(31), from: '10:00', to: '22:00', location: 'Main hall' }),
      ] }],
      ['map', { address: 'Moscone Center, San Francisco', title: 'Venue' }],
      ['faq', { title: 'FAQ', items: [item({ question: 'Is there a student discount?', answer: 'Yes, 50% with a valid student ID.' })] }],
    ],
  },
  {
    id: 'nonprofit', name: 'Nonprofit & cause', category: 'Business', description: 'Donation banner, ways to help and sharing.',
    theme: 'breeze',
    profile: { title: 'Green Paws Rescue', bio: 'Rescuing and rehoming dogs since 2015 🐾' },
    socials: [['instagram', 'https://instagram.com/'], ['facebook', 'https://facebook.com/'], ['paypal', 'https://paypal.me/']],
    blocks: [
      ['banner', { eyebrow: 'Help us', title: 'Every $10 feeds a dog for a week', bgColor: '#15803d', gradient: true, bgColor2: '#65a30d', textColor: '#ffffff', url: ex, buttonLabel: 'Donate' }],
      ['link', { title: 'Adopt a dog', url: ex }],
      ['link', { title: 'Become a volunteer', url: ex }],
      ['copy', { title: 'Bank transfer', text: 'ES12 3456 7890 1234 5678', subtitle: 'Green Paws Rescue' }],
      ['share', { label: 'Share our page' }],
    ],
  },
  {
    id: 'wedding', name: 'Wedding', category: 'Events', description: 'Countdown, plan of the day, RSVP and the venue.',
    theme: 'paper',
    design: { titleFont: 'dm-serif', bodyFont: 'lora' },
    profile: { title: 'Sofía & Daniel', bio: 'We are getting married! 💍' },
    socials: [],
    blocks: [
      ['countdown', { title: 'The big day', date: `${inDays(60)}T17:00:00.000Z`, doneText: 'Just married!' }],
      ['events', { title: 'The day', layout: 'banners', dateFormat: 'long', events: [
        item({ title: 'Ceremony', date: inDays(60), from: '17:00', to: '18:00', location: 'San Lorenzo Church' }),
        item({ title: 'Dinner & party', date: inDays(60), from: '19:30', to: '02:00', location: 'Hacienda Las Flores' }),
      ] }],
      ['survey', { buttonLabel: 'RSVP', title: 'Will you come?', startOpen: false }],
      ['map', { address: 'Hacienda Las Flores', title: 'How to get there', directions: true }],
      ['link', { title: 'Gift registry', url: ex }],
    ],
  },
  {
    id: 'artist', name: 'Artist portfolio', category: 'Creators', description: 'Gallery of works, commissions and shop.',
    theme: 'art-pop',
    profile: { title: 'Kai Mendez', bio: 'Illustration · Murals · Prints 🎨' },
    socials: [['instagram', 'https://instagram.com/'], ['behance', 'https://behance.net/'], ['kofi', 'https://ko-fi.com/']],
    blocks: [
      ['header', { text: 'Commissions open' }],
      ['text', { text: 'Portraits, book covers and murals. Tell me your idea!', card: true }],
      ['link', { title: 'Request a commission', url: ex, layout: 'featured' }],
      ['link', { title: 'Print shop', url: ex }],
      ['link', { title: 'Full portfolio', url: ex }],
    ],
  },
  {
    id: 'teacher', name: 'Teacher & courses', category: 'Services', description: 'Courses, class schedule, resources and booking.',
    theme: 'mineral',
    design: { titleFont: 'fraunces' },
    profile: { title: 'Profe Ana', bio: 'Spanish lessons online · All levels 📚' },
    socials: [['youtube', 'https://youtube.com/'], ['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['booking', { buttonLabel: 'Book a lesson', services: [
        item({ name: 'Trial lesson', duration: '30', price: '$10' }),
        item({ name: 'Private lesson', duration: '60', price: '$25' }),
      ], hours: weekdays('08:00', '20:00') }],
      ['events', { title: 'Group classes', layout: 'grid', events: [
        item({ title: 'Beginners A1', date: inDays(3), from: '18:00', to: '19:00', location: 'Zoom' }),
        item({ title: 'Conversation club', date: inDays(5), from: '19:00', to: '20:00', location: 'Zoom' }),
      ] }],
      ['collection', { title: 'Free resources', layout: 'list' }, [
        ['link', { title: 'Verb conjugation cheat sheet', url: ex }],
        ['link', { title: '100 everyday phrases', url: ex }],
      ]],
    ],
  },
  {
    id: 'businesscard', name: 'Digital business card', category: 'Business', description: 'Contact buttons, save-contact card and map.',
    theme: 'air',
    design: { headerLayout: 'left' },
    profile: { title: 'Martín López', bio: 'Sales Director · Andes Logistics' },
    socials: [['linkedin', 'https://linkedin.com/in/'], ['email', 'martin@example.com'], ['phone', '+15551234567']],
    blocks: [
      ['contact', { email: 'martin@example.com', phone: '+15551234567', whatsapp: '+15551234567', layout: 'row' }],
      ['vcard', { name: 'Martín López', role: 'Sales Director', org: 'Andes Logistics', phone: '+15551234567', email: 'martin@example.com', website: ex, startOpen: true }],
      ['link', { title: 'Company website', url: ex, icon: 'website' }],
      ['map', { address: 'Av. Providencia 1234, Santiago', title: 'Office' }],
    ],
  },
];

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));

/** Build the page content of a template: { profile, socials, blocks, design, settings }. */
export function buildTemplatePage(id) {
  const t = byId.get(id);
  if (!t) return null;
  const make = ([type, data = {}, children]) => {
    const b = newBlock(type, data);
    if (children) b.children = children.map(make);
    return b;
  };
  const themed = applyTheme(defaultDesign(), t.theme);
  const design = resolveDesign({ ...themed, ...(t.design || {}), wallpaper: { ...themed.wallpaper, ...(t.design?.wallpaper || {}) } });
  const page = sanitizePage({
    profile: { avatar: '', verified: false, ...t.profile },
    socials: (t.socials || []).map(([platform, url]) => ({ id: uid('s'), platform, url })),
    blocks: t.blocks.map(make),
    design,
    settings: { published: true },
  });
  return page;
}

/** Template list for galleries (no blocks). */
export const templateList = () => TEMPLATES.map(({ id, name, category, description, theme }) => ({ id, name, category, description, theme }));
