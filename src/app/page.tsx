'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'motion/react';
import {
  Bot, Gamepad2, Printer, Zap, Wrench, Activity,
  MapPin, Calendar, Clock, Phone, Mail, ArrowRight, ExternalLink,
  Shield, BadgeCheck, Heart, UtensilsCrossed,
  Instagram, Facebook, Youtube,
  Star, Award, GraduationCap, Users, ChevronDown, X, Menu as MenuIcon,
} from 'lucide-react';
import clsx from 'clsx';

/* ═══════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════ */

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = Math.max(1, Math.floor(to / 60));
    const id = setInterval(() => {
      cur = Math.min(cur + step, to);
      setN(cur);
      if (cur >= to) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

function Rotator({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI(p => (p + 1) % words.length), 2600); return () => clearInterval(id); }, [words.length]);
  return (
    <span className="inline-flex h-[1.2em] overflow-hidden relative align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[i]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-[var(--rc-primary)]"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SectionLabel({ children, color = 'var(--rc-secondary)' }: { children: ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="h-px w-8" style={{ background: color }} />
      <span className="font-display text-[11px] tracking-[0.25em]" style={{ color }}>{children}</span>
    </div>
  );
}

function HexGrid({ className = '' }: { className?: string }) {
  return (
    <svg className={clsx('pointer-events-none', className)} viewBox="0 0 400 400" fill="none">
      {[0, 1, 2].map(ring => (
        <polygon key={ring}
          points="200,20 380,110 380,290 200,380 20,290 20,110"
          stroke="var(--rc-primary)" strokeWidth={0.6 - ring * 0.15} opacity={0.06 - ring * 0.015}
          transform={`scale(${1 - ring * 0.2}) translate(${ring * 40}, ${ring * 40})`}
        />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function CampsPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen">

      {/* ░░░ NAV ░░░ */}
      <nav className={clsx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'bg-[var(--rc-dark)]/90 backdrop-blur-2xl shadow-xl shadow-black/10 py-2' : 'bg-transparent py-4'
      )}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/mascot.png" alt="Robocode" width={34} height={34} className="w-[34px] h-[34px]" />
            <span className="font-display text-white text-base tracking-[0.12em]">ROBOCODE</span>
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            {['Activities', 'Locations', 'Reviews', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-[13px] text-white/50 hover:text-white transition-colors font-medium tracking-wide uppercase">{l}</a>
            ))}
            <a href="https://robocode.uk" target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
              Main Site <ExternalLink className="w-3 h-3" />
            </a>
            <Link href="/book/haf" className="rc-btn rc-btn-primary text-sm px-6 py-2.5">Book Now</Link>
          </div>

          <button onClick={() => setMobileNav(!mobileNav)} className="lg:hidden text-white/70 p-2" aria-label="Toggle menu">
            {mobileNav ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-[var(--rc-dark)]/95 backdrop-blur-2xl border-t border-white/5"
            >
              <div className="px-6 py-8 flex flex-col gap-5">
                {['Activities', 'Locations', 'Reviews', 'Pricing'].map((l, idx) => (
                  <motion.a
                    key={l}
                    href={`#${l.toLowerCase()}`}
                    onClick={() => setMobileNav(false)}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="text-white/70 text-lg font-medium"
                  >{l}</motion.a>
                ))}
                <Link href="/book/haf" onClick={() => setMobileNav(false)} className="rc-btn rc-btn-primary text-base px-6 py-3 mt-2 w-full">Book Now</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ░░░ HERO ░░░ */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex items-center bg-[var(--rc-dark)] overflow-hidden">
        {/* Parallax BG */}
        <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
          <Image src="/camp/rc-10.jpg" alt="" fill className="object-cover opacity-15" priority sizes="100vw" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--rc-dark)]/50 via-transparent to-[var(--rc-dark)]" />

        {/* Motifs */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 180, repeat: Infinity, ease: 'linear' }} className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-[0.04]">
          <HexGrid className="w-full h-full" />
        </motion.div>
        <svg className="absolute bottom-0 left-0 w-full h-24 opacity-[0.05]" viewBox="0 0 1400 80" preserveAspectRatio="none">
          <path d="M0,60 H200 L220,20 H500 L520,60 H800 L830,10 H1100 L1120,60 H1400" fill="none" stroke="var(--rc-primary)" strokeWidth="1.2" />
          <path d="M0,40 H100 L130,15 H350 L370,40 H700" fill="none" stroke="var(--rc-secondary)" strokeWidth="0.6" />
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-28 pb-20">
          <div className="grid lg:grid-cols-[1fr_420px] gap-14 items-center">

            {/* Left */}
            <div className="max-w-xl">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[var(--rc-primary-light)] text-xs font-medium tracking-wide mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--rc-primary)] animate-pulse" />
                  Easter 2026 — Bookings Open
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-[clamp(2.5rem,6vw,4.5rem)] font-display text-white leading-[1.05] mb-7"
              >
                <span className="text-[var(--rc-primary)]">IMAGINE.</span>{' '}
                <span className="text-[var(--rc-secondary)]">BUILD.</span>{' '}
                <span className="text-[var(--rc-tertiary)]">IMPROVE.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="text-lg sm:text-xl text-white/55 leading-relaxed mb-2"
              >
                Holiday tech camps for ages 6–17.{' '}
                <Rotator words={['Robotics', 'Electronics', 'Game Dev', '3D Printing', 'Engineering']} />
                {' '}and more.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-white/25 mb-10"
              >
                Teaching tomorrow&apos;s skills, today.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link href="/book/haf" className="rc-btn rc-btn-primary text-base px-8 py-4">
                  Book HAF (Free)
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/book/paid" className="rc-btn rc-btn-secondary text-base px-8 py-4">
                  Book Paid Camp
                </Link>
              </motion.div>
            </div>

            {/* Right — Video */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 aspect-video">
                <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/SPV3YG-64Pg?rel=0&modestbranding=1" title="Robocode Tech Camp" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[var(--rc-secondary)]/15 blur-3xl animate-glow" />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown className="w-5 h-5 text-white/20" />
        </motion.div>
      </section>

      {/* ░░░ STATS + BADGES ░░░ */}
      <section className="bg-[var(--rc-dark)] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
            {[
              { icon: Users, val: 22000, suf: '+', label: 'Robocoders Taught' },
              { icon: GraduationCap, val: 0, suf: '', label: 'Age Range', display: '6–17' },
              { icon: MapPin, val: 3, suf: '', label: 'Camp Locations' },
              { icon: Calendar, val: 0, suf: '', label: '14th – 25th April', display: 'Easter 2026' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06} className="bg-[var(--rc-dark)] p-6 sm:p-8 text-center">
                <s.icon className="w-4 h-4 text-[var(--rc-primary)]/40 mx-auto mb-3" />
                <p className="font-display text-2xl sm:text-3xl text-[var(--rc-primary)] mb-1">
                  {s.display ?? <Counter to={s.val} suffix={s.suf} />}
                </p>
                <p className="text-[11px] text-white/30 tracking-wide uppercase">{s.label}</p>
              </Reveal>
            ))}
          </div>

          {/* Credential strip */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 py-4 border-t border-white/5">
            {[
              { Icon: Shield, text: 'Ofsted Registered' },
              { Icon: BadgeCheck, text: 'DBS Checked Staff' },
              { Icon: Heart, text: 'SEND-Friendly' },
              { Icon: UtensilsCrossed, text: 'Hot Meal Included' },
              { Icon: Award, text: 'FTC Regional Champions' },
            ].map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-white/20 text-[11px] tracking-wide">
                <Icon className="w-3 h-3 text-[var(--rc-primary)]/30" />{text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ MOBILE VIDEO ░░░ */}
      <section className="lg:hidden bg-[var(--rc-dark)] px-5 pb-8">
        <div className="max-w-lg mx-auto rounded-2xl overflow-hidden border border-white/10 aspect-video shadow-xl">
          <iframe className="w-full h-full" src="https://www.youtube.com/embed/SPV3YG-64Pg?rel=0&modestbranding=1" title="Robocode Tech Camp" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </section>

      {/* ░░░ ACTIVITIES — BENTO GRID ░░░ */}
      <section id="activities" className="section-pad scroll-mt-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--rc-primary)]/[0.03] blur-[120px] -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
          <Reveal>
            <SectionLabel>WHAT TO EXPECT</SectionLabel>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] text-[var(--rc-dark)] mb-3">Learning Happens When Children Build</h2>
            <p className="text-[var(--rc-dark-mid)]/60 text-lg max-w-2xl mb-14 leading-relaxed">
              Every day is a guided project sprint. Real tools, real problems, real skills — guided by experienced Mentors.
            </p>
          </Reveal>

          {/* Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Bot, img: '/camp/IMG_5527.jpg', title: 'Robotics', desc: 'Build and program robots from scratch. Sensors, motors, and logic come to life.', accent: 'var(--rc-primary)', tall: true },
              { icon: Gamepad2, img: '/camp/IMG_5414.jpg', title: 'Game Development', desc: 'Design characters, build levels, and code your own games.', accent: 'var(--rc-secondary)' },
              { icon: Printer, img: '/camp/rc-70.jpg', title: '3D Printing', desc: 'Digital design to solid object. Take it home.', accent: 'var(--rc-tertiary)' },
              { icon: Zap, img: '/camp/rc-61.jpg', title: 'Electronics', desc: 'Wire real circuits, connect sensors, build working projects.', accent: 'var(--rc-primary)' },
              { icon: Wrench, img: '/camp/rc-40.jpg', title: 'Mechanical Engineering', desc: 'Marble runs, spaghetti towers, and cardboard engineering.', accent: 'var(--rc-secondary)' },
              { icon: Activity, img: '/camp/rc-31.jpg', title: 'Physical Activity', desc: 'Team games, table tennis, and active breaks every day.', accent: 'var(--rc-tertiary)', tall: true },
            ].map((a, idx) => (
              <Reveal key={a.title} delay={idx * 0.06} className={a.tall ? 'sm:row-span-2' : ''}>
                <div className={clsx('rc-card overflow-hidden group h-full flex flex-col', a.tall ? 'min-h-[380px]' : '')}>
                  <div className={clsx('relative overflow-hidden', a.tall ? 'flex-1 min-h-[200px]' : 'h-44')}>
                    <Image src={a.img} alt={a.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <div className="h-[3px] w-8 rounded-full mb-2" style={{ background: a.accent }} />
                        <h3 className="font-display text-white text-sm">{a.title}</h3>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <a.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-[var(--rc-dark-mid)]/60 leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ WHAT'S INCLUDED ░░░ */}
      <section className="bg-white section-pad relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[var(--rc-tertiary)]/[0.03] blur-[100px] translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative">
          <Reveal>
            <div className="text-center mb-14">
              <SectionLabel color="var(--rc-primary)"><span className="mx-auto">EVERYTHING INCLUDED</span></SectionLabel>
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] text-[var(--rc-dark)] text-center">What Your Child Gets</h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: UtensilsCrossed, title: 'Hot Meal', desc: 'A hot meal with fruit and vegetables every session. Allergies catered for.', color: 'var(--rc-tertiary)' },
              { icon: Zap, title: 'All Equipment', desc: 'Robotics kits, electronics, laptops — everything provided. Nothing to bring.', color: 'var(--rc-primary)' },
              { icon: Activity, title: '1 Hour Activity', desc: 'Physical activity every day. Team games, table tennis, and active breaks.', color: 'var(--rc-secondary)' },
              { icon: Shield, title: 'Safe & Supervised', desc: 'Ofsted-registered. DBS-checked Mentors. SEND-friendly support.', color: 'var(--rc-primary)' },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="rc-card p-6 text-center h-full">
                  <div className="w-11 h-11 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-display text-[var(--rc-dark)] text-xs mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--rc-dark-mid)]/50 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ PHOTO STRIP ░░░ */}
      <section className="bg-[var(--rc-dark)] py-3 overflow-hidden">
        <div className="flex gap-3 animate-scroll-x">
          {['/camp/rc-47.jpg', '/camp/IMG_5554.jpg', '/camp/rc-40.jpg', '/camp/IMG_4865.jpg', '/camp/IMG_1885.jpg', '/camp/rc-31.jpg',
            '/camp/rc-47.jpg', '/camp/IMG_5554.jpg', '/camp/rc-40.jpg', '/camp/IMG_4865.jpg', '/camp/IMG_1885.jpg', '/camp/rc-31.jpg',
          ].map((src, i) => (
            <div key={i} className="flex-none w-60 h-40 rounded-xl overflow-hidden">
              <Image src={src} alt="Camp moment" width={240} height={160} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ░░░ LOCATIONS ░░░ */}
      <section id="locations" className="section-pad bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionLabel color="var(--rc-tertiary)">CAMP LOCATIONS</SectionLabel>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] text-[var(--rc-dark)] mb-3">3 Locations Across the West Midlands</h2>
            <p className="text-[var(--rc-dark-mid)]/50 text-lg max-w-2xl mb-14">Choose the site closest to you. Same quality Robocode experience at every location.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Robocode Shirley Centre', tag: 'Solihull', council: 'Solihull HAF', address: 'The Exchange, 26 Haslucks Green Road, Shirley, B90 2EL', days: '8 days over 2 weeks', time: '10:00 – 14:00', color: 'var(--rc-primary)', haf: true, paid: true, img: '/camp/rc-22.jpg', label: 'HQ' },
              { name: 'Tudor Grange Academy', tag: 'Kingshurst', council: 'Solihull HAF', address: 'Cooks Lane, Fordbridge, Birmingham, B37 6NU', days: '4 days, 1 week', time: '12:00 – 16:00', color: 'var(--rc-secondary)', haf: true, paid: false, img: '/camp/rc-10.jpg', label: 'HAF' },
              { name: 'Birmingham City University', tag: 'Birmingham', council: 'Birmingham HAF', address: '4 Cardigan St, Birmingham, B4 7BD', days: '4 days, 1 week', time: '11:00 – 15:00', color: 'var(--rc-tertiary)', haf: true, paid: false, img: '/camp/IMG_4865.jpg', label: 'HAF' },
            ].map((loc, i) => (
              <Reveal key={loc.name} delay={i * 0.1}>
                <div className="rc-card overflow-hidden h-full flex flex-col group">
                  <div className="relative h-44 overflow-hidden">
                    <Image src={loc.img} alt={loc.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow" style={{ background: loc.color }}>{loc.tag}</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white/80 bg-black/40 backdrop-blur-sm">{loc.label}</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-display text-[var(--rc-dark)] text-sm mb-0.5">{loc.name}</h3>
                    <p className="text-[11px] text-[var(--rc-dark-mid)]/35 mb-4">{loc.council}</p>
                    <div className="space-y-2.5 text-sm flex-1">
                      <div className="flex gap-2.5 items-start"><MapPin className="w-3.5 h-3.5 mt-0.5 text-[var(--rc-dark-mid)]/25 flex-none" /><span className="text-[var(--rc-dark-mid)]/55">{loc.address}</span></div>
                      <div className="flex gap-2.5 items-center"><Calendar className="w-3.5 h-3.5 text-[var(--rc-dark-mid)]/25 flex-none" /><span className="text-[var(--rc-dark-mid)]/55">{loc.days}</span></div>
                      <div className="flex gap-2.5 items-center"><Clock className="w-3.5 h-3.5 text-[var(--rc-dark-mid)]/25 flex-none" /><span className="text-[var(--rc-dark-mid)]/55">{loc.time}</span></div>
                    </div>
                    <div className="flex gap-2 mt-5">
                      {loc.haf && <Link href="/book/haf" className="flex-1 rc-btn rc-btn-primary text-sm py-2.5">HAF (Free)</Link>}
                      {loc.paid && <Link href="/book/paid" className="flex-1 rc-btn text-sm py-2.5 bg-[var(--rc-secondary)]/10 text-[var(--rc-secondary)] hover:bg-[var(--rc-secondary)]/20">Paid</Link>}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-6 space-y-2.5">
            <div className="p-4 rounded-2xl bg-[var(--rc-primary)]/[0.04] border border-[var(--rc-primary)]/10 text-center">
              <p className="text-sm text-[var(--rc-dark-mid)]"><strong className="text-[var(--rc-dark)]">HAF-funded places are FREE</strong> for families whose children receive free school meals and have a HAF code.</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--rc-tertiary)]/[0.05] border border-[var(--rc-tertiary)]/10 text-center">
              <p className="text-xs text-[var(--rc-tertiary)]">Eligibility: Solihull HAF — live in or attend school in Solihull. Birmingham HAF — live in or attend school in Birmingham.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ░░░ WHO IS THIS FOR ░░░ */}
      <section className="section-pad bg-[var(--rc-dark)] relative overflow-hidden">
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 240, repeat: Infinity, ease: 'linear' }} className="absolute -bottom-40 -left-40 w-[500px] h-[500px] opacity-[0.025]">
          <HexGrid className="w-full h-full" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <Reveal>
            <SectionLabel color="var(--rc-primary)">IS THIS RIGHT FOR YOUR CHILD?</SectionLabel>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] text-white mb-14">Who Is This For</h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: GraduationCap, num: '01', title: 'Ages 6–17', desc: 'Activities adapted for every learning stage.' },
              { icon: Star, num: '02', title: 'Curious Minds', desc: 'Kids who love asking how things work.' },
              { icon: Wrench, num: '03', title: 'Creators', desc: 'Kids who build with hands and imagination.' },
              { icon: Zap, num: '04', title: 'Challenge Seekers', desc: 'Kids who thrive with meaningful challenges.' },
              { icon: Award, num: '05', title: 'Confidence Builders', desc: 'Growing problem-solving skills hands-on.' },
            ].map((item, i) => (
              <Reveal key={item.num} delay={i * 0.06}>
                <div className="rc-card-dark p-5 h-full">
                  <item.icon className="w-6 h-6 text-[var(--rc-primary)]/30 mb-4" />
                  <span className="font-display text-[var(--rc-primary)]/40 text-[10px]">{item.num}</span>
                  <h3 className="font-display text-white text-xs mt-1 mb-2">{item.title}</h3>
                  <p className="text-white/30 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ TESTIMONIALS ░░░ */}
      <section id="reviews" className="section-pad scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionLabel>PARENT REVIEWS</SectionLabel>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] text-[var(--rc-dark)] mb-14">What Other Parents Said</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: "My 8-year-old attended the Robocode Tech Camp and we couldn't be happier. The program was engaging, well-structured, and tailored to each child's interests. The instructors were knowledgeable and supportive.", name: 'Martha', detail: 'Parent of 8-year-old' },
              { quote: "My son and niece had an amazing experience at Robocode's camp. They learned so much and were excited to attend every single day. They're already looking forward to coming back for more.", name: 'Rebecca', detail: 'Parent' },
              { quote: "I joined Robocode for work experience and felt welcomed from day one. The environment was positive, respectful, and very supportive. I gained valuable hands-on experience in robotics.", name: 'Maya', detail: 'Work Experience Student' },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <div className="rc-card p-7 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-[var(--rc-tertiary)] fill-[var(--rc-tertiary)]" />)}
                  </div>
                  <p className="text-[var(--rc-dark-mid)]/60 text-[15px] leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-5 border-t border-[var(--rc-primary)]/5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--rc-primary)] to-[var(--rc-dark)] flex items-center justify-center text-white font-display text-xs">{t.name[0]}</div>
                    <div>
                      <p className="font-semibold text-[var(--rc-dark)] text-sm">{t.name}</p>
                      <p className="text-xs text-[var(--rc-dark-mid)]/40">{t.detail}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ PRICING ░░░ */}
      <section id="pricing" className="section-pad bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionLabel color="var(--rc-tertiary)">PAID CAMP PRICING</SectionLabel>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] text-[var(--rc-dark)] mb-2">Flexible Packages</h2>
            <p className="text-[var(--rc-dark-mid)]/50 text-lg max-w-xl mb-14">Solihull centre. Prices are per family — days can be shared across siblings.</p>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { days: 1, price: 25, per: '£25/day', save: null, pop: false },
              { days: 2, price: 40, per: '£20/day', save: '20%', pop: false },
              { days: 4, price: 75, per: '£18.75/day', save: '25%', pop: false },
              { days: 8, price: 140, per: '£17.50/day', save: '30%', pop: true },
            ].map((p, i) => (
              <Reveal key={p.days} delay={i * 0.08}>
                <div className={clsx(
                  'relative rounded-[var(--rc-radius)] p-6 text-center h-full flex flex-col justify-between transition-all duration-500',
                  p.pop
                    ? 'bg-gradient-to-br from-[var(--rc-dark)] to-[var(--rc-dark-mid)] text-white ring-1 ring-[var(--rc-primary)]/20 shadow-xl shadow-[var(--rc-dark)]/20'
                    : 'rc-card'
                )}>
                  {p.pop && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--rc-secondary)] text-white text-[10px] font-bold tracking-wider shadow-lg shadow-[var(--rc-secondary)]/30">BEST VALUE</span>
                  )}
                  <div>
                    <p className={clsx('text-sm font-medium mb-1', p.pop ? 'text-[var(--rc-primary-light)]' : 'text-[var(--rc-dark-mid)]/40')}>
                      {p.days} {p.days === 1 ? 'Day' : 'Days'}
                    </p>
                    <p className={clsx('font-display text-4xl mb-1', p.pop ? 'text-white' : 'text-[var(--rc-dark)]')}>£{p.price}</p>
                    <p className={clsx('text-xs', p.pop ? 'text-white/40' : 'text-[var(--rc-dark-mid)]/30')}>{p.per}</p>
                  </div>
                  {p.save && (
                    <span className={clsx(
                      'inline-block mt-4 px-3 py-1 rounded-full text-xs font-bold',
                      p.pop ? 'bg-[var(--rc-primary)]/15 text-[var(--rc-primary-light)]' : 'bg-[var(--rc-primary)]/8 text-[var(--rc-accent)]'
                    )}>Save {p.save}</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="text-center mt-10">
            <Link href="/book/paid" className="rc-btn text-lg px-10 py-4 bg-gradient-to-r from-[var(--rc-secondary)] to-[#ff58ea] text-white shadow-lg shadow-[var(--rc-secondary)]/20 hover:shadow-xl hover:shadow-[var(--rc-secondary)]/30 hover:-translate-y-0.5">
              Book Paid Camp <ArrowRight className="w-5 h-5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ░░░ ABOUT ░░░ */}
      <section className="section-pad bg-gradient-to-b from-[var(--rc-primary-50)] to-[var(--rc-surface)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <Reveal>
            <SectionLabel color="var(--rc-primary)"><span className="mx-auto">ABOUT ROBOCODE</span></SectionLabel>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] text-[var(--rc-dark)] mb-6">More Than a Holiday Camp</h2>
            <p className="text-[var(--rc-dark-mid)]/55 text-lg leading-relaxed mb-4">
              Robocode is an Ofsted-registered tech education company teaching 22,000+ young people across robotics, coding, AI, cyber security, 3D printing, and electronics. Weekly courses, a JCQ exam centre, and FTC competition teams run year-round from Solihull and Leicester.
            </p>
            <p className="text-[var(--rc-dark-mid)]/55 text-lg leading-relaxed mb-8">
              Holiday camps are where many Robocoders start. Love the camp? Continue with weekly Studio Lab courses, BCS qualifications, and early GCSEs.
            </p>
            <a href="https://robocode.uk" target="_blank" rel="noopener noreferrer" className="rc-btn rc-btn-primary text-sm px-7 py-3">
              Explore robocode.uk <ExternalLink className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ░░░ FINAL CTA ░░░ */}
      <section className="relative py-28 sm:py-36 overflow-hidden">
        <Image src="/camp/rc-47.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-[var(--rc-dark)]/92" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,5vw,3.5rem)] font-display text-white mb-5 leading-tight">
              Give Your Child an Easter of Building, Thinking, and Improving
            </h2>
            <p className="text-white/40 text-lg mb-3">Not just playing. Not just watching. Not just scrolling.</p>
            <p className="text-[var(--rc-primary-light)] font-semibold mb-10">Book their place now before it&apos;s gone.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/book/haf" className="rc-btn rc-btn-primary text-lg px-10 py-4">
                Book HAF Camp (Free) <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/book/paid" className="rc-btn rc-btn-secondary text-lg px-10 py-4">
                Book Paid Camp
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ░░░ FOOTER ░░░ */}
      <footer className="bg-[var(--rc-dark)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Image src="/mascot.png" alt="Robocode" width={28} height={28} />
                <span className="font-display text-white text-sm tracking-[0.1em]">ROBOCODE</span>
              </div>
              <p className="text-white/25 text-sm leading-relaxed mb-6">Teaching tomorrow&apos;s skills, today. Ofsted-registered tech education for ages 6–17.</p>
              <div className="flex gap-2">
                {[
                  { icon: Instagram, href: 'https://instagram.com/RobocodeOfficial' },
                  { icon: Facebook, href: 'https://facebook.com/RobocodeOfficial' },
                  { icon: Youtube, href: 'https://youtube.com/@RobocodeUK' },
                ].map(s => (
                  <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-[var(--rc-primary)]/15 flex items-center justify-center transition-colors group" aria-label="Social">
                    <s.icon className="w-3.5 h-3.5 text-white/25 group-hover:text-[var(--rc-primary)] transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display text-white text-[10px] tracking-[0.2em] mb-5">QUICK LINKS</h4>
              <div className="space-y-2.5 text-sm">
                <Link href="/book/haf" className="block text-white/30 hover:text-white transition-colors">Book HAF Camp (Free)</Link>
                <Link href="/book/paid" className="block text-white/30 hover:text-white transition-colors">Book Paid Camp</Link>
                <a href="https://robocode.uk" target="_blank" rel="noopener noreferrer" className="block text-white/30 hover:text-white transition-colors">robocode.uk</a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-white text-[10px] tracking-[0.2em] mb-5">CONTACT</h4>
              <div className="space-y-2.5 text-sm">
                <a href="mailto:info@robocode.uk" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors"><Mail className="w-3.5 h-3.5 text-[var(--rc-primary)]/30" />info@robocode.uk</a>
                <a href="tel:01216619222" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5 text-[var(--rc-primary)]/30" />0121 661 9222</a>
                <div className="flex items-start gap-2 text-white/30"><MapPin className="w-3.5 h-3.5 text-[var(--rc-primary)]/30 mt-0.5 flex-none" />The Exchange, 26 Haslucks Green Rd, Shirley, B90 2EL</div>
              </div>
            </div>

            {/* Accreditations */}
            <div>
              <h4 className="font-display text-white text-[10px] tracking-[0.2em] mb-5">ACCREDITATIONS</h4>
              <div className="space-y-2 text-sm">
                {['Ofsted Registered', 'JCQ Exam Centre', 'BCS Certified', 'Matrix Accredited', 'FTC Regional Champions'].map(a => (
                  <div key={a} className="flex items-center gap-2 text-white/30"><BadgeCheck className="w-3 h-3 text-[var(--rc-primary)]/25" />{a}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-white/15 text-xs">&copy; {new Date().getFullYear()} RobocodeUK Limited (#14161031). All Rights Reserved.</p>
            <Link href="/superadmin" className="text-white/10 hover:text-white/25 text-xs transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
