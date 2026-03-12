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
  Utensils,
  Wrench,
  Activity,
  ShieldCheck,
  ChevronRight,
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
  { label: 'What to Expect', href: '#activities' },
  { label: 'Locations', href: '#locations' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Pricing', href: '#pricing' },
];

const LOCATIONS = [
  {
    name: 'Robocode Shirley Centre',
    tag: 'Solihull',
    address: 'The Exchange, 26 Haslucks Green Rd, Shirley, B90 2EL',
    dates: 'Mon–Thu, 14–17 & 21–24 April',
    days: '8 days',
    time: '10:00 AM – 2:00 PM',
    haf: true,
    paid: true,
    img: '/camp/location-shirley-centre.jpg',
  },
  {
    name: 'Tudor Grange Academy Kingshurst',
    tag: 'Kingshurst',
    address: 'Cooks Lane, Fordbridge, B37 6NU',
    dates: 'Mon–Thu, 21–24 April',
    days: '4 days',
    time: '10:00 AM – 2:00 PM',
    haf: true,
    paid: false,
    img: '/camp/location-kingshurst.jpg',
  },
  {
    name: 'Birmingham City University',
    tag: 'Birmingham',
    address: 'Curzon Building, 4 Cardigan St, B4 7BD',
    dates: 'Tue–Fri, 14–18 & 21–25 April',
    days: '7 days',
    time: '10:00 AM – 2:00 PM',
    haf: true,
    paid: false,
    img: '/camp/location-bcu.jpg',
  },
];

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

const PRICING = [
  { days: '1 day', price: 25, perDay: '£25', save: null, badge: null },
  { days: '2 days', price: 40, perDay: '£20', save: '£10', badge: null },
  { days: '4 days', price: 75, perDay: '£18.75', save: '£25', badge: null },
  { days: '8 days', price: 140, perDay: '£17.50', save: '£60', badge: 'Best Value' },
];

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

/* ─── page ─── */
export default function CampsPage() {
  useLenis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

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
                <span className="block">Easter 2026</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-white/80 font-[var(--font-body)] max-w-md">
                Robotics, coding, 3D printing and more for ages 6–17.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book/haf"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-cyan text-dark font-bold rounded-full text-base tracking-wide hover:bg-cyan-light transition-colors shadow-lg shadow-cyan/20"
                >
                  Book Free Place (HAF)
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/book/paid"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-pink text-white font-bold rounded-full text-base tracking-wide hover:bg-pink-light transition-colors shadow-lg shadow-pink/20"
                >
                  Book Paid Camp
                  <ArrowRight size={18} />
                </Link>
              </div>

              <p className="mt-10 text-[13px] text-white/50 tracking-wide font-[var(--font-body)] uppercase">
                <span className="text-cyan">Ofsted Registered</span> &nbsp;·&nbsp; <span className="text-pink-light">22,000+ Students</span>
                &nbsp;·&nbsp; <span className="text-orange">FTC Champions</span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* ───────── SOCIAL PROOF STRIP ───────── */}
        <section className="bg-gradient-to-r from-dark via-dark-mid to-dark border-t-2 border-cyan/40">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap justify-center items-center gap-8 md:gap-14">
            <span className="text-[13px] uppercase tracking-wider font-[var(--font-body)]">
              <span className="text-cyan font-bold text-lg drop-shadow-[0_0_8px_rgba(0,210,211,0.5)]">22,000+</span>
              <span className="text-white/50 ml-1.5">Robocoders</span>
            </span>
            <div className="hidden md:block w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <Image src="/logos/microsoft-education.png" alt="Microsoft Education Partner" width={40} height={40} className="h-9 w-auto drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" />
              <span className="text-[13px] uppercase tracking-wider font-[var(--font-body)] text-white/50">Microsoft Education Partner</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <Image src="/logos/ofsted.png" alt="Ofsted Registered" width={80} height={35} className="h-9 w-auto drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" />
              <span className="text-[13px] uppercase tracking-wider font-[var(--font-body)] text-white/50">Registered</span>
            </div>
          </div>
        </section>

        {/* ───────── ACCREDITATION LOGOS (under fold, scrolling) ───────── */}
        <section className="bg-white border-b border-dark/5 overflow-hidden">
          <div className="py-6">
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

        {/* ───────── INTRO + IMAGE ───────── */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-[45fr_55fr] gap-12 md:gap-16 items-center">
            <Reveal>
              <h2 className="font-[var(--font-body)] text-3xl md:text-4xl font-semibold text-dark leading-snug">
                Build something real every day
              </h2>
              <p className="mt-5 text-dark-mid/80 text-lg leading-relaxed">
                From robot battles to 3D-printed creations, every session is
                hands-on and project-driven. Students rotate through activities
                including robotics, electronics, game dev and mechanical
                engineering, and finish the day with something they built
                themselves.
              </p>
              <Link
                href="/book/haf"
                className="mt-7 inline-flex items-center gap-2 px-6 py-3 bg-cyan/10 text-dark font-bold text-sm rounded-full border-2 border-cyan/30 hover:bg-cyan/20 hover:border-cyan/50 transition-all"
              >
                Book a place <ArrowRight size={16} />
              </Link>
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
                  desc: 'Build, program and battle autonomous robots using competition-grade kits. From sensor arrays to motor control, students learn real engineering.',
                  img: '/camp/activity-robotics.jpg',
                  alt: 'Instructor and student examining a completed robot car at Robocode',
                  color: 'border-cyan',
                },
                {
                  title: 'Game Development',
                  desc: 'Design characters, build levels and code game logic. Students create a playable game using industry-standard tools and creative problem solving.',
                  img: '/camp/activity-game-dev-new.jpg',
                  alt: 'Student at a racing simulator station at Robocode centre',
                  color: 'border-pink',
                },
                {
                  title: '3D Printing',
                  desc: 'Sketch it, model it, print it, take it home. Students design in CAD software and watch their creations come to life on our Bambu Lab printers.',
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
                  title: 'Mechanical Engineering',
                  desc: 'Design and construct mechanical builds. Students work with tools, materials and kits to solve engineering challenges as a team.',
                  img: '/camp/activity-mechanical.jpg',
                  alt: 'Students collaborating on building a robot together',
                  color: 'border-pink',
                },
                {
                  title: 'Physical Activity',
                  desc: 'One hour of movement and games every day. Table tennis, team challenges and active play to keep energy up between sessions.',
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
          </div>
        </section>

        {/* ───────── WHAT'S INCLUDED ───────── */}
        <section className="bg-gradient-to-r from-dark via-dark-mid to-dark text-white">
          <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                {
                  icon: Utensils,
                  label: 'Hot meal + fruit & veg',
                  desc: 'Nutritious lunch provided daily',
                  color: 'text-orange',
                },
                {
                  icon: Wrench,
                  label: 'All equipment included',
                  desc: 'Laptops, kits and materials',
                  color: 'text-cyan',
                },
                {
                  icon: Activity,
                  label: '1 hr physical activity',
                  desc: 'Sports and games every day',
                  color: 'text-pink-light',
                },
                {
                  icon: ShieldCheck,
                  label: 'Safe & supervised',
                  desc: 'Ofsted registered, DBS-checked staff',
                  color: 'text-cyan-light',
                },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="flex justify-center">
                    <item.icon size={28} className={item.color} />
                  </div>
                  <p className="mt-3 font-semibold text-sm">{item.label}</p>
                  <p className="mt-1 text-white/50 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── PHOTO MARQUEE ───────── */}
        <section className="bg-gradient-to-r from-dark via-dark-mid to-dark py-4 overflow-hidden">
          <div className="animate-marquee flex gap-4">
            {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((src, i) => (
              <div
                key={i}
                className="relative w-72 md:w-80 h-52 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10 hover:ring-cyan/40 transition-all"
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

        {/* ───────── LOCATIONS ───────── */}
        <section id="locations" className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <Reveal>
              <p className="text-orange font-semibold text-sm tracking-wider uppercase font-[var(--font-body)]">
                Locations
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-4xl text-dark uppercase">
                Three venues across the region
              </h2>
            </Reveal>

            <Reveal className="mt-6">
              <div className="bg-cyan-50 border-2 border-cyan/25 rounded-xl p-6 text-sm text-dark/80">
                <strong className="text-dark text-base">HAF eligibility:</strong>{' '}
                Free places are funded by the Holiday Activities & Food programme.
                Children must live or attend school in the relevant council
                area (Solihull or Birmingham). A valid HAF code is required at booking.
              </div>
            </Reveal>

            <div className="mt-8 space-y-6">
              {LOCATIONS.map((loc, i) => (
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
                        <p className="flex items-center gap-2.5 font-medium">
                          <Calendar size={16} className="text-pink shrink-0" />
                          {loc.dates}
                        </p>
                        <p className="flex items-center gap-2.5 font-medium">
                          <Clock size={16} className="text-orange shrink-0" />
                          {loc.time}
                        </p>
                      </div>

                      <div className="mt-6">
                        <Link
                          href={loc.haf ? '/book/haf' : '/book/paid'}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan text-dark text-sm font-bold rounded-full hover:bg-cyan-light transition-colors"
                        >
                          Book this location <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </section>

        {/* ───────── TESTIMONIALS ───────── */}
        <TestimonialCarousel />

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
              <div className="border border-dark/8 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-dark/8 text-xs text-dark-mid/50 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Package</th>
                      <th className="px-5 py-3 font-semibold">Price</th>
                      <th className="px-5 py-3 font-semibold hidden sm:table-cell">
                        Per day
                      </th>
                      <th className="px-5 py-3 font-semibold text-right">Saving</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING.map((p) => (
                      <tr
                        key={p.days}
                        className={clsx(
                          'border-b border-dark/5 last:border-0 transition-colors',
                          p.badge === 'Best Value' && 'bg-gradient-to-r from-cyan-50 to-pink/5 border-l-4 border-l-cyan'
                        )}
                      >
                        <td className="px-5 py-4 font-semibold text-dark">
                          {p.badge === 'Best Value' && (
                            <span className="block text-[10px] text-cyan font-bold uppercase tracking-wider mb-0.5">
                              Best Value
                            </span>
                          )}
                          {p.days}
                        </td>
                        <td className="px-5 py-4 font-semibold text-dark text-lg">
                          £{p.price}
                        </td>
                        <td className="px-5 py-4 text-dark-mid/60 text-sm hidden sm:table-cell">
                          {p.perDay}/day
                        </td>
                        <td className="px-5 py-4 text-right">
                          {p.save && (
                            <span className={clsx(
                              'text-xs font-bold px-2.5 py-1 rounded-full',
                              p.badge === 'Best Value'
                                ? 'text-white bg-pink'
                                : 'text-pink bg-pink/10'
                            )}>
                              Save {p.save}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-center text-xs text-dark-mid/50">
                Childcare vouchers accepted. All staff are DBS Enhanced checked.
              </p>

              <div className="mt-6 text-center">
                <Link
                  href="/book/paid"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-pink text-white font-semibold rounded-full text-sm hover:bg-pink-light transition-colors"
                >
                  Book Paid Camp <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

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

        {/* ───────── ACCREDITATIONS ───────── */}
        <section className="bg-white border-t border-dark/5 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 pt-12 pb-4">
            <Reveal>
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-dark/40 mb-6">
                Accredited & Recognised By
              </p>
            </Reveal>
          </div>
          <div className="pb-10">
            <div className="animate-logo-scroll flex items-center gap-20 md:gap-28">
              {[...Array(6)].flatMap((_, setIdx) =>
                [
                  { src: '/logos/ofsted.png', alt: 'Ofsted Registered', w: 130, h: 55 },
                  { src: '/logos/jcq.png', alt: 'JCQ Exam Centre (AQA & WJEC)', w: 180, h: 55 },
                  { src: '/logos/bcs.png', alt: 'BCS Approved Centre', w: 70, h: 80 },
                  { src: '/logos/matrix.png', alt: 'Matrix Quality Standard', w: 180, h: 55 },
                  { src: '/logos/microsoft-education.png', alt: 'Microsoft Education Partner', w: 80, h: 80 },
                  { src: '/logos/first-tech-challenge.png', alt: 'FIRST Tech Challenge', w: 110, h: 70 },
                  { src: '/logos/aqa.svg', alt: 'AQA Exam Board', w: 110, h: 45 },
                  { src: '/logos/wjec.png', alt: 'WJEC CBAC', w: 90, h: 80 },
                ].map((logo) => (
                  <Image
                    key={`${setIdx}-${logo.alt}`}
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.w}
                    height={logo.h}
                    className="h-12 md:h-14 w-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  />
                ))
              )}
            </div>
          </div>
        </section>

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
              <h2 className="font-[var(--font-display)] text-3xl md:text-5xl text-white uppercase leading-tight">
                Book their place for
                <br />
                <span className="bg-gradient-to-r from-cyan via-pink-light to-orange bg-clip-text text-transparent">Easter 2026</span>
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
                href="https://instagram.com/robocodeuk"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on Instagram"
                className="text-white/30 hover:text-pink transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com/robocodeuk"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on Facebook"
                className="text-white/30 hover:text-cyan transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://youtube.com/@robocodeuk"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Robocode on YouTube"
                className="text-white/30 hover:text-orange transition-colors"
              >
                <Youtube size={18} />
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

        <div className="border-t border-white/8 py-5 text-xs text-white/30">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            <span>© {new Date().getFullYear()} RobocodeUK Limited. Company No. 14161031. All rights reserved.</span>
            <Link href="/superadmin" className="text-white/20 hover:text-white/50 transition-colors">Admin</Link>
          </div>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 bg-dark/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-white text-2xl font-semibold font-[var(--font-body)]"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/book/haf"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 px-8 py-3.5 bg-cyan text-dark font-semibold rounded-full"
            >
              Book Now
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
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
