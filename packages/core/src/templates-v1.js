// ─────────────────────────────────────────────────────────────
//  PAGE TEMPLATES · v1 (Classic)
//  The first generation of templates: each one follows a theme from themes.js,
//  with photos, entrance animations and per-template colors. Kept next to the
//  v2 redesign (templates.js) so people can pick either look.
//  Ids end in "-v1"; `family` is the shared id of the template in both versions.
// ─────────────────────────────────────────────────────────────
import { uid } from './util/html.js';

const ex = 'https://example.com';
// A date some days from today ("YYYY-MM-DD"), so countdowns and events stay in the future.
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const weekdays = (from, to, days = ['mon', 'tue', 'wed', 'thu', 'fri']) => days.map((day, i) => ({ id: `h${i}`, day, from, to }));
const item = (o) => ({ id: uid('i'), ...o });
// Unsplash photo (free licence, hotlinking allowed), cropped to the size it is shown at.
const img = (id, w = 640, h = w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
const avatar = (id) => img(id, 320);
const banner = (id) => img(id, 1200, 720);
const eventImg = (id) => img(id, 960, 540);
// Block options, e.g. its own entrance: fx(['gallery', {...}], { enter: 'unfold' }).
const fx = (block, options) => Object.assign(block, { options });

const LIST = [
  {
    id: 'minimal', name: 'Minimal', category: 'Personal', description: 'Clean and simple: your links, nothing else.',
    theme: 'air',
    design: { entrance: 'blur', entranceStagger: 70, buttonHover: 'grow', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff' },
    profile: { title: 'Alex Rivera', avatar: avatar('1544723795-3fb6469f5b39'), bio: 'Designer · Coffee lover · Based in Madrid' },
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
    design: { entrance: 'zoom', entranceStagger: 70, backgroundMotion: 'flow', buttonHover: 'lift', buttonPress: true, socialsStyle: 'filled', avatarBorderWidth: 3, avatarBorderColor: '#ffffff' },
    profile: { title: 'Mia Creates', avatar: avatar('1567516364473-233c4b6fcfbe'), bio: 'Lifestyle & travel videos every Sunday 🎬', verified: true },
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
    design: { entrance: 'rise', entranceOnScroll: true, buttonHover: 'lift', buttonPress: true, accentColor: '#ffffff', accentTextColor: '#0d0b1f' },
    profile: { title: 'The Night Owls', avatar: avatar('1575672913784-11a7cd4f25f4'), bio: 'Indie band from Austin. New album out now 🌙' },
    socials: [['spotify', 'https://open.spotify.com/'], ['applemusic', 'https://music.apple.com/'], ['youtube', 'https://youtube.com/'], ['instagram', 'https://instagram.com/']],
    blocks: [
      ['music', { url: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy' }],
      ['events', { title: 'Tour dates', layout: 'banners', dateFormat: 'medium', events: [
        item({ title: 'Austin — The Parish', image: eventImg('1459749411175-04bf5292ceea'), subtitle: 'Album release show', date: inDays(12), from: '20:00', to: '23:00', location: 'Austin, TX', url: ex, buttonLabel: 'Tickets' }),
        item({ title: 'Dallas — Trees', image: eventImg('1470229722913-7c0e2dbbafd3'), date: inDays(19), from: '21:00', to: '23:30', location: 'Dallas, TX', url: ex, buttonLabel: 'Tickets' }),
        item({ title: 'Houston — White Oak', image: eventImg('1499364615650-ec38552f4f34'), date: inDays(26), from: '20:00', to: '23:00', location: 'Houston, TX', url: ex, buttonLabel: 'Tickets' }),
      ] }],
      ['link', { title: 'Merch store', url: ex }],
    ],
  },
  {
    id: 'photographer', name: 'Photographer', category: 'Creators', description: 'Portfolio gallery, packages and bookings.',
    theme: 'noir',
    design: { entrance: 'fade', entranceSpeed: 'slow', entranceStagger: 90, entranceOnScroll: true, buttonHover: 'invert' },
    profile: { title: 'Lena Brooks Photo', avatar: avatar('1541516160071-4bb0c5af65ba'), bio: 'Weddings · Portraits · Editorial' },
    socials: [['instagram', 'https://instagram.com/'], ['behance', 'https://behance.net/'], ['pinterest', 'https://pinterest.com/']],
    blocks: [
      fx(['banner', { eyebrow: 'Now booking', title: '2026 weddings', image: banner('1519741497674-611481863552'), shade: 45, text: 'A few dates left this season.', bgColor: '#111111', gradient: true, bgColor2: '#3a3a3a', textColor: '#ffffff', url: ex, buttonLabel: 'Check availability' }], { enter: 'unfold' }),
      fx(['gallery', { layout: 'grid', columns: 3, items: [
        item({ image: img('1639330907580-1be70acbc1e1', 600) }),
        item({ image: img('1639330945576-8ce15e5920f2', 600) }),
        item({ image: img('1492667154321-99c184cc8b89', 600) }),
        item({ image: img('1506863530036-1efeddceb993', 600) }),
        item({ image: img('1540076156429-35ffe82b7870', 600) }),
        item({ image: img('1502389498275-fe50566c4c5a', 600) }),
      ] }], { enter: 'unfold' }),
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
    design: { titleFont: 'playfair', entrance: 'fade-up', entranceOnScroll: true, buttonPress: true },
    profile: { title: 'Casa Olivo', avatar: avatar('1672636401225-ec3d4025a4af'), bio: 'Mediterranean kitchen · Since 2012' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['phone', '+15551234567']],
    blocks: [
      ['status', { hours: weekdays('12:00', '23:00', ['tue', 'wed', 'thu', 'fri', 'sat', 'sun']) }],
      ['catalog', { display: 'always', title: 'Menu', layout: 'list', products: [
        item({ name: 'Burrata & tomatoes', image: img('1555072930-714bba1d24e2'), category: 'Starters', description: 'Heirloom tomatoes, basil oil', price: 12, tags: ['vegetarian'] }),
        item({ name: 'Grilled octopus', image: img('1535980156496-87fc2cfcb832'), category: 'Starters', description: 'Potato, paprika, olive oil', price: 16, tags: ['popular'] }),
        item({ name: 'Seafood paella', image: img('1694685367640-05d6624e57f1'), category: 'Mains', description: 'For two people', price: 38 }),
        item({ name: 'Lamb tagine', image: img('1761168955192-d710bf401325'), category: 'Mains', description: 'Apricots, almonds, couscous', price: 24, tags: ['spicy'] }),
        item({ name: 'Basque cheesecake', image: img('1676300185983-d5f242babe34'), category: 'Desserts', price: 8 }),
      ] }],
      ['link', { title: 'Book a table', url: ex, icon: 'calendar' }],
      ['map', { address: 'Gran Vía 1, Madrid', title: 'Find us' }],
      ['reviews', { title: 'Reviews' }],
    ],
  },
  {
    id: 'foodtruck', name: 'Food truck', category: 'Food', description: 'Where you are today, weekly route, pickup orders and a loyalty card.',
    theme: 'punk',
    design: { entrance: 'rise', entranceStagger: 80, entranceOnScroll: true, buttonHover: 'shift', buttonPress: true },
    profile: { title: 'Burger Bus', avatar: avatar('1565123409695-7b5ef63a2efb'), bio: 'Smash burgers on wheels 🍔 Order ahead, skip the line!' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      fx(['status', { source: 'route' }], { enter: 'drop' }),
      ['location', {}],
      ['catalog', { display: 'always', title: 'Menu', ordering: 'pickup', products: [
        item({ name: 'Classic smash', image: img('1572802419224-296b0aeee0d9'), category: 'Burgers', description: 'Double patty, cheddar, pickles', price: 9, tags: ['popular'], extras: 'Bacon = 2\nExtra cheese = 1\nNo onion' }),
        item({ name: 'Spicy chicken', image: img('1606755962773-d324e0a13086'), category: 'Burgers', price: 10, tags: ['spicy'], extras: 'Jalapeños = 0.5' }),
        item({ name: 'Veggie burger', image: img('1586190848861-99aa4a171e90'), category: 'Burgers', price: 9, tags: ['vegetarian'] }),
        item({ name: 'Fries', image: img('1630384060421-cb20d0e0649d'), category: 'Sides', price: 4 }),
        item({ name: 'Lemonade', image: img('1623084921164-4a8c5c37a912'), category: 'Drinks', price: 3 }),
      ] }],
      ['route', { stops: [
        item({ day: 'mon', place: 'Downtown square', from: '11:00', to: '15:00' }),
        item({ day: 'wed', place: 'University campus', from: '12:00', to: '16:00' }),
        item({ day: 'fri', place: 'Night market', from: '18:00', to: '23:00' }),
        item({ day: 'sat', place: 'Beach parking', from: '12:00', to: '20:00' }),
      ] }],
      fx(['loyalty', { reward: 'A free burger', stamps: 8, icon: '🍔' }], { enter: 'zoom' }),
    ],
  },
  {
    id: 'bakery', name: 'Bakery & desserts', category: 'Food', description: 'Sweet catalog with WhatsApp orders and FAQs.',
    theme: 'bloom',
    design: { titleFont: 'pacifico', entrance: 'zoom', entranceOnScroll: true, backgroundMotion: 'flow', buttonHover: 'lift', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff', accentColor: '#ffffff', accentTextColor: '#a1224f' },
    profile: { title: 'Sugar & Flour', avatar: avatar('1583338917451-face2751d8d5'), bio: 'Custom cakes and fresh pastries 🧁 Orders 48h ahead' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['facebook', 'https://facebook.com/']],
    blocks: [
      ['catalog', { display: 'always', layout: 'grid', whatsapp: '+15551234567', products: [
        item({ name: 'Chocolate cake', image: img('1606890737304-57a1ca8a5b62'), description: '8 slices', price: 35, badge: 'Best seller' }),
        item({ name: 'Croissant box', image: img('1623334044303-241021148842'), description: '6 butter croissants', price: 14 }),
        item({ name: 'Macarons', image: img('1569864358642-9d1684040f43'), description: 'Box of 12', price: 18, discount: 10 }),
        item({ name: 'Custom cake', image: img('1625649611137-df49dc542f6a'), description: 'Tell us your idea', price: 0 }),
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
    design: { entrance: 'slide', entranceOnScroll: true, buttonHover: 'shift', buttonPress: true },
    profile: { title: 'Nord Goods', avatar: avatar('1597696929736-6d13bed8e6a8'), bio: 'Minimal home objects, made to last.' },
    socials: [['instagram', 'https://instagram.com/'], ['pinterest', 'https://pinterest.com/'], ['etsy', 'https://etsy.com/']],
    blocks: [
      fx(['banner', { eyebrow: 'This week', title: '20% off ceramics', image: banner('1595351298020-038700609878'), shade: 45, text: 'Use the code at checkout.', bgColor: '#1d4ed8', gradient: true, bgColor2: '#7c3aed', textColor: '#ffffff', url: ex, buttonLabel: 'Shop now' }], { enter: 'unfold' }),
      ['catalog', { display: 'always', title: 'New in', products: [
        item({ name: 'Ceramic mug', image: img('1616241673111-508b4662c707'), price: 18, discount: 20, stock: '12', badge: 'New', url: ex }),
        item({ name: 'Linen tote', image: img('1544816155-12df9643f363'), price: 32, url: ex }),
        item({ name: 'Candle set', image: img('1640095889747-2090ee12fa7d'), price: 26, stock: '3', url: ex }),
        item({ name: 'Oak tray', image: img('1784901393087-988ae280ea4c'), price: 45, stock: '0', url: ex }),
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
    design: { entrance: 'fade-up', entranceSpeed: 'slow', buttonHover: 'invert', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff' },
    profile: { title: 'Dr. Sam Patel', avatar: avatar('1500648767791-00dcc994a43e'), bio: 'Career coach · Helping you land the job you want' },
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
    design: { entrance: 'blur', entranceStagger: 80, backgroundMotion: 'pan', buttonPress: true },
    profile: { title: 'dev.jordan', avatar: avatar('1498050108023-c5249f4df085'), bio: 'Full-stack developer · Open source · Coffee-driven' },
    socials: [['github', 'https://github.com/'], ['linkedin', 'https://linkedin.com/in/'], ['x', 'https://x.com/']],
    blocks: [
      fx(['code', { filename: 'hello.js', code: "const me = {\n  stack: ['React', 'Node', 'Postgres'],\n  available: true,\n};\n\nconsole.log(`Let's build something!`);", theme: 'night-owl' }], { enter: 'unfold' }),
      ['header', { text: 'Projects' }],
      ['link', { title: 'Otrelink', subtitle: 'Open-source link pages', url: ex }],
      ['link', { title: 'TinyURL clone', subtitle: 'Short links with analytics', url: ex }],
      ['contact', { email: 'jordan@example.com', emailLabel: 'Hire me' }],
    ],
  },
  {
    id: 'realestate', name: 'Real estate agent', category: 'Business', description: 'Featured listing, contact card and office map.',
    theme: 'lake',
    design: { entrance: 'rise', backgroundMotion: 'breathe', buttonHover: 'lift', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff' },
    profile: { title: 'Grace Kim · Realtor', avatar: avatar('1494790108377-be9c29b29330'), bio: 'Helping families find home in San Diego 🏡' },
    socials: [['instagram', 'https://instagram.com/'], ['facebook', 'https://facebook.com/'], ['phone', '+15551234567']],
    blocks: [
      fx(['banner', { eyebrow: 'Featured listing', title: '3-bed house in La Jolla', image: banner('1767567467844-ce73778da9ac'), shade: 45, text: '$1,250,000 · Ocean view · Open house Sunday', bgColor: '#0f766e', gradient: true, bgColor2: '#0e7490', textColor: '#ffffff', url: ex, buttonLabel: 'See photos' }], { enter: 'unfold' }),
      ['link', { title: 'All my listings', url: ex }],
      ['link', { title: 'What is my home worth?', url: ex }],
      fx(['vcard', { name: 'Grace Kim', role: 'Realtor', org: 'Sunrise Realty', phone: '+15551234567', email: 'grace@example.com' }], { enter: 'flip' }),
      ['map', { address: 'La Jolla, San Diego, CA', title: 'Office' }],
    ],
  },
  {
    id: 'fitness', name: 'Fitness trainer', category: 'Services', description: 'Classes calendar, booking and a challenge countdown.',
    theme: 'dark',
    design: { titleFont: 'unbounded', entrance: 'rise', entranceSpeed: 'fast', backgroundMotion: 'flow', buttonHover: 'grow', buttonPress: true },
    profile: { title: 'FitWithLuis', avatar: avatar('1526506118085-60ce8714f8c5'), bio: 'Personal trainer · HIIT · Strength 💪' },
    socials: [['instagram', 'https://instagram.com/'], ['youtube', 'https://youtube.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['countdown', { title: '30-day challenge starts in', date: `${inDays(9)}T07:00:00.000Z` }],
      ['booking', { buttonLabel: 'Book a training', services: [
        item({ name: 'Personal training', duration: '60', price: '$40' }),
        item({ name: 'Online plan call', duration: '30', price: '$25' }),
      ], hours: weekdays('06:00', '20:00', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['events', { title: 'Group classes', layout: 'carousel', events: [
        item({ title: 'HIIT in the park', image: eventImg('1778996454753-ca8b1d21b4c7'), date: inDays(2), from: '07:00', to: '08:00', location: 'Central Park' }),
        item({ title: 'Strength basics', image: eventImg('1558611848-73f7eb4001a1'), date: inDays(4), from: '18:00', to: '19:00', location: 'Iron Gym' }),
        item({ title: 'Sunday mobility', image: eventImg('1552196527-bffef41ef674'), date: inDays(6), from: '09:00', to: '10:00', location: 'Online' }),
      ] }],
    ],
  },
  {
    id: 'salon', name: 'Beauty salon & barber', category: 'Services', description: 'Services with booking, gallery and location.',
    theme: 'bloom',
    design: { entrance: 'zoom', entranceOnScroll: true, backgroundMotion: 'flow', buttonHover: 'lift', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff', accentColor: '#ffffff', accentTextColor: '#a1224f' },
    profile: { title: 'Velvet Studio', avatar: avatar('1580618672591-eb180b1a973f'), bio: 'Hair · Nails · Brows ✨ Walk-ins welcome' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['booking', { buttonLabel: 'Book an appointment', services: [
        item({ name: 'Haircut', duration: '45', price: '$35' }),
        item({ name: 'Color', duration: '120', price: '$90' }),
        item({ name: 'Manicure', duration: '45', price: '$25' }),
        item({ name: 'Brow lamination', duration: '60', price: '$45' }),
      ], hours: weekdays('10:00', '19:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['status', { style: 'card', hours: weekdays('10:00', '19:00', ['tue', 'wed', 'thu', 'fri', 'sat']) }],
      fx(['gallery', { layout: 'carousel', items: [
        item({ image: img('1634449571010-02389ed0f9b0', 720, 900), caption: 'Cut & style' }),
        item({ image: img('1580618672591-eb180b1a973f', 720, 900), caption: 'Blow-dry' }),
        item({ image: img('1616394584738-fc6e612e71b9', 720, 900), caption: 'Facials' }),
      ] }], { enter: 'unfold' }),
      ['reviews', { title: 'Reviews' }],
      ['map', { address: 'Main Street 10, Miami', title: 'Visit us' }],
    ],
  },
  {
    id: 'podcast', name: 'Podcast', category: 'Creators', description: 'Latest episode, where to listen and a listener survey.',
    theme: 'retro',
    design: { entrance: 'tilt', entranceStagger: 70, buttonHover: 'shift', buttonPress: true },
    profile: { title: 'Curious Minds', avatar: avatar('1485579149621-3123dd979885'), bio: 'A weekly podcast about science and everyday questions 🎙️' },
    socials: [['spotify', 'https://open.spotify.com/'], ['applemusic', 'https://podcasts.apple.com/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      fx(['music', { url: 'https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk' }], { enter: 'zoom' }),
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
    design: { entrance: 'flip', entranceOnScroll: true, backgroundMotion: 'flow', buttonPress: true },
    profile: { title: 'FutureDev Summit', avatar: avatar('1540575467063-178a50c2df87'), bio: 'Two days of talks, workshops and networking 🚀' },
    socials: [['linkedin', 'https://linkedin.com/'], ['x', 'https://x.com/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      fx(['countdown', { title: 'Doors open in', date: `${inDays(30)}T09:00:00.000Z` }], { enter: 'zoom' }),
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
    design: { entrance: 'rise', backgroundMotion: 'flow', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff', accentColor: '#3d2240', accentTextColor: '#ffffff' },
    profile: { title: 'Green Paws Rescue', avatar: avatar('1553688738-a278b9f063e0'), bio: 'Rescuing and rehoming dogs since 2015 🐾' },
    socials: [['instagram', 'https://instagram.com/'], ['facebook', 'https://facebook.com/'], ['paypal', 'https://paypal.me/']],
    blocks: [
      fx(['banner', { eyebrow: 'Help us', title: 'Every $10 feeds a dog for a week', image: banner('1761943840993-1c38354e8603'), shade: 45, bgColor: '#15803d', gradient: true, bgColor2: '#65a30d', textColor: '#ffffff', url: ex, buttonLabel: 'Donate' }], { enter: 'unfold' }),
      ['link', { title: 'Adopt a dog', url: ex }],
      ['link', { title: 'Become a volunteer', url: ex }],
      ['copy', { title: 'Bank transfer', text: 'ES12 3456 7890 1234 5678', subtitle: 'Green Paws Rescue' }],
      fx(['share', { label: 'Share our page' }], { enter: 'zoom' }),
    ],
  },
  {
    id: 'wedding', name: 'Wedding', category: 'Events', description: 'Countdown, plan of the day, RSVP and the venue.',
    theme: 'paper',
    design: { titleFont: 'dm-serif', bodyFont: 'lora', entrance: 'fade', entranceSpeed: 'slow', entranceStagger: 90, entranceOnScroll: true },
    profile: { title: 'Sofía & Daniel', avatar: avatar('1520854221256-17451cc331bf'), bio: 'We are getting married! 💍' },
    socials: [],
    blocks: [
      fx(['countdown', { title: 'The big day', date: `${inDays(60)}T17:00:00.000Z`, doneText: 'Just married!' }], { enter: 'zoom' }),
      ['events', { title: 'The day', layout: 'banners', dateFormat: 'long', events: [
        item({ title: 'Ceremony', image: eventImg('1696238173596-554e92268051'), date: inDays(60), from: '17:00', to: '18:00', location: 'San Lorenzo Church' }),
        item({ title: 'Dinner & party', image: eventImg('1536392706976-e486e2ba97af'), date: inDays(60), from: '19:30', to: '02:00', location: 'Hacienda Las Flores' }),
      ] }],
      ['survey', { buttonLabel: 'RSVP', title: 'Will you come?', startOpen: false }],
      ['map', { address: 'Hacienda Las Flores', title: 'How to get there', directions: true }],
      ['link', { title: 'Gift registry', url: ex }],
    ],
  },
  {
    id: 'artist', name: 'Artist portfolio', category: 'Creators', description: 'Gallery of works, commissions and shop.',
    theme: 'art-pop',
    design: { entrance: 'zoom', entranceOnScroll: true, buttonHover: 'shift', buttonPress: true },
    profile: { title: 'Kai Mendez', avatar: avatar('1787725077002-50e635839134'), bio: 'Illustration · Murals · Prints 🎨' },
    socials: [['instagram', 'https://instagram.com/'], ['behance', 'https://behance.net/'], ['kofi', 'https://ko-fi.com/']],
    blocks: [
      ['header', { text: 'Commissions open' }],
      ['text', { text: 'Portraits, book covers and murals. Tell me your idea!', card: true }],
      fx(['gallery', { layout: 'grid', columns: 3, items: [
        item({ image: img('1580566176138-daa588058b59', 600) }),
        item({ image: img('1655998233171-ee5b130acba5', 600) }),
        item({ image: img('1614850715776-a749a85b4144', 600) }),
        item({ image: img('1540929819775-fcc7d4649250', 600) }),
        item({ image: img('1632267071031-1cda764f851f', 600) }),
        item({ image: img('1758366278313-70468ec8cb2c', 600) }),
      ] }], { enter: 'unfold' }),
      ['link', { title: 'Request a commission', url: ex, layout: 'featured' }],
      ['link', { title: 'Print shop', url: ex }],
      ['link', { title: 'Full portfolio', url: ex }],
    ],
  },
  {
    id: 'teacher', name: 'Teacher & courses', category: 'Services', description: 'Courses, class schedule, resources and booking.',
    theme: 'mineral',
    design: { titleFont: 'fraunces', entrance: 'fade-up', entranceOnScroll: true, buttonHover: 'lift', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff' },
    profile: { title: 'Profe Ana', avatar: avatar('1590650213165-c1fef80648c4'), bio: 'Spanish lessons online · All levels 📚' },
    socials: [['youtube', 'https://youtube.com/'], ['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['booking', { buttonLabel: 'Book a lesson', services: [
        item({ name: 'Trial lesson', duration: '30', price: '$10' }),
        item({ name: 'Private lesson', duration: '60', price: '$25' }),
      ], hours: weekdays('08:00', '20:00') }],
      ['events', { title: 'Group classes', layout: 'grid', events: [
        item({ title: 'Beginners A1', image: eventImg('1522199755839-a2bacb67c546'), date: inDays(3), from: '18:00', to: '19:00', location: 'Zoom' }),
        item({ title: 'Conversation club', image: eventImg('1582298538104-fe2e74c27f59'), date: inDays(5), from: '19:00', to: '20:00', location: 'Zoom' }),
      ] }],
      ['collection', { title: 'Free resources', layout: 'list' }, [
        ['link', { title: 'Verb conjugation cheat sheet', url: ex }],
        ['link', { title: '100 everyday phrases', url: ex }],
      ]],
    ],
  },
  {
    id: 'businesscard', name: 'Digital business card', category: 'Business', description: 'Quick contact buttons, save-contact card, links and office map.',
    theme: 'corporate',
    design: { avatarSize: 88, entrance: 'fade-up', entranceSpeed: 'fast', buttonPress: true, avatarBorderWidth: 3, avatarBorderColor: '#ffffff' },
    profile: { title: 'Martín López', avatar: avatar('1560250097-0b93528c311a'), bio: 'Sales Director at Andes Logistics\nFreight & supply chain across Latin America' },
    socials: [['linkedin', 'https://linkedin.com/in/'], ['email', 'martin@example.com'], ['phone', '+15551234567'], ['whatsapp', 'https://wa.me/']],
    blocks: [
      ['contact', { email: 'martin@example.com', emailLabel: 'Email', phone: '+15551234567', phoneLabel: 'Call', whatsapp: '+15551234567', whatsappLabel: 'WhatsApp', layout: 'row' }],
      ['vcard', { label: 'Save my contact', name: 'Martín López', role: 'Sales Director', org: 'Andes Logistics', phone: '+15551234567', email: 'martin@example.com', website: ex }],
      ['header', { text: 'Andes Logistics' }],
      ['link', { title: 'Company website', subtitle: 'andeslogistics.com', url: ex, icon: 'website' }],
      ['link', { title: 'Book a meeting', subtitle: '30 min · Google Meet', url: ex }],
      ['link', { title: 'Company brochure', subtitle: 'PDF · 2 MB', url: ex }],
      ['map', { address: 'Av. Providencia 1234, Santiago', title: 'Office', directions: true }],
    ],
  },
  {
    id: 'tacotruck', name: 'Taco truck', category: 'Food', description: 'Open/closed status, today’s spot, WhatsApp menu orders and festival dates.',
    theme: 'citrus',
    design: { titleFont: 'bangers', titleWeight: '400', titleSize: 40, entrance: 'rise', entranceOnScroll: true, backgroundMotion: 'flow', buttonPress: true },
    profile: { title: 'Taco Loco', avatar: avatar('1648437595587-e6a8b0cdf1f9'), bio: 'Street tacos made fresh 🌮 Follow the truck!' },
    socials: [['instagram', 'https://instagram.com/'], ['tiktok', 'https://tiktok.com/'], ['whatsapp', 'https://wa.me/'], ['facebook', 'https://facebook.com/']],
    blocks: [
      fx(['status', { source: 'route', style: 'card' }], { enter: 'drop' }),
      ['location', { title: 'Find the truck today' }],
      ['catalog', { display: 'always', title: 'Menu', layout: 'list', ordering: 'links', whatsapp: '+15551234567', products: [
        item({ name: 'Al pastor', image: img('1640983743761-4f0e0204bc58'), category: 'Tacos', description: 'Pork, pineapple, onion, cilantro', price: 3, tags: ['popular'] }),
        item({ name: 'Carne asada', image: img('1599974579688-8dbdd335c77f'), category: 'Tacos', description: 'Grilled steak, salsa verde', price: 3.5 }),
        item({ name: 'Baja fish', image: img('1711989874705-bb85dc205541'), category: 'Tacos', description: 'Crispy fish, cabbage, chipotle mayo', price: 4 }),
        item({ name: 'Mushroom & corn', image: img('1644085128237-9ba593123ac3'), category: 'Tacos', price: 3, tags: ['vegetarian'] }),
        item({ name: 'Loaded quesadilla', image: img('1719957770167-bb66133ba808'), category: 'Specials', description: 'Cheese, choice of meat, guacamole', price: 9, tags: ['spicy'] }),
        item({ name: 'Elote', image: img('1635572228172-ff4ea7f07e8f'), category: 'Sides', description: 'Street corn, cotija, chili', price: 4 }),
        item({ name: 'Horchata', image: img('1724198218800-ef4be935d3a8'), category: 'Drinks', price: 3 }),
      ] }],
      ['route', { stops: [
        item({ day: 'tue', place: 'Office park', from: '11:30', to: '14:30' }),
        item({ day: 'thu', place: 'Brewery district', from: '17:00', to: '22:00' }),
        item({ day: 'fri', place: 'Downtown plaza', from: '18:00', to: '23:30' }),
        item({ day: 'sun', place: 'Farmers market', from: '09:00', to: '14:00' }),
      ] }],
      ['events', { title: 'Catch us at', layout: 'carousel', events: [
        item({ title: 'Street Food Fest', image: eventImg('1683731505481-a529c4df34f8'), subtitle: 'Booth 12', kind: 'range', date: inDays(10), endDate: inDays(12), allDay: true, location: 'Riverside Park' }),
        item({ title: 'Live music night', image: eventImg('1786206570618-0e9dbf4aac1e'), date: inDays(17), from: '19:00', to: '23:00', location: 'The Yard' }),
      ] }],
      ['link', { title: 'Book the truck for your party', subtitle: 'Weddings, offices, birthdays', url: ex }],
    ],
  },
  {
    id: 'streamer', name: 'Streamer & gamer', category: 'Creators', description: 'Latest video, stream schedule, setup and ways to support.',
    theme: 'aurora',
    design: { entrance: 'zoom', entranceStagger: 70, entranceOnScroll: true, buttonHover: 'lift', buttonPress: true, accentColor: '#ffffff', accentTextColor: '#0d0b1f' },
    profile: { title: 'PixelNova', avatar: avatar('1616588589676-62b3bd4ff6d2'), bio: 'Variety streamer 🎮 Speedruns, cozy games and chaos' },
    socials: [['twitch', 'https://twitch.tv/'], ['youtube', 'https://youtube.com/'], ['discord', 'https://discord.gg/'], ['tiktok', 'https://tiktok.com/']],
    blocks: [
      ['link', { title: 'Watch live on Twitch', subtitle: 'Mon · Wed · Fri at 8 PM', url: ex, layout: 'featured', icon: 'twitch' }],
      ['video', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Latest highlight' }],
      ['events', { title: 'Stream schedule', layout: 'grid', dateFormat: 'short', events: [
        item({ title: 'Speedrun Monday', image: eventImg('1612287230202-1ff1d85d1bdf'), subtitle: 'Any% attempts', date: inDays(1), from: '20:00', to: '23:00' }),
        item({ title: 'Cozy Wednesday', image: eventImg('1665041950905-adcdd2aaab54'), subtitle: 'Farming & chill', date: inDays(3), from: '20:00', to: '22:30' }),
        item({ title: 'Community games', image: eventImg('1493711662062-fa541adb3fc8'), subtitle: 'Play with subs', date: inDays(5), from: '20:00', to: '00:00' }),
      ] }],
      ['collection', { title: 'My setup', layout: 'grid', columns: 2 }, [
        ['link', { title: 'Mic', url: ex, thumbnail: img('1660631228116-b3643559f611', 480) }],
        ['link', { title: 'Camera', url: ex, thumbnail: img('1612548403247-aa2873e9422d', 480) }],
        ['link', { title: 'Keyboard', url: ex, thumbnail: img('1618384887929-16ec33fab9ef', 480) }],
        ['link', { title: 'Chair', url: ex, thumbnail: img('1770195483917-b3bb444b7a29', 480) }],
      ]],
      ['link', { title: 'Join the Discord', url: ex, icon: 'discord' }],
      ['link', { title: 'Support me', subtitle: 'Tips keep the stream going 💜', url: ex, icon: 'kofi' }],
    ],
  },
  {
    id: 'clinic', name: 'Clinic & health', category: 'Services', description: 'Opening hours, appointment booking, services FAQ and location.',
    theme: 'ocean',
    design: { entrance: 'fade-up', entranceOnScroll: true, backgroundMotion: 'flow', buttonPress: true, accentColor: '#ffffff', accentTextColor: '#0b2545' },
    profile: { title: 'Sonrisa Dental', avatar: avatar('1629909613654-28e377c37b09'), bio: 'Family dentistry · Whitening · Orthodontics 🦷' },
    socials: [['whatsapp', 'https://wa.me/'], ['instagram', 'https://instagram.com/'], ['phone', '+15551234567']],
    blocks: [
      ['status', { style: 'card', hours: weekdays('08:00', '18:00', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) }],
      ['booking', { buttonLabel: 'Book an appointment', description: 'Pick a service and a time that works for you', services: [
        item({ name: 'Check-up & cleaning', duration: '45', price: '$60' }),
        item({ name: 'Teeth whitening', duration: '60', price: '$180' }),
        item({ name: 'Orthodontics consult', duration: '30', price: 'Free' }),
        item({ name: 'Emergency visit', duration: '30', price: '$80' }),
      ], hours: weekdays('08:00', '18:00') }],
      ['contact', { phone: '+15551234567', phoneLabel: 'Call', whatsapp: '+15551234567', whatsappLabel: 'WhatsApp', layout: 'row' }],
      ['faq', { title: 'Questions', items: [
        item({ question: 'Do you accept insurance?', answer: 'Yes, most major plans. Send us a photo of your card on WhatsApp to check.' }),
        item({ question: 'Do you treat children?', answer: 'Yes, from age 3. We make the first visit fun!' }),
        item({ question: 'What about emergencies?', answer: 'Call us: we keep slots free every day for urgent cases.' }),
      ] }],
      ['map', { address: 'Calle 50, Panama City', title: 'Our clinic', directions: true }],
      ['reviews', { title: 'Patient reviews' }],
    ],
  },
  {
    id: 'tours', name: 'Tours & travel', category: 'Events', description: 'Upcoming trips, tour packages with WhatsApp booking and reviews.',
    theme: 'forest',
    design: { entrance: 'rise', entranceOnScroll: true, backgroundMotion: 'breathe', buttonPress: true },
    profile: { title: 'Andes Trails', avatar: avatar('1637580980556-085dee659c7e'), bio: 'Small-group hikes and adventures in Patagonia 🏔️' },
    socials: [['instagram', 'https://instagram.com/'], ['whatsapp', 'https://wa.me/'], ['youtube', 'https://youtube.com/']],
    blocks: [
      fx(['banner', { eyebrow: 'Next season', title: 'Torres del Paine W Trek', image: banner('1715356758153-6d58ae44e8fe'), shade: 45, text: '5 days · max 10 people · all included', bgColor: '#1d3324', gradient: true, bgColor2: '#a16207', textColor: '#ffffff', url: ex, buttonLabel: 'See the trip' }], { enter: 'unfold' }),
      ['events', { title: 'Upcoming departures', layout: 'banners', events: [
        item({ title: 'W Trek', subtitle: '3 spots left', image: eventImg('1641370460764-7a4a314687b7'), kind: 'range', date: inDays(20), endDate: inDays(24), allDay: true, location: 'Puerto Natales' }),
        item({ title: 'Glacier kayaking', image: eventImg('1552751753-0fc84ae5b6c8'), kind: 'range', date: inDays(35), endDate: inDays(36), allDay: true, location: 'Grey Lake' }),
        item({ title: 'Fitz Roy sunrise hike', image: eventImg('1585424335022-13ad7f66f74c'), date: inDays(45), from: '03:30', to: '12:00', location: 'El Chaltén' }),
      ] }],
      ['catalog', { display: 'always', title: 'Tours', layout: 'list', whatsapp: '+15551234567', products: [
        item({ name: 'W Trek (5 days)', image: img('1776582837216-c698aef2c075'), category: 'Multi-day', description: 'Refugios, meals and guide', price: 1290 }),
        item({ name: 'O Circuit (9 days)', image: img('1784295423905-cf7d7e304e99'), category: 'Multi-day', description: 'For experienced hikers', price: 2150 }),
        item({ name: 'Glacier kayak', image: img('1673209378872-a36ba431f248'), category: 'Day trips', description: 'Equipment included', price: 180 }),
        item({ name: 'Private guide', image: img('1551632811-561732d1e306'), category: 'Day trips', description: 'Your route, your pace', price: 250 }),
      ] }],
      ['faq', { title: 'Before you go', items: [
        item({ question: 'How fit do I need to be?', answer: 'You should be able to walk 6–8 hours with a light backpack.' }),
        item({ question: 'What is included?', answer: 'Guide, transport from Puerto Natales, meals and camping gear.' }),
      ] }],
      ['reviews', { title: 'Traveler reviews' }],
    ],
  },
];

export const TEMPLATES_V1 = LIST.map((t) => ({ ...t, id: `${t.id}-v1`, family: t.id, version: 1 }));
