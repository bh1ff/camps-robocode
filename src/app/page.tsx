'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const NAV_LINKS = [
  ['#activities', 'What to Expect'],
  ['#locations', 'Locations'],
  ['#testimonials', 'Reviews'],
  ['#pricing', 'Pricing'],
];

const TRUST_STATS = [
  ['22,000+', 'Robocoders Taught'],
  ['6–17', 'Age Range'],
  ['3', 'Camp Locations'],
  ['Easter 2026', '14th – 25th April'],
];

const ACTIVITIES = [
  { img: '/camp/IMG_5527.jpg', title: 'Robotics', desc: 'Build and program robots from scratch. Sensors, motors, and logic come to life in hands-on Studio Lab sessions.', color: '#00dcde' },
  { img: '/camp/IMG_5414.jpg', title: 'Game Development', desc: 'Design characters, build levels, and code mechanics. Your child\'s game, running on a real screen by the end of the day.', color: '#ff00bf' },
  { img: '/camp/rc-70.jpg', title: '3D Printing & Engineering', desc: 'Sketch it. Model it. Print it. Take it home. From digital design to solid object in one session.', color: '#ff9752' },
  { img: '/camp/rc-61.jpg', title: 'Electronics & Circuits', desc: 'Wire real circuits, connect sensors, and build working electronic projects. Hands-on engineering with real components.', color: '#00dcde' },
  { img: '/camp/rc-40.jpg', title: 'Mechanical Challenges', desc: 'Marble runs, spaghetti towers, Meccano builds, and cardboard engineering. Creative problem-solving with real materials.', color: '#ff00bf' },
  { img: '/camp/rc-31.jpg', title: 'Physical Activity', desc: 'Table tennis, team games, and active breaks every day. A healthy balance of building minds and bodies.', color: '#ff9752' },
];

const LOCATIONS = [
  {
    name: 'Robocode Shirley Centre',
    tag: 'Solihull',
    tagDetail: 'Solihull HAF',
    address: 'The Exchange, 26 Haslucks Green Road, Shirley, B90 2EL',
    days: '8 days over 2 weeks',
    time: '10:00 AM – 2:00 PM',
    color: '#00dcde',
    haf: true,
    paid: true,
    img: '/camp/rc-22.jpg',
    badge: 'Ofsted Registered',
  },
  {
    name: 'Tudor Grange Academy',
    tag: 'Kingshurst',
    tagDetail: 'Solihull HAF',
    address: 'Cooks Lane, Fordbridge, Birmingham, B37 6NU',
    days: '4 days, 1 week',
    time: '12:00 PM – 4:00 PM',
    color: '#ff00bf',
    haf: true,
    paid: false,
    img: '/camp/rc-10.jpg',
    badge: 'HAF Only',
  },
  {
    name: 'Birmingham City University',
    tag: 'Birmingham',
    tagDetail: 'Birmingham HAF',
    address: '4 Cardigan St, Birmingham, B4 7BD',
    days: '4 days, 1 week',
    time: '11:00 AM – 3:00 PM',
    color: '#ff9752',
    haf: true,
    paid: false,
    img: '/camp/IMG_4865.jpg',
    badge: 'HAF Only',
  },
];

const TESTIMONIALS = [
  {
    quote: "My 8-year-old attended the Robocode Tech Camp and we couldn't be happier. The program was engaging, well-structured, and tailored to each child's interests. The instructors were knowledgeable, friendly, and supportive. I highly recommend Robocode and we'll definitely be enrolling again next year.",
    name: 'Martha',
    detail: 'Parent of 8-year-old',
  },
  {
    quote: "My son and niece had an amazing experience at Robocode's camp. They learned so much and were excited to attend every single day. Seeing them so motivated and happy was incredible. They're already looking forward to coming back for more.",
    name: 'Rebecca',
    detail: 'Parent',
  },
  {
    quote: "I joined Robocode for work experience and felt welcomed from day one. The environment was positive, respectful, and very supportive. I gained valuable hands-on experience in robotics and software engineering while learning from an inspiring team.",
    name: 'Maya',
    detail: 'Work Experience Student',
  },
];

const PRICING = [
  { days: 1, price: 25, per: '£25/day', save: null },
  { days: 2, price: 40, per: '£20/day', save: '20%' },
  { days: 4, price: 75, per: '£18.75/day', save: '25%' },
  { days: 8, price: 140, per: '£17.50/day', save: '30%', popular: true },
];

const TRUST_BADGES = [
  { label: 'Ofsted Registered', icon: '✓' },
  { label: 'DBS Checked Staff', icon: '✓' },
  { label: 'SEND-Friendly', icon: '✓' },
  { label: 'Hot Meal Included', icon: '✓' },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f7f7]">
      {/* ── NAV ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#003439]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/mascot.png" alt="Robocode" width={36} height={36} className="w-9 h-9" />
            <span className="font-heading text-white text-lg tracking-wider">ROBOCODE</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} className="text-white/70 hover:text-white transition-colors text-sm font-medium">{label}</a>
            ))}
            <a href="https://robocode.uk" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors text-sm">
              robocode.uk
            </a>
            <Link href="/book/haf" className="px-5 py-2.5 rounded-full bg-[#00dcde] text-[#003439] font-bold text-sm hover:bg-[#83fdff] transition-colors">
              Book Now
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#003439]/98 backdrop-blur-md border-t border-white/10 pb-6 px-6 space-y-4 pt-4">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-white/80 hover:text-white text-lg">{label}</a>
            ))}
            <a href="https://robocode.uk" onClick={() => setMenuOpen(false)} className="block text-white/50 hover:text-white text-lg">robocode.uk</a>
            <Link href="/book/haf" onClick={() => setMenuOpen(false)} className="block text-center mt-4 px-6 py-3 rounded-full bg-[#00dcde] text-[#003439] font-bold">
              Book Now
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#003439]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url('/camp/rc-10.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            opacity: 0.25,
          }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#003439]/60 via-[#003439]/40 to-[#003439]" />
          <svg className="absolute top-12 right-0 w-[500px] h-[500px] opacity-[0.04]" viewBox="0 0 200 200">
            <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#00dcde" strokeWidth="1" />
            <polygon points="100,30 170,65 170,135 100,170 30,135 30,65" fill="none" stroke="#00dcde" strokeWidth="0.5" />
            <polygon points="100,50 150,75 150,125 100,150 50,125 50,75" fill="none" stroke="#00dcde" strokeWidth="0.5" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full h-32 opacity-[0.06]" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,80 H300 L320,50 H500 L520,80 H800 L830,30 H1000 L1020,80 H1200" fill="none" stroke="#00dcde" strokeWidth="1.5" />
            <path d="M0,60 H150 L170,30 H400 L420,60 H600" fill="none" stroke="#ff00bf" strokeWidth="0.8" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00dcde]/15 border border-[#00dcde]/30 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#00dcde] animate-pulse" />
                <span className="text-[#83fdff] text-sm font-medium">Easter 2026 — Bookings Open</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading text-white leading-[1.1] mb-6">
                <span className="text-[#00dcde]">IMAGINE.</span><br />
                <span className="text-[#ff00bf]">BUILD.</span><br />
                <span className="text-[#ff9752]">IMPROVE.</span>
              </h1>

              <p className="text-lg sm:text-xl text-white/70 max-w-lg mb-4 leading-relaxed">
                Project-packed holiday tech camps for ages 6–17. Robotics, electronics, game development, 3D printing, and more.
              </p>
              <p className="text-sm text-[#83fdff]/60 mb-8">
                Teaching tomorrow&apos;s skills, today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book/haf"
                  className="group relative px-8 py-4 rounded-2xl font-bold text-lg text-[#003439] bg-[#00dcde] hover:bg-[#83fdff] transition-all duration-300 text-center shadow-[0_0_30px_rgba(0,220,222,0.3)] hover:shadow-[0_0_50px_rgba(0,220,222,0.5)]"
                >
                  Book HAF (Free)
                  <span className="block text-xs font-normal mt-0.5 text-[#003439]/70">For eligible families</span>
                </Link>
                <Link
                  href="/book/paid"
                  className="px-8 py-4 rounded-2xl font-bold text-lg text-white border-2 border-[#ff00bf] hover:bg-[#ff00bf]/15 transition-all duration-300 text-center"
                >
                  Book Paid Camp
                  <span className="block text-xs font-normal mt-0.5 text-white/50">From £25/day</span>
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 aspect-video">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/SPV3YG-64Pg?rel=0&modestbranding=1"
                  title="Robocode Easter Tech Camp"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#ff00bf]/20 rounded-full blur-2xl" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#00dcde]/20 rounded-full blur-xl" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="relative -mt-1 bg-gradient-to-r from-[#003439] via-[#05575c] to-[#003439] border-t border-[#00dcde]/20">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {TRUST_STATS.map(([value, label], i) => (
              <FadeIn key={label} delay={i * 100}>
                <p className="text-2xl sm:text-3xl font-heading text-[#00dcde]">{value}</p>
                <p className="text-xs sm:text-sm text-white/50 mt-1">{label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="bg-[#003439] border-b border-[#00dcde]/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-white/60 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#00dcde]/20 text-[#00dcde] flex items-center justify-center text-[10px] font-bold flex-none">{badge.icon}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO (MOBILE) ── */}
      <section className="lg:hidden bg-[#003439] px-4 py-8">
        <div className="max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/SPV3YG-64Pg?rel=0&modestbranding=1"
            title="Robocode Easter Tech Camp"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* ── WHAT THEY'LL BUILD ── */}
      <section id="activities" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[#ff00bf] font-heading text-xs tracking-[0.2em]">WHAT TO EXPECT</span>
              <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">LEARNING HAPPENS WHEN CHILDREN BUILD</h2>
              <p className="text-[#05575c]/70 text-lg leading-relaxed">
                Every day is a guided project sprint. Your child works with real tools, solves real problems, and takes home real skills — guided by experienced Mentors.
              </p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVITIES.map((a, i) => (
              <FadeIn key={a.title} delay={i * 100}>
                <div className="group robo-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <Image src={a.img} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="h-1 w-10 rounded-full mb-2" style={{ background: a.color }} />
                      <h3 className="font-heading text-white text-sm">{a.title}</h3>
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <p className="text-sm text-[#05575c]/70 leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[#00dcde] font-heading text-xs tracking-[0.2em]">EVERYTHING INCLUDED</span>
              <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">WHAT YOUR CHILD GETS</h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🍱', title: 'Hot Meal', desc: 'A hot meal with fruit and vegetables every session. Allergy and dietary needs catered for.' },
              { icon: '⚡', title: 'All Equipment', desc: 'Robotics kits, electronics, laptops, and all materials provided. Nothing to buy or bring.' },
              { icon: '🏃', title: '1 Hour Activity', desc: 'Physical activity every day — team games, table tennis, and active breaks built into the schedule.' },
              { icon: '🛡️', title: 'Safe & Supervised', desc: 'Ofsted-registered. DBS-checked Mentors. SEND-friendly with trained support staff.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 100}>
                <div className="text-center p-6 rounded-2xl bg-[#edfffe] border border-[#00dcde]/10 h-full">
                  <span className="text-3xl block mb-3">{item.icon}</span>
                  <h3 className="font-heading text-[#003439] text-sm mb-2">{item.title}</h3>
                  <p className="text-sm text-[#05575c]/60 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ── */}
      <section className="py-4 bg-[#003439] overflow-hidden">
        <div className="flex gap-4 animate-scroll-x">
          {['/camp/rc-47.jpg', '/camp/IMG_5554.jpg', '/camp/rc-40.jpg', '/camp/IMG_4865.jpg', '/camp/IMG_1885.jpg', '/camp/rc-31.jpg',
            '/camp/rc-47.jpg', '/camp/IMG_5554.jpg', '/camp/rc-40.jpg', '/camp/IMG_4865.jpg', '/camp/IMG_1885.jpg', '/camp/rc-31.jpg',
          ].map((src, i) => (
            <div key={i} className="flex-none w-64 h-44 rounded-xl overflow-hidden">
              <Image src={src} alt="Camp moment" width={256} height={176} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* ── LOCATIONS ── */}
      <section id="locations" className="py-20 sm:py-28 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[#ff9752] font-heading text-xs tracking-[0.2em]">CAMP LOCATIONS</span>
              <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">3 LOCATIONS ACROSS THE WEST MIDLANDS</h2>
              <p className="text-[#05575c]/70 text-lg">Choose the site closest to you. All locations offer the same quality Robocode experience.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {LOCATIONS.map((loc, i) => (
              <FadeIn key={loc.name} delay={i * 150}>
                <div className="robo-card overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="relative h-44 overflow-hidden">
                    <Image src={loc.img} alt={loc.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: loc.color }}>
                        {loc.tag}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-sm">
                        {loc.badge}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-heading text-[#003439] text-base mb-1">{loc.name}</h3>
                    <p className="text-xs text-[#05575c]/40 mb-4">{loc.tagDetail}</p>
                    <div className="space-y-3 text-sm flex-1">
                      <div className="flex gap-3">
                        <svg className="w-4 h-4 mt-0.5 text-[#05575c]/40 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[#05575c]/70">{loc.address}</span>
                      </div>
                      <div className="flex gap-3">
                        <svg className="w-4 h-4 mt-0.5 text-[#05575c]/40 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[#05575c]/70">{loc.days}</span>
                      </div>
                      <div className="flex gap-3">
                        <svg className="w-4 h-4 mt-0.5 text-[#05575c]/40 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[#05575c]/70">{loc.time}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                      {loc.haf && (
                        <Link href="/book/haf" className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-[#003439] bg-[#00dcde]/15 hover:bg-[#00dcde]/25 transition-colors">
                          HAF (Free)
                        </Link>
                      )}
                      {loc.paid && (
                        <Link href="/book/paid" className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-[#98036c] bg-[#ff00bf]/10 hover:bg-[#ff00bf]/20 transition-colors">
                          Paid
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="mt-8 space-y-3">
              <div className="p-5 rounded-2xl bg-[#edfffe] border border-[#00dcde]/20 text-center">
                <p className="text-sm text-[#05575c]">
                  <strong className="text-[#003439]">HAF-funded places are FREE</strong> for families whose children are eligible for free school meals and have a HAF code.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#fff6ed] border border-[#ff9752]/20 text-center">
                <p className="text-xs text-[#7e2610]">
                  <strong>Eligibility note:</strong> Solihull HAF — children must live in or attend school in Solihull. Birmingham HAF — children must live in or attend school in Birmingham.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section className="py-20 sm:py-28 bg-[#003439] relative overflow-hidden scroll-mt-20">
        <svg className="absolute top-0 right-0 w-96 h-96 opacity-[0.03]" viewBox="0 0 200 200">
          <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#00dcde" strokeWidth="1" />
          <polygon points="100,30 170,65 170,135 100,170 30,135 30,65" fill="none" stroke="#ff00bf" strokeWidth="0.5" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[#00dcde] font-heading text-xs tracking-[0.2em]">IS THIS RIGHT FOR YOUR CHILD?</span>
              <h2 className="text-3xl sm:text-4xl font-heading text-white mt-3">WHO IS THIS FOR</h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { num: '01', title: 'AGES 6–17', desc: 'Activities adapted to suit different learning stages and skill levels.', icon: '🎯' },
              { num: '02', title: 'CURIOUS MINDS', desc: 'Kids who love asking questions and exploring how things work.', icon: '🔍' },
              { num: '03', title: 'CREATORS', desc: 'Kids who enjoy building things with their hands and imagination.', icon: '🛠️' },
              { num: '04', title: 'CHALLENGE SEEKERS', desc: 'Kids who thrive with meaningful challenges that keep them engaged.', icon: '🚀' },
              { num: '05', title: 'CONFIDENCE BUILDERS', desc: 'Kids developing problem-solving skills through hands-on learning.', icon: '💡' },
            ].map((item, i) => (
              <FadeIn key={item.num} delay={i * 100}>
                <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00dcde]/40 hover:bg-white/10 transition-all duration-300 h-full">
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <span className="font-heading text-[#00dcde] text-xs">{item.num}</span>
                  <h3 className="font-heading text-white text-sm mt-1 mb-3">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[#ff00bf] font-heading text-xs tracking-[0.2em]">PARENT REVIEWS</span>
              <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">WHAT OTHER PARENTS SAID</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 150}>
                <div className="robo-card p-6 sm:p-8 h-full flex flex-col">
                  <svg className="w-8 h-8 text-[#00dcde]/30 mb-4 flex-none" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-[#05575c]/80 text-sm leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00dcde] to-[#003439] flex items-center justify-center text-white font-heading text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#003439] text-sm">{t.name}</p>
                      <p className="text-xs text-[#05575c]/50">{t.detail}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 sm:py-28 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[#ff9752] font-heading text-xs tracking-[0.2em]">PAID CAMP PRICING</span>
              <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">FLEXIBLE PACKAGES</h2>
              <p className="text-[#05575c]/70 text-lg">Available at the Solihull centre. The more days, the bigger the saving. Prices are per family — days can be shared across siblings.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {PRICING.map((pkg, i) => (
              <FadeIn key={pkg.days} delay={i * 100}>
                <div className={`relative rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between ${
                  pkg.popular
                    ? 'bg-gradient-to-br from-[#003439] to-[#05575c] text-white shadow-xl'
                    : 'bg-[#f0f7f7] border-2 border-gray-100 hover:border-[#00dcde]/40'
                }`}>
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#ff00bf] text-white text-xs font-bold whitespace-nowrap">
                      BEST VALUE
                    </span>
                  )}
                  <div>
                    <p className={`text-sm font-medium mb-1 ${pkg.popular ? 'text-[#83fdff]' : 'text-[#05575c]/50'}`}>
                      {pkg.days} {pkg.days === 1 ? 'Day' : 'Days'}
                    </p>
                    <p className={`text-4xl font-heading mb-1 ${pkg.popular ? 'text-white' : 'text-[#003439]'}`}>
                      £{pkg.price}
                    </p>
                    <p className={`text-xs ${pkg.popular ? 'text-white/50' : 'text-[#05575c]/40'}`}>
                      {pkg.per}
                    </p>
                  </div>
                  {pkg.save && (
                    <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                      pkg.popular ? 'bg-[#00dcde]/20 text-[#83fdff]' : 'bg-[#00dcde]/10 text-[#00adb3]'
                    }`}>
                      Save {pkg.save}
                    </span>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="text-center mt-10">
              <Link href="/book/paid" className="inline-flex px-10 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-[#ff00bf] to-[#ff58ea] hover:from-[#df009b] hover:to-[#ff00bf] transition-all duration-300 shadow-lg shadow-[#ff00bf]/20">
                Book Paid Camp
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── ABOUT ROBOCODE ── */}
      <section className="py-16 sm:py-20 bg-[#edfffe]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-[#00dcde] font-heading text-xs tracking-[0.2em]">ABOUT ROBOCODE</span>
            <h2 className="text-2xl sm:text-3xl font-heading text-[#003439] mt-3 mb-6">MORE THAN A HOLIDAY CAMP</h2>
            <p className="text-[#05575c]/70 text-lg leading-relaxed mb-6">
              Robocode is an Ofsted-registered tech education company teaching 22,000+ young people real-world skills across robotics, coding, AI, cyber security, 3D printing, and electronics. Our weekly courses, GCSE exam centre, and FTC competition teams run year-round from our flagship centre in Solihull and our franchise centre in Leicester.
            </p>
            <p className="text-[#05575c]/70 text-lg leading-relaxed mb-8">
              Holiday tech camps are where many Robocoders start their journey. If your child loves the camp, they can continue with weekly Studio Lab courses and work toward BCS qualifications and early GCSEs.
            </p>
            <a
              href="https://robocode.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-8 py-3 rounded-2xl font-bold text-sm text-[#003439] bg-[#83fdff] hover:bg-[#00dcde] transition-colors"
            >
              Explore robocode.uk
            </a>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/camp/rc-47.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#003439]/90" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white mb-6 leading-tight">
              GIVE YOUR CHILD AN EASTER OF BUILDING, THINKING, AND IMPROVING
            </h2>
            <p className="text-white/60 text-lg mb-4">
              Not just playing. Not just watching. Not just scrolling.
            </p>
            <p className="text-[#83fdff] font-semibold mb-10">Book their place now before it&apos;s gone.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book/haf"
                className="px-10 py-4 rounded-2xl font-bold text-lg text-[#003439] bg-[#00dcde] hover:bg-[#83fdff] transition-all duration-300 shadow-[0_0_30px_rgba(0,220,222,0.3)]"
              >
                Book HAF Camp (Free)
              </Link>
              <Link
                href="/book/paid"
                className="px-10 py-4 rounded-2xl font-bold text-lg text-white border-2 border-[#ff00bf] hover:bg-[#ff00bf]/15 transition-all duration-300"
              >
                Book Paid Camp
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#003439] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/mascot.png" alt="Robocode" width={32} height={32} />
                <span className="font-heading text-white text-sm">ROBOCODE</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-4">
                Teaching tomorrow&apos;s skills, today. Hands-on tech education for ages 6–17. Ofsted-registered. 22,000+ Robocoders taught.
              </p>
              <div className="flex gap-3">
                <a href="https://instagram.com/RobocodeOfficial" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://facebook.com/RobocodeOfficial" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Facebook">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.126-5.864 10.126-11.854z"/></svg>
                </a>
                <a href="https://youtube.com/@RobocodeUK" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="YouTube">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white text-xs mb-4 tracking-wider">QUICK LINKS</h4>
              <div className="space-y-2">
                <Link href="/book/haf" className="block text-white/50 hover:text-white text-sm transition-colors">Book HAF Camp (Free)</Link>
                <Link href="/book/paid" className="block text-white/50 hover:text-white text-sm transition-colors">Book Paid Camp</Link>
                <a href="https://robocode.uk" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white text-sm transition-colors">robocode.uk</a>
                <a href="https://robocode.uk/franchise" target="_blank" rel="noopener noreferrer" className="block text-white/50 hover:text-white text-sm transition-colors">Franchise Opportunities</a>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white text-xs mb-4 tracking-wider">CONTACT</h4>
              <div className="space-y-2 text-white/50 text-sm">
                <p>info@robocode.uk</p>
                <p>0121 661 9222</p>
                <p>The Exchange, 26 Haslucks Green Road, Shirley, B90 2EL</p>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white text-xs mb-4 tracking-wider">ACCREDITATIONS</h4>
              <div className="space-y-2 text-white/50 text-sm">
                <p>Ofsted Registered</p>
                <p>JCQ Exam Centre</p>
                <p>BCS Certified</p>
                <p>Matrix Accredited</p>
                <p>SEND-Friendly</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} RobocodeUK Limited (Company #14161031). All Rights Reserved.</p>
            <Link href="/superadmin" className="text-white/20 hover:text-white/40 text-xs transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
