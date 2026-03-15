'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from 'motion/react';
import Lenis from 'lenis';
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  Menu,
  X,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Utensils,
  Wrench,
  Activity,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bell,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import clsx from 'clsx';

/* ─── smooth scroll ─── */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
}

/* ─── shared primitives ─── */
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── data ─── */
const NAV_LINKS = [
  { label: 'Locations', href: '#locations' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'What to Expect', href: '#activities' },
  { label: 'Reviews', href: '#reviews' },
];

const LOCATION_IMAGES: Record<string, string> = {
  'robocode centre': '/camp/location-shirley-centre.jpg',
  'robocode shirley': '/camp/location-shirley-centre.jpg',
  'shirley': '/camp/location-shirley-centre.jpg',
  'solihull': '/camp/location-shirley-centre.jpg',
  'kingshurst': '/camp/location-kingshurst.jpg',
  'tudor grange': '/camp/location-kingshurst.jpg',
  'birmingham city': '/camp/location-bcu.jpg',
  'bcu': '/camp/location-bcu.jpg',
  'curzon': '/camp/location-bcu.jpg',
};

function getLocationImage(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, src] of Object.entries(LOCATION_IMAGES)) {
    if (lower.includes(key)) return src;
  }
  return '/camp/location-shirley-centre.jpg';
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function summariseDates(dateStrings: string[]): { summary: string; totalDays: number } {
  if (dateStrings.length === 0) return { summary: '', totalDays: 0 };
  const dates = dateStrings
    .map((s) => new Date(s))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return { summary: '', totalDays: 0 };

  const runs: Date[][] = [];
  let run: Date[] = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    const gap = Math.round((dates[i].getTime() - run[run.length - 1].getTime()) / 86400000);
    if (gap === 1) {
      run.push(dates[i]);
    } else {
      runs.push(run);
      run = [dates[i]];
    }
  }
  runs.push(run);

  const groups: Date[][][] = [[runs[0]]];
  for (let i = 1; i < runs.length; i++) {
    const lastGroup = groups[groups.length - 1];
    const lastRun = lastGroup[lastGroup.length - 1];
    const gap = Math.round((runs[i][0].getTime() - lastRun[lastRun.length - 1].getTime()) / 86400000);
    const sameLen = lastRun.length === runs[i].length;
    const sameDow = lastRun[0].getUTCDay() === runs[i][0].getUTCDay();
    if (gap >= 2 && gap <= 5 && sameLen && sameDow) {
      lastGroup.push(runs[i]);
    } else {
      groups.push([runs[i]]);
    }
  }

  const parts = groups.map((group) => {
    const allDates = group.flat();
    const first = allDates[0];
    const last = allDates[allDates.length - 1];
    if (allDates.length === 1) {
      return `${DAY_SHORT[first.getUTCDay()]} ${first.getUTCDate()} ${MONTH_SHORT[first.getUTCMonth()]}`;
    }
    const dows = [...new Set(allDates.map((d) => d.getUTCDay()))].sort((a, b) => a - b);
    const dowStr = dows.length === 1
      ? DAY_SHORT[dows[0]]
      : `${DAY_SHORT[dows[0]]}–${DAY_SHORT[dows[dows.length - 1]]}`;
    const sameMonth = first.getUTCMonth() === last.getUTCMonth();
    if (sameMonth) {
      return `${dowStr}, ${first.getUTCDate()}–${last.getUTCDate()} ${MONTH_SHORT[first.getUTCMonth()]}`;
    }
    return `${dowStr}, ${first.getUTCDate()} ${MONTH_SHORT[first.getUTCMonth()]} – ${last.getUTCDate()} ${MONTH_SHORT[last.getUTCMonth()]}`;
  });

  return { summary: parts.join(' & '), totalDays: dates.length };
}

interface ApiLocation {
  id: string;
  name: string;
  slug: string;
  address: string;
  region: string;
  imageUrl: string | null;
  camps: {
    allowsHaf: boolean;
    allowsPaid: boolean;
    campDays: { id: string; date: string }[];
  }[];
}

interface LocationDisplay {
  name: string;
  slug: string;
  tag: string;
  address: string;
  dates: string;
  days: string;
  time: string;
  haf: boolean;
  paid: boolean;
  img: string;
}

function toLocationDisplay(loc: ApiLocation): LocationDisplay {
  const allDays = loc.camps.flatMap((c) => c.campDays.map((d) => d.date));
  const { summary, totalDays } = summariseDates(allDays);
  return {
    name: loc.name,
    slug: loc.slug || loc.name.toLowerCase().replace(/\s+/g, '-'),
    tag: loc.region === 'solihull' ? 'Solihull' : loc.region === 'birmingham' ? 'Birmingham' : loc.region.charAt(0).toUpperCase() + loc.region.slice(1),
    address: loc.address,
    dates: summary,
    days: `${totalDays} day${totalDays !== 1 ? 's' : ''}`,
    time: '10:00 AM – 2:00 PM',
    haf: loc.camps.some((c) => c.allowsHaf),
    paid: loc.camps.some((c) => c.allowsPaid),
    img: loc.imageUrl || getLocationImage(loc.name),
  };
}

const TESTIMONIALS = [
  {
    quote:
      'My son has been attending Robocode for a few months now and absolutely loves it. The teachers are brilliant, patient, knowledgeable, and really engaging.',
    name: 'Sarah M.',
    detail: 'Parent, Solihull',
  },
  {
    quote:
      'The holiday camp was fantastic. My daughter came home buzzing every day, talking about robots and circuits. She\'s already asking when the next one is!',
    name: 'David T.',
    detail: 'Parent, Birmingham',
  },
  {
    quote:
      'As a parent of an autistic child I was worried, but the staff were incredible. They adapted activities and my son thrived. Truly inclusive.',
    name: 'Priya K.',
    detail: 'Parent, Solihull',
  },
];

interface PricingRow {
  days: string;
  price: number;
  perDay: string;
  save: string | null;
  badge: string | null;
}

function buildPricingRows(tiers: { days: number; pricePence: number }[]): PricingRow[] {
  const sorted = [...tiers].sort((a, b) => a.days - b.days);
  const singleDayRate = sorted.find((t) => t.days === 1);
  const basePerDay = singleDayRate ? singleDayRate.pricePence : sorted[0]?.pricePence ?? 0;
  const maxDays = Math.max(...sorted.map((t) => t.days));

  return sorted.map((t) => {
    const pounds = t.pricePence / 100;
    const perDay = t.pricePence / t.days / 100;
    const fullPrice = basePerDay * t.days;
    const saving = fullPrice - t.pricePence;
    const perDayStr = perDay % 1 === 0 ? `£${perDay}` : `£${perDay.toFixed(2)}`;

    return {
      days: `${t.days} day${t.days !== 1 ? 's' : ''}`,
      price: pounds % 1 === 0 ? pounds : Number(pounds.toFixed(2)),
      perDay: perDayStr,
      save: saving > 0 ? `£${saving / 100}` : null,
      badge: t.days === maxDays && sorted.length > 1 ? 'Best Value' : null,
    };
  });
}

const FALLBACK_PRICING: PricingRow[] = buildPricingRows([
  { days: 1, pricePence: 2500 },
  { days: 2, pricePence: 4000 },
  { days: 4, pricePence: 7500 },
  { days: 8, pricePence: 14000 },
]);

const MARQUEE_IMAGES = [
  '/camp/marquee-arduino-smile.jpg',
  '/camp/marquee-girl-robot.jpg',
  '/camp/marquee-vr.jpg',
  '/camp/marquee-racing-sim.jpg',
  '/camp/marquee-girls-collab.jpg',
  '/camp/marquee-scratch.jpg',
  '/camp/marquee-table-tennis.jpg',
  '/camp/marquee-kids-building.jpg',
  '/camp/marquee-3d-printer.jpg',
  '/camp/marquee-coding.jpg',
  '/camp/marquee-3d-print-show.jpg',
  '/camp/marquee-electronics-help.jpg',
  '/camp/marquee-chess.jpg',
];

/* ─── notify signup form ─── */
const UK_REGIONS = [
  'Bath and North East Somerset','Bedford','Birmingham','Blackburn with Darwen','Blackpool',
  'Bolton','Bournemouth, Christchurch and Poole','Bradford','Brighton and Hove','Bristol',
  'Buckinghamshire','Bury','Calderdale','Cambridgeshire','Central Bedfordshire',
  'Cheshire East','Cheshire West and Chester','Cornwall','County Durham','Coventry',
  'Cumbria','Darlington','Derby','Derbyshire','Devon','Doncaster','Dorset','Dudley',
  'East Riding of Yorkshire','East Sussex','Essex','Gateshead','Gloucestershire',
  'Greater Manchester','Hackney','Halton','Hampshire','Hartlepool','Herefordshire',
  'Hertfordshire','Isle of Wight','Isles of Scilly','Kent','Kingston upon Hull',
  'Kirklees','Knowsley','Lancashire','Leeds','Leicester','Leicestershire',
  'Lincolnshire','Liverpool','London','Luton','Manchester','Medway',
  'Middlesbrough','Milton Keynes','Newcastle upon Tyne','Norfolk','North East Lincolnshire',
  'North Lincolnshire','North Somerset','North Tyneside','North Yorkshire',
  'Northamptonshire','Northumberland','Nottingham','Nottinghamshire','Oldham','Oxfordshire',
  'Peterborough','Plymouth','Portsmouth','Reading','Redcar and Cleveland',
  'Rochdale','Rotherham','Rutland','Salford','Sandwell','Sefton','Sheffield',
  'Shropshire','Slough','Solihull','Somerset','South Gloucestershire',
  'South Tyneside','Southampton','Southend-on-Sea','St Helens','Staffordshire',
  'Stockport','Stockton-on-Tees','Stoke-on-Trent','Suffolk','Sunderland','Surrey',
  'Swindon','Tameside','Telford and Wrekin','Thurrock','Torbay','Trafford',
  'Wakefield','Walsall','Warrington','Warwickshire','West Berkshire',
  'West Sussex','Westminster','Wigan','Wiltshire','Windsor and Maidenhead',
  'Wirral','Wokingham','Wolverhampton','Worcestershire','York',
];

function NotifyForm({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const filteredRegions = regionSearch
    ? UK_REGIONS.filter((r) => r.toLowerCase().includes(regionSearch.toLowerCase()))
    : UK_REGIONS;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: phone || undefined, region: region || undefined }),
      });
      if (res.ok) { setStatus('success'); setEmail(''); setPhone(''); setRegion(''); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 text-sm font-semibold ${variant === 'dark' ? 'text-cyan' : 'text-emerald-600'}`}>
        <Bell size={16} />
        You&apos;re on the list! We&apos;ll let you know when bookings open.
      </div>
    );
  }

  const isDark = variant === 'dark';
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-6 py-3 bg-cyan text-dark font-bold rounded-full text-sm tracking-wide hover:bg-cyan-light transition-colors whitespace-nowrap"
      >
        <Bell size={14} className="inline mr-1.5 -mt-0.5" />
        Notify Me
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/60 backdrop-blur-sm px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-dark/30 hover:text-dark transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <h3 className="font-[var(--font-display)] text-xl text-dark uppercase">
                Get Notified
              </h3>
              <p className="mt-2 text-dark/60 text-sm">
                Be the first to know when we announce new camp dates and open bookings.
              </p>

              <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address *"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm text-dark border border-dark/15 focus:border-cyan focus:ring-2 focus:ring-cyan/20 outline-none"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="w-full px-4 py-3 rounded-xl text-sm text-dark border border-dark/15 focus:border-cyan focus:ring-2 focus:ring-cyan/20 outline-none"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRegionPicker(!showRegionPicker)}
                    className={`w-full px-4 py-3 rounded-xl text-sm text-left border border-dark/15 transition-colors ${region ? 'text-dark' : 'text-dark/40'}`}
                  >
                    {region || 'Select your region (optional)'}
                  </button>
                  {showRegionPicker && (
                    <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <div className="p-2">
                        <input
                          type="text"
                          value={regionSearch}
                          onChange={(e) => setRegionSearch(e.target.value)}
                          placeholder="Search regions..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-cyan/20"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredRegions.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => { setRegion(r); setShowRegionPicker(false); setRegionSearch(''); }}
                            className={`w-full px-4 py-2 text-sm text-left text-dark hover:bg-gray-50 transition-colors ${region === r ? 'bg-[#edfffe] font-semibold' : ''}`}
                          >
                            {r}
                          </button>
                        ))}
                        {filteredRegions.length === 0 && (
                          <p className="px-4 py-2 text-sm text-gray-400">No regions found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full px-6 py-3 bg-cyan text-dark font-bold rounded-full text-sm tracking-wide hover:bg-cyan-light transition-colors disabled:opacity-60"
                >
                  {status === 'loading' ? 'Subscribing...' : 'Notify Me'}
                </button>

                {status === 'error' && <p className="text-red-500 text-xs text-center">Something went wrong. Try again.</p>}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── page ─── */
export default function CampsPage() {
  useLenis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>(FALLBACK_PRICING);
  const [seasonTitle, setSeasonTitle] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationDisplay[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    fetch('/api/pricing')
      .then((r) => r.json())
      .then((tiers: { days: number; pricePence: number }[]) => {
        if (Array.isArray(tiers) && tiers.length > 0) {
          setPricingRows(buildPricingRows(tiers));
        }
      })
      .catch(() => {});
    fetch('/api/season')
      .then((r) => r.json())
      .then((s: { title: string; endDate?: string | null }) => {
        if (s?.title) setSeasonTitle(s.title);
        if (s?.endDate) setSeasonEndDate(s.endDate);
      })
      .catch(() => {});
    fetch('/api/locations')
      .then((r) => r.json())
      .then((locs: ApiLocation[]) => {
        if (Array.isArray(locs)) setLocations(locs.map(toLocationDisplay));
      })
      .catch(() => {})
      .finally(() => setDataLoaded(true));
  }, []);

  const seasonExpired = Boolean(seasonEndDate && new Date(seasonEndDate) < new Date());

  const regionOptions = Array.from(new Set(locations.map((l) => l.tag))).sort();
  const filteredLocations = locations.filter((loc) => {
    if (regionFilter !== 'all' && loc.tag !== regionFilter) return false;
    if (typeFilter === 'haf' && !loc.haf) return false;
    if (typeFilter === 'paid' && !loc.paid) return false;
    return true;
  });

  return (
    <>
      {/* ───────── NAVBAR ───────── */}
      <Navbar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main>
        {/* ───────── HERO ───────── */}
        <section
          ref={heroRef}
          className="relative h-screen min-h-[600px] flex items-center overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 z-0"
            style={{ y: heroImgY }}
          >
            <Image
              src="/camp/hero-teacher-drone-demo.jpg"
              alt="Teacher demonstrating drone technology to students at Robocode camp"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark/85 via-dark/60 to-dark/30" />
          </motion.div>

          <motion.div
            style={{ opacity: heroOpacity }}
            className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10"
          >
            <div className="max-w-2xl">
              <h1 className="font-[var(--font-display)] text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.05] tracking-tight text-white uppercase">
                <span className="block">Holiday</span>
                <span className="block bg-gradient-to-r from-cyan via-pink to-orange bg-clip-text text-transparent animate-gradient">Tech Camps</span>
                <span className="block">{seasonTitle || 'Holiday Camp'}</span>
              </h1>

              <p className="mt-4 text-xl md:text-2xl text-white/90 font-[var(--font-body)] font-semibold max-w-md">
                Do something new this holiday.
              </p>
              <p className="mt-3 text-lg md:text-xl text-white/70 font-[var(--font-body)] max-w-md">
                Robotics, coding, AI, 3D printing and more for <span className="whitespace-nowrap">ages 6–17.</span>
              </p>

              {!dataLoaded ? (
                <div className="mt-8 h-14" />
              ) : seasonExpired ? (
                <div className="mt-8">
                  <p className="text-white/70 text-sm mb-4">
                    {seasonTitle
                      ? `${seasonTitle} has ended. Join our mailing list to hear about the next camp!`
                      : 'Our next camp is coming soon. Sign up to be the first to know!'}
                  </p>
                  <NotifyForm variant="dark" />
                </div>
              ) : (
                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link
                    href="/book/haf"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-8 py-4 bg-cyan text-dark font-bold rounded-full text-base tracking-wide hover:bg-cyan-light transition-colors shadow-lg shadow-cyan/20"
                  >
                    Book Free Place (HAF)
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/book/paid"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-8 py-4 bg-pink text-white font-bold rounded-full text-base tracking-wide hover:bg-pink-light transition-colors shadow-lg shadow-pink/20"
                  >
                    Book Paid Camp
                    <ArrowRight size={18} />
                  </Link>
                </div>
              )}

              <p className="mt-10 text-[13px] text-white/50 tracking-wide font-[var(--font-body)] uppercase font-bold">
                <span className="text-cyan">Ofsted Registered</span> &nbsp;·&nbsp; <span className="text-pink-light">22,000+ Robocoders</span>
                &nbsp;·&nbsp; <span className="text-orange">FTC Champions</span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* ───────── SOCIAL PROOF STRIP ───────── */}
        <section className="bg-[#edfffe] border-t-2 border-cyan/30">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-8 md:gap-14">
            <span className="text-[13px] uppercase tracking-wider font-[var(--font-body)]">
              <span className="text-[#00adb3] font-bold text-lg">22,000+</span>
              <span className="text-dark/50 ml-1.5">Robocoders</span>
            </span>
            <div className="hidden sm:block w-px h-6 bg-dark/10" />
            <div className="flex items-center gap-2.5">
              <Image src="/logos/microsoft-education.png" alt="Microsoft Education Partner" width={40} height={40} className="h-9 w-auto" />
              <span className="text-[13px] uppercase tracking-wider font-[var(--font-body)] text-dark/50">Microsoft Education Partner</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-dark/10" />
            <div className="flex items-center gap-2.5">
              <Image src="/logos/ofsted.png" alt="Ofsted Registered" width={80} height={35} className="h-9 w-auto" />
              <span className="text-[13px] uppercase tracking-wider font-[var(--font-body)] text-dark/50">Registered</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-dark/10" />
            <span className="text-[13px] uppercase tracking-wider font-[var(--font-body)] text-dark/50">
              <span className="text-orange font-bold">FTC Champions</span>
            </span>
          </div>
        </section>

        {/* ───────── ACCREDITATION LOGOS (under fold, scrolling) ───────── */}
        <section className="bg-white border-b border-dark/5 overflow-hidden">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-dark/40 pt-6 pb-2">Our Partners</p>
          <div className="py-4">
            <div className="animate-logo-scroll flex items-center gap-20 md:gap-28">
              {[...Array(6)].flatMap((_, setIdx) =>
                [
                  { src: '/logos/ofsted.png', alt: 'Ofsted Registered', w: 120, h: 50 },
                  { src: '/logos/microsoft-education.png', alt: 'Microsoft Education Partner', w: 70, h: 70 },
                  { src: '/logos/jcq.png', alt: 'JCQ Exam Centre', w: 160, h: 50 },
                  { src: '/logos/bcs.png', alt: 'BCS Approved Centre', w: 60, h: 70 },
                  { src: '/logos/matrix.png', alt: 'Matrix Quality Standard', w: 160, h: 50 },
                  { src: '/logos/first-tech-challenge.png', alt: 'FIRST Tech Challenge', w: 100, h: 60 },
                  { src: '/logos/aqa.svg', alt: 'AQA Exam Board', w: 100, h: 40 },
                  { src: '/logos/wjec.png', alt: 'WJEC CBAC', w: 80, h: 70 },
                  { src: '/logos/ukri-innovateuk.png', alt: 'Innovate UK', w: 110, h: 50 },
                ].map((logo) => (
                  <Image
                    key={`${setIdx}-${logo.alt}`}
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.w}
                    height={logo.h}
                    className="h-10 md:h-12 w-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* ───────── LOCATIONS ───────── */}
        <section id="locations" className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <Reveal>
              <p className="text-orange font-semibold text-sm tracking-wider uppercase font-[var(--font-body)]">
                Locations
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-4xl text-dark uppercase">
                Our venues
              </h2>
            </Reveal>

            <Reveal className="mt-6">
              <div className="bg-cyan-50 border-2 border-cyan/25 rounded-xl p-6 text-sm text-dark/80">
                <strong className="text-dark text-base">HAF eligibility:</strong>{' '}
                Free places are funded by the Holiday Activities & Food programme.
                Children must live or attend school in the relevant council
                area ({regionOptions.length > 0 ? regionOptions.join(' or ') : 'your local council area'}). A valid HAF code is required at booking.
              </div>
            </Reveal>

            {locations.length > 1 && (
              <Reveal className="mt-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-dark/40 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={13} /> Filter
                  </span>

                  <div className="relative">
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="appearance-none bg-white border border-dark/10 rounded-full pl-4 pr-9 py-2 text-sm font-medium text-dark cursor-pointer hover:border-cyan/50 focus:border-cyan focus:ring-2 focus:ring-cyan/20 outline-none transition-all"
                    >
                      <option value="all">All regions</option>
                      {regionOptions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="appearance-none bg-white border border-dark/10 rounded-full pl-4 pr-9 py-2 text-sm font-medium text-dark cursor-pointer hover:border-cyan/50 focus:border-cyan focus:ring-2 focus:ring-cyan/20 outline-none transition-all"
                    >
                      <option value="all">All types</option>
                      <option value="haf">HAF Free</option>
                      <option value="paid">Paid</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                  </div>

                  {(regionFilter !== 'all' || typeFilter !== 'all') && (
                    <button
                      onClick={() => { setRegionFilter('all'); setTypeFilter('all'); }}
                      className="text-xs font-semibold text-cyan hover:text-cyan-light transition-colors"
                    >
                      Clear filters
                    </button>
                  )}

                  <span className="ml-auto text-xs text-dark/30 font-medium">
                    {filteredLocations.length} of {locations.length} venue{locations.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </Reveal>
            )}

            <div className={`${locations.length > 1 ? 'mt-5' : 'mt-8'} space-y-6`}>
              {filteredLocations.length > 0 ? filteredLocations.map((loc, i) => (
                <Reveal key={loc.name} delay={i * 0.1}>
                  <div className="grid md:grid-cols-[2fr_3fr] gap-0 border-2 border-dark/10 rounded-2xl overflow-hidden hover:border-cyan/40 transition-colors shadow-sm hover:shadow-md">
                    <div className="relative aspect-[4/3] md:aspect-auto min-h-[220px]">
                      <Image
                        src={loc.img}
                        alt={`${loc.name} venue for Robocode camp`}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width:768px) 100vw, 40vw"
                      />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-2.5 mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-white bg-dark px-3 py-1.5 rounded-full">
                          {loc.tag}
                        </span>
                        {loc.haf && (
                          <span className="text-xs font-bold uppercase tracking-wider text-white bg-emerald-500 px-3 py-1.5 rounded-full">
                            HAF Free
                          </span>
                        )}
                        {loc.paid && (
                          <span className="text-xs font-bold uppercase tracking-wider text-white bg-pink px-3 py-1.5 rounded-full">
                            Paid
                          </span>
                        )}
                      </div>

                      <h3 className="font-[var(--font-body)] text-xl md:text-2xl font-bold text-dark">
                        {loc.name}
                      </h3>

                      <div className="mt-4 space-y-2 text-sm text-dark/80">
                        <p className="flex items-center gap-2.5 font-medium">
                          <MapPin size={16} className="text-cyan shrink-0" />
                          {loc.address}
                        </p>
                        <p className="flex items-center gap-2.5 font-bold">
                          <Calendar size={16} className="text-pink shrink-0" />
                          {loc.dates}
                        </p>
                        <p className="flex items-center gap-2.5 font-medium">
                          <Clock size={16} className="text-orange shrink-0" />
                          {loc.time}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-2">
                        {seasonExpired ? (
                          <>
                            {loc.haf && (
                              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-400 text-sm font-bold rounded-full cursor-not-allowed">
                                Book Free (HAF)
                              </span>
                            )}
                            {loc.paid && (
                              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-400 text-sm font-bold rounded-full cursor-not-allowed">
                                Book Paid
                              </span>
                            )}
                            <span className="text-xs text-dark/40 font-medium italic">Bookings closed</span>
                          </>
                        ) : (
                          <>
                            {loc.haf && (
                              <Link
                                href={`/book/haf?location=${loc.slug}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-full hover:bg-emerald-600 transition-colors"
                              >
                                Book Free (HAF) <ChevronRight size={14} />
                              </Link>
                            )}
                            {loc.paid && (
                              <Link
                                href={`/book/paid?location=${loc.slug}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink text-white text-sm font-bold rounded-full hover:bg-pink-light transition-colors"
                              >
                                Book Paid <ChevronRight size={14} />
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )) : dataLoaded ? (
                <Reveal>
                  {locations.length > 0 && filteredLocations.length === 0 ? (
                    <div className="border-2 border-dashed border-dark/10 rounded-2xl p-10 text-center">
                      <SlidersHorizontal size={32} className="mx-auto text-dark/15 mb-3" />
                      <h3 className="font-[var(--font-body)] text-lg font-bold text-dark mb-1">
                        No venues match your filters
                      </h3>
                      <p className="text-dark/50 text-sm mb-4">
                        Try a different region or booking type.
                      </p>
                      <button
                        onClick={() => { setRegionFilter('all'); setTypeFilter('all'); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan text-dark text-sm font-bold rounded-full hover:bg-cyan-light transition-colors"
                      >
                        Show all venues
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-dark/10 rounded-2xl p-10 md:p-14 text-center">
                      <Calendar size={40} className="mx-auto text-dark/15 mb-4" />
                      <h3 className="font-[var(--font-body)] text-xl font-bold text-dark mb-2">
                        {seasonExpired ? 'No active camps right now' : 'Venues coming soon'}
                      </h3>
                      <p className="text-dark/60 text-sm max-w-md mx-auto mb-6">
                        {seasonExpired
                          ? `${seasonTitle || 'Our last camp'} has ended. We're working on the next one! Sign up to get notified when new dates are announced.`
                          : `We're finalising venues for ${seasonTitle || 'our next camp'}. Check back soon or sign up for updates.`}
                      </p>
                      <div className="flex justify-center">
                        <NotifyForm variant="light" />
                      </div>
                    </div>
                  )}
                </Reveal>
              ) : null}
            </div>

          </div>
        </section>

        {/* ───────── PRICING ───────── */}
        <section id="pricing" className="bg-white">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
            <Reveal>
              <p className="text-pink font-semibold text-sm tracking-wider uppercase font-[var(--font-body)] text-center">
                Pricing
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-4xl text-dark uppercase text-center">
                Paid camp packages
              </h2>
              <p className="mt-4 text-dark-mid/60 text-center text-sm">
                Solihull centre only. Prices per family, and days can be shared
                across siblings.
              </p>
            </Reveal>

            <Reveal className="mt-10">
              <div className={`grid gap-4 ${pricingRows.length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-lg mx-auto' : 'grid-cols-2 md:grid-cols-4'}`}>
                {pricingRows.map((p) => (
                  <div
                    key={p.days}
                    className={clsx(
                      'relative rounded-2xl p-6 text-center border-2 transition-shadow hover:shadow-md',
                      p.badge === 'Best Value'
                        ? 'border-cyan bg-gradient-to-br from-[#edfffe] to-[#fff0fd] shadow-md'
                        : 'border-dark/10 bg-white'
                    )}
                  >
                    {p.badge === 'Best Value' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-cyan text-dark px-3 py-1 rounded-full">
                        Best Value
                      </span>
                    )}
                    <p className="text-dark/60 text-sm font-semibold uppercase tracking-wide">{p.days}</p>
                    <p className="mt-2 text-4xl font-bold text-dark">£{p.price}</p>
                    <p className="mt-1 text-dark/40 text-sm">{p.perDay}/day</p>
                    {p.save && (
                      <span className={clsx(
                        'inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full',
                        p.badge === 'Best Value'
                          ? 'text-white bg-pink'
                          : 'text-pink bg-pink/10'
                      )}>
                        Save {p.save}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-dark-mid/50">
                Childcare vouchers accepted. All staff are DBS Enhanced checked.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                {seasonExpired ? (
                  <>
                    <span className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-200 text-gray-400 font-semibold rounded-full text-sm cursor-not-allowed">
                      Bookings closed
                    </span>
                  </>
                ) : (
                  <>
                    <Link
                      href="/book/paid"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-pink text-white font-semibold rounded-full text-sm hover:bg-pink-light transition-colors"
                    >
                      Book Paid Camp <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/book/haf"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-cyan text-dark font-semibold rounded-full text-sm hover:bg-cyan-light transition-colors"
                    >
                      Book Free Place (HAF) <ArrowRight size={16} />
                    </Link>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ───────── INTRO + IMAGE ───────── */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-[45fr_55fr] gap-12 md:gap-16 items-center">
            <Reveal>
              <p className="text-pink font-semibold text-sm tracking-wider uppercase font-[var(--font-body)]">
                Turn screen time into build time
              </p>
              <h2 className="mt-3 font-[var(--font-body)] text-3xl md:text-4xl font-semibold text-dark leading-snug">
                Build something real every day
              </h2>
              <p className="mt-5 text-dark-mid/80 text-lg leading-relaxed">
                From robot battles to 3D-printed creations, every session is
                hands-on and project-driven. Robocoders rotate through activities
                including robotics, electronics, AI, game dev and mechanical
                engineering, and finish the day with something they built
                themselves.
              </p>
              {seasonExpired ? (
                <span className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 font-bold text-sm rounded-full border-2 border-gray-200 cursor-not-allowed">
                  Bookings closed
                </span>
              ) : (
                <Link
                  href="/book/haf"
                  className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-cyan/10 text-dark font-bold text-sm rounded-full border-2 border-cyan/30 hover:bg-cyan/20 hover:border-cyan/50 transition-all"
                >
                  Book a place <ArrowRight size={16} />
                </Link>
              )}
            </Reveal>

            <Reveal delay={0.15}>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl ring-1 ring-dark/5">
                <Image
                  src="/camp/intro-centre-overview.jpg"
                  alt="Inside the Robocode centre with arcade games, mural and activity areas"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:768px) 100vw, 55vw"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <div className="h-1 bg-gradient-to-r from-cyan via-pink to-orange" />

        {/* ───────── ACTIVITIES ───────── */}
        <section id="activities" className="bg-surface">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <Reveal>
              <p className="text-pink font-semibold text-sm tracking-wider uppercase font-[var(--font-body)]">
                What to Expect
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-4xl text-dark uppercase">
                What your child will do
              </h2>
              <p className="mt-4 text-sm text-dark/50 italic">
                Activity availability may vary depending on the camp location and equipment on site.
              </p>
            </Reveal>

            <div className="mt-14 grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Robotics',
                  desc: 'Build, program and battle autonomous robots using competition-grade kits. From sensor arrays to motor control, Robocoders learn real engineering.',
                  img: '/camp/activity-robotics.jpg',
                  alt: 'Instructor and student examining a completed robot car at Robocode',
                  color: 'border-cyan',
                },
                {
                  title: 'Game Development',
                  desc: 'Design characters, build levels and code game logic. Robocoders create a playable game using industry-standard tools and creative problem solving.',
                  img: '/camp/activity-game-dev-new.jpg',
                  alt: 'Student at a racing simulator station at Robocode centre',
                  color: 'border-pink',
                },
                {
                  title: '3D Printing',
                  desc: 'Sketch it, model it, print it, take it home. Robocoders design in CAD software and watch their creations come to life on our Bambu Lab printers.',
                  img: '/camp/activity-3d-printing.jpg',
                  alt: 'Colourful 3D printed objects on display at the Robocode centre',
                  color: 'border-orange',
                },
                {
                  title: 'Electronics',
                  desc: 'Wire circuits, connect sensors and program microcontrollers. Hands-on Arduino projects that light up, move and respond to the real world.',
                  img: '/camp/activity-electronics.jpg',
                  alt: 'Student proudly showing off completed Arduino breadboard project',
                  color: 'border-cyan',
                },
                {
                  title: 'AI & Cyber Security',
                  desc: 'Understand the tech shaping the world. Hands-on AI projects and cyber security challenges, not just theory.',
                  img: '/camp/camp-rc-47.jpg',
                  alt: 'Student proudly holding up a completed electronics project',
                  color: 'border-pink',
                },
                {
                  title: 'Physical Activity',
                  desc: 'Movement, games and active play to keep energy up between sessions. Table tennis, team challenges and more.',
                  img: '/camp/activity-physical.jpg',
                  alt: 'Students playing table tennis during break time at Robocode',
                  color: 'border-orange',
                },
              ].map((a, i) => (
                <Reveal key={a.title} delay={i * 0.05}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-dark/5 hover:shadow-md transition-shadow">
                    <div className="relative aspect-square">
                      <Image
                        src={a.img}
                        alt={a.alt}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width:768px) 100vw, 50vw"
                      />
                    </div>
                    <div className={`p-6 border-l-4 ${a.color} ml-4`}>
                      <h3 className="font-[var(--font-body)] text-lg font-bold text-dark">
                        {a.title}
                      </h3>
                      <p className="mt-2 text-dark-mid/70 text-sm leading-relaxed">
                        {a.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-12">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {seasonExpired ? (
                  <>
                    <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-200 text-gray-400 font-semibold rounded-full text-sm tracking-wide cursor-not-allowed">
                      Book Free Place (HAF)
                    </span>
                    <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-200 text-gray-400 font-semibold rounded-full text-sm tracking-wide cursor-not-allowed">
                      Book Paid Camp
                    </span>
                    <span className="text-xs text-dark/40 font-medium italic">Bookings closed — sign up above to be notified</span>
                  </>
                ) : (
                  <>
                    <Link
                      href="/book/haf"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-cyan text-dark font-semibold rounded-full text-sm tracking-wide hover:bg-cyan-light transition-colors"
                    >
                      Book Free Place (HAF) <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/book/paid"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-pink text-white font-semibold rounded-full text-sm tracking-wide hover:bg-pink-light transition-colors"
                    >
                      Book Paid Camp <ArrowRight size={16} />
                    </Link>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ───────── WHAT'S INCLUDED ───────── */}
        <section className="bg-gradient-to-br from-[#fff0fd] via-[#edfffe] to-white">
          <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                {
                  icon: Utensils,
                  label: 'Hot meal + fruit & veg',
                  desc: 'Nutritious lunch (subject to availability)',
                  color: 'text-orange',
                },
                {
                  icon: Wrench,
                  label: 'All equipment included',
                  desc: 'Laptops, kits and materials',
                  color: 'text-[#00adb3]',
                },
                {
                  icon: Activity,
                  label: 'Physical activity',
                  desc: 'Sports and active play included',
                  color: 'text-pink',
                },
                {
                  icon: ShieldCheck,
                  label: 'Safe & supervised',
                  desc: 'Ofsted registered, DBS-checked staff',
                  color: 'text-[#00adb3]',
                },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="flex justify-center">
                    <item.icon size={28} className={item.color} />
                  </div>
                  <p className="mt-3 font-semibold text-sm text-dark">{item.label}</p>
                  <p className="mt-1 text-dark/50 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── PHOTO MARQUEE ───────── */}
        <section className="bg-[#edfffe] py-4 overflow-hidden">
          <div className="animate-marquee flex gap-4">
            {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((src, i) => (
              <div
                key={i}
                className="relative w-72 md:w-80 h-52 rounded-xl overflow-hidden shrink-0 ring-1 ring-dark/10 hover:ring-cyan/40 transition-all"
              >
                <Image
                  src={src}
                  alt="Robocode camp activity photo"
                  fill
                  className="object-cover object-top"
                  sizes="320px"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ───────── MID-PAGE CTA ───────── */}
        <section className="bg-surface">
          <div className="max-w-3xl mx-auto px-6 py-14 text-center">
            <Reveal>
              {dataLoaded && seasonExpired ? (
                <>
                  <p className="text-dark-mid/70 text-sm leading-relaxed">
                    Our next camp is on the way. Be the first to know when bookings open.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <NotifyForm variant="light" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-dark-mid/70 text-sm leading-relaxed">
                    Spaces fill up fast. Secure your child&apos;s place for {seasonTitle || 'camp'} today.
                  </p>
                  <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/book/haf"
                      className="inline-flex items-center gap-2 px-7 py-3 bg-cyan text-dark font-semibold rounded-full text-sm tracking-wide hover:bg-cyan-light transition-colors"
                    >
                      Book Free Place (HAF) <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/book/paid"
                      className="inline-flex items-center gap-2 px-7 py-3 bg-pink text-white font-semibold rounded-full text-sm tracking-wide hover:bg-pink-light transition-colors"
                    >
                      Book Paid Camp <ArrowRight size={16} />
                    </Link>
                  </div>
                </>
              )}
            </Reveal>
          </div>
        </section>

        {/* ───────── TESTIMONIALS ───────── */}
        <TestimonialCarousel />

        {/* ───────── ABOUT BRIDGE ───────── */}
        <section className="bg-gradient-to-br from-cyan-50 via-white to-pink/5">
          <div className="max-w-3xl mx-auto px-6 py-16 md:py-20 text-center">
            <Reveal>
              <h2 className="font-[var(--font-body)] text-2xl md:text-3xl font-semibold text-dark">
                More than a holiday camp
              </h2>
              <p className="mt-4 text-dark-mid/70 leading-relaxed">
                Robocode runs year-round tech education across robotics,
                coding, electronics, and 3D printing for ages 6–17. Our holiday
                camps are just one part of what we do.{' '}
                <a
                  href="https://robocode.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink font-semibold hover:underline"
                >
                  Visit robocode.uk →
                </a>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <FaqSection />

        {/* ───────── FINAL CTA ───────── */}
        <section className="relative py-28 md:py-36 overflow-hidden">
          <Image
            src="/camp/cta-mural.jpg"
            alt="Robocode mural Teaching Tomorrows Skills Today"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-dark/85 via-dark-mid/70 to-pink/20" />
          <div className="relative z-10 text-center px-6">
            <Reveal>
              {seasonExpired ? (
                <>
                  <h2 className="font-[var(--font-display)] text-3xl md:text-5xl text-white uppercase leading-tight">
                    Don&apos;t miss the
                    <br />
                    <span className="bg-gradient-to-r from-cyan via-pink-light to-orange bg-clip-text text-transparent">next camp</span>
                  </h2>
                  <p className="mt-4 text-white/60 text-sm max-w-md mx-auto">
                    Get notified as soon as we announce new dates and open bookings.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <NotifyForm variant="dark" />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-[var(--font-display)] text-3xl md:text-5xl text-white uppercase leading-tight">
                    Book their place for
                    <br />
                    <span className="bg-gradient-to-r from-cyan via-pink-light to-orange bg-clip-text text-transparent">{seasonTitle || 'Holiday Camp'}</span>
                  </h2>
                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <Link
                      href="/book/haf"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-cyan text-dark font-semibold rounded-full text-sm tracking-wide hover:bg-cyan-light transition-colors"
                    >
                      Book Free Place (HAF) <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/book/paid"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-pink text-white font-semibold rounded-full text-sm tracking-wide hover:bg-pink-light transition-colors"
                    >
                      Book Paid Camp <ArrowRight size={16} />
                    </Link>
                  </div>
                </>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      {/* ───────── FOOTER ───────── */}
      <footer className="bg-dark text-white/60 border-t-2 border-gradient-to-r from-cyan via-pink to-orange" style={{ borderImage: 'linear-gradient(to right, #00dcde, #ff00bf, #ff9752) 1' }}>
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10 text-sm">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/logo-brand.png"
              alt="Robocode logo"
              width={160}
              height={37}
              className="mb-4 h-9 w-auto"
            />
            <p className="text-white/40 text-xs leading-relaxed">
              Inspiring the next generation of innovators through hands-on
              technology education.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.instagram.com/robocode_official/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on Instagram"
                className="text-white/30 hover:text-pink transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/RobocodeOfficial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on Facebook"
                className="text-white/30 hover:text-cyan transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.youtube.com/@robocode_official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on YouTube"
                className="text-white/30 hover:text-orange transition-colors"
              >
                <Youtube size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@robocode_official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on TikTok"
                className="text-white/30 hover:text-pink transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.76a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.17z"/></svg>
              </a>
              <a
                href="https://www.linkedin.com/company/robocodeofficial"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on LinkedIn"
                className="text-white/30 hover:text-cyan transition-colors"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div>
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Quick Links
            </p>
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block py-1 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://robocode.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 hover:text-white transition-colors"
            >
              Main Website
            </a>
          </div>

          <div>
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Contact
            </p>
            <a
              href="tel:+441216619222"
              className="flex items-center gap-2 py-1 hover:text-white transition-colors"
            >
              <Phone size={13} /> 0121 661 9222
            </a>
            <a
              href="mailto:info@robocode.uk"
              className="flex items-center gap-2 py-1 hover:text-white transition-colors"
            >
              <Mail size={13} /> info@robocode.uk
            </a>
          </div>

          <div>
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Accreditations
            </p>
            <p className="py-1">Ofsted Registered</p>
            <p className="py-1">FIRST Tech Challenge</p>
            <p className="py-1">DBS Enhanced Checked</p>
            <p className="py-1">JCQ Exam Centre (AQA & WJEC)</p>
            <p className="py-1">BCS Accredited</p>
            <p className="py-1">Matrix Accredited</p>
            <p className="py-1">Microsoft Education Partner</p>
          </div>
        </div>

        <div className="border-t border-white/8 py-5 text-xs text-white/30 relative">
          <p className="text-center">© {new Date().getFullYear()} RobocodeUK Limited. Company No. 14161031. All rights reserved.</p>
          <Link href="/admin" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/5 hover:text-white/30 transition-colors text-[10px]">Admin</Link>
        </div>
      </footer>
    </>
  );
}

/* ─── Navbar ─── */
function Navbar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-dark/90 backdrop-blur-lg shadow-lg'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-brand.png"
            alt="Robocode"
            width={150}
            height={35}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors font-[var(--font-body)]"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/book/haf"
            className="px-5 py-2 bg-cyan text-dark text-sm font-semibold rounded-full hover:bg-cyan-light transition-colors"
          >
            Book Now
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-dark/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl"
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/80 hover:text-white text-sm font-medium font-[var(--font-body)] py-2.5 border-b border-white/5 last:border-0 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/book/haf"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 px-6 py-3 bg-cyan text-dark font-semibold rounded-full text-sm text-center"
              >
                Book Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── FAQ Section ─── */
const FAQ_ITEMS = [
  {
    q: 'What is HAF and who is it for?',
    a: 'The Holiday Activities and Food (HAF) programme provides free holiday camp places for children who receive benefits-related free school meals. You will need a valid HAF code from your council or school to book a free place.',
  },
  {
    q: 'What are the camp timings?',
    a: 'All sessions run 10:00 AM to 2:00 PM. Drop-off is from 9:45 AM and collection is at 2:00 PM sharp.',
  },
  {
    q: 'What activities are included?',
    a: 'Robocoders rotate through robotics, game development, 3D printing, electronics, AI and cyber security, and physical activity. Availability may vary by venue and equipment on site.',
  },
  {
    q: 'Is lunch provided?',
    a: 'A hot meal, fruit and vegetables are provided for HAF-funded places. Paid camp attendees may also receive meals (subject to availability). Please let us know about any dietary requirements or allergies at booking.',
  },
  {
    q: 'What about children with SEND or allergies?',
    a: 'We welcome all children. Our Mentors are experienced in supporting children with additional needs. Please provide details at booking so we can make the right adjustments.',
  },
  {
    q: 'Do I need to bring anything?',
    a: 'Just comfortable clothes, a water bottle, and curiosity. All tech equipment, laptops, kits and materials are provided.',
  },
  {
    q: 'How do I book?',
    a: 'Use the Book Free Place (HAF) button if you have a HAF code, or Book Paid Camp for paid places. The booking form takes about 5 minutes to complete.',
  },
];

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="bg-white border-t border-dark/5">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        <Reveal>
          <p className="text-orange font-semibold text-sm tracking-wider uppercase font-[var(--font-body)] text-center">
            FAQ
          </p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-4xl text-dark uppercase text-center">
            Common Questions
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={i} delay={i * 0.03}>
              <div className="border border-dark/8 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface/50 transition-colors"
                >
                  <span className="font-semibold text-dark text-sm pr-4">{item.q}</span>
                  {openIdx === i ? (
                    <ChevronUp size={18} className="text-dark/40 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-dark/40 shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-dark/60 text-sm leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonial Carousel ─── */
function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const t = TESTIMONIALS[idx];

  return (
    <section id="reviews" className="bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
        <Reveal>
          <p className="text-cyan font-semibold text-sm tracking-wider uppercase font-[var(--font-body)]">
            Reviews
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-dark/70"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span className="text-sm text-dark/50 font-medium">From Google Reviews</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-10 relative min-h-[200px]">
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[120px] leading-none font-serif text-pink/10 select-none pointer-events-none">
            &ldquo;
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <blockquote className="text-lg md:text-xl text-dark leading-relaxed italic font-[var(--font-body)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <p className="mt-6 font-semibold text-dark text-sm">
                {t.name}
              </p>
              <p className="text-dark-mid/50 text-xs">{t.detail}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`View testimonial ${i + 1}`}
              className={clsx(
                'w-2 h-2 rounded-full transition-all',
                i === idx ? 'bg-pink w-6' : 'bg-dark/15'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
