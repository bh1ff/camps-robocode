'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import {
  Bot, Gamepad2, Printer, Zap, Wrench, Activity,
  MapPin, Calendar, Clock, Phone, Mail,
  ChevronDown, ArrowRight, ExternalLink, Menu, X,
  Shield, BadgeCheck, Heart, UtensilsCrossed,
  Instagram, Facebook, Youtube,
  Star, Award, GraduationCap, Users,
} from 'lucide-react';
import clsx from 'clsx';

/* ────────────────────────────────────────────────
   ANIMATED NUMBER COUNTER
   ──────────────────────────────────────────────── */
function NumberTicker({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    const stepTime = Math.max(Math.floor((duration * 1000) / end), 10);
    const increment = Math.max(1, Math.floor(end / 100));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

/* ────────────────────────────────────────────────
   WORD ROTATE – cycling words in hero
   ──────────────────────────────────────────────── */
function WordRotate({ words, className = '' }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % words.length), 2800);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className={clsx('inline-block relative overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 30, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -30, opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ────────────────────────────────────────────────
   TILT CARD – 3D perspective on hover
   ──────────────────────────────────────────────── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  function handleMouse(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={clsx('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────
   DATA
   ──────────────────────────────────────────────── */
const ACTIVITIES = [
  { icon: Bot, img: '/camp/IMG_5527.jpg', title: 'Robotics', desc: 'Build and program robots from scratch. Sensors, motors, and logic come to life in hands-on Studio Lab sessions.', color: '#00dcde', gradient: 'from-[#00dcde]/20 to-[#003439]/5' },
  { icon: Gamepad2, img: '/camp/IMG_5414.jpg', title: 'Game Development', desc: "Design characters, build levels, and code mechanics. Your child's game, running on a real screen by the end of the day.", color: '#ff00bf', gradient: 'from-[#ff00bf]/20 to-[#003439]/5' },
  { icon: Printer, img: '/camp/rc-70.jpg', title: '3D Printing & Engineering', desc: 'Sketch it. Model it. Print it. Take it home. From digital design to solid object in one session.', color: '#ff9752', gradient: 'from-[#ff9752]/20 to-[#003439]/5' },
  { icon: Zap, img: '/camp/rc-61.jpg', title: 'Electronics & Circuits', desc: 'Wire real circuits, connect sensors, and build working electronic projects. Hands-on engineering with real components.', color: '#00dcde', gradient: 'from-[#00dcde]/20 to-[#003439]/5' },
  { icon: Wrench, img: '/camp/rc-40.jpg', title: 'Mechanical Challenges', desc: 'Marble runs, spaghetti towers, Meccano builds, and cardboard engineering. Creative problem-solving with real materials.', color: '#ff00bf', gradient: 'from-[#ff00bf]/20 to-[#003439]/5' },
  { icon: Activity, img: '/camp/rc-31.jpg', title: 'Physical Activity', desc: 'Table tennis, team games, and active breaks every day. A healthy balance of building minds and bodies.', color: '#ff9752', gradient: 'from-[#ff9752]/20 to-[#003439]/5' },
];

const LOCATIONS = [
  { name: 'Robocode Shirley Centre', tag: 'Solihull', council: 'Solihull HAF', address: 'The Exchange, 26 Haslucks Green Road, Shirley, B90 2EL', days: '8 days over 2 weeks', time: '10:00 AM – 2:00 PM', color: '#00dcde', haf: true, paid: true, img: '/camp/rc-22.jpg', badge: 'HQ' },
  { name: 'Tudor Grange Academy', tag: 'Kingshurst', council: 'Solihull HAF', address: 'Cooks Lane, Fordbridge, Birmingham, B37 6NU', days: '4 days, 1 week', time: '12:00 PM – 4:00 PM', color: '#ff00bf', haf: true, paid: false, img: '/camp/rc-10.jpg', badge: 'HAF' },
  { name: 'Birmingham City University', tag: 'Birmingham', council: 'Birmingham HAF', address: '4 Cardigan St, Birmingham, B4 7BD', days: '4 days, 1 week', time: '11:00 AM – 3:00 PM', color: '#ff9752', haf: true, paid: false, img: '/camp/IMG_4865.jpg', badge: 'HAF' },
];

const TESTIMONIALS = [
  { quote: "My 8-year-old attended the Robocode Tech Camp and we couldn't be happier. The program was engaging, well-structured, and tailored to each child's interests. The instructors were knowledgeable, friendly, and supportive.", name: 'Martha', detail: 'Parent of 8-year-old', stars: 5 },
  { quote: "My son and niece had an amazing experience at Robocode's camp. They learned so much and were excited to attend every single day. Seeing them so motivated and happy was incredible. They're already looking forward to coming back.", name: 'Rebecca', detail: 'Parent', stars: 5 },
  { quote: "I joined Robocode for work experience and felt welcomed from day one. The environment was positive, respectful, and very supportive. I gained valuable hands-on experience in robotics and software engineering.", name: 'Maya', detail: 'Work Experience Student', stars: 5 },
];

const PRICING = [
  { days: 1, price: 25, per: '£25/day', save: null, popular: false },
  { days: 2, price: 40, per: '£20/day', save: '20%', popular: false },
  { days: 4, price: 75, per: '£18.75/day', save: '25%', popular: false },
  { days: 8, price: 140, per: '£17.50/day', save: '30%', popular: true },
];

const PHOTOS = [
  '/camp/rc-47.jpg', '/camp/IMG_5554.jpg', '/camp/rc-40.jpg',
  '/camp/IMG_4865.jpg', '/camp/IMG_1885.jpg', '/camp/rc-31.jpg',
];

/* ────────────────────────────────────────────────
   PAGE
   ──────────────────────────────────────────────── */
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f7f7] overflow-x-hidden">

      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={clsx(
          'fixed top-0 inset-x-0 z-50 transition-all duration-500',
          scrolled ? 'bg-[#003439]/95 backdrop-blur-xl shadow-2xl shadow-black/20' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/mascot.png" alt="Robocode" width={36} height={36} className="w-9 h-9 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-heading text-white text-lg tracking-wider">ROBOCODE</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {[['#activities', 'What to Expect'], ['#locations', 'Locations'], ['#testimonials', 'Reviews'], ['#pricing', 'Pricing']].map(([href, label]) => (
              <a key={href} href={href} className="text-white/60 hover:text-white transition-colors text-sm font-medium relative group">
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00dcde] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <a href="https://robocode.uk" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/70 transition-colors text-xs flex items-center gap-1">
              robocode.uk <ExternalLink className="w-3 h-3" />
            </a>
            <Link href="/book/haf" className="group relative px-5 py-2.5 rounded-full bg-[#00dcde] text-[#003439] font-bold text-sm overflow-hidden">
              <span className="relative z-10">Book Now</span>
              <span className="absolute inset-0 bg-[#83fdff] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2" aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-[#003439]/98 backdrop-blur-xl border-t border-white/10 overflow-hidden"
            >
              <div className="px-6 py-6 space-y-4">
                {[['#activities', 'What to Expect'], ['#locations', 'Locations'], ['#testimonials', 'Reviews'], ['#pricing', 'Pricing']].map(([href, label], i) => (
                  <motion.a
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="block text-white/80 hover:text-white text-lg"
                  >
                    {label}
                  </motion.a>
                ))}
                <Link href="/book/haf" onClick={() => setMenuOpen(false)} className="block text-center mt-4 px-6 py-3 rounded-full bg-[#00dcde] text-[#003439] font-bold">
                  Book Now
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center overflow-hidden">
        <motion.div className="absolute inset-0 bg-[#003439]" style={{ y: heroY }}>
          <div className="absolute inset-0" style={{
            backgroundImage: `url('/camp/rc-10.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            opacity: 0.2,
          }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#003439]/60 via-[#003439]/30 to-[#003439]" />

          {/* Animated hex grid */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.svg
              className="absolute top-12 right-0 w-[600px] h-[600px] opacity-[0.05]"
              viewBox="0 0 200 200"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
            >
              <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#00dcde" strokeWidth="0.8" />
              <polygon points="100,30 170,65 170,135 100,170 30,135 30,65" fill="none" stroke="#00dcde" strokeWidth="0.5" />
              <polygon points="100,50 150,75 150,125 100,150 50,125 50,75" fill="none" stroke="#ff00bf" strokeWidth="0.3" />
            </motion.svg>
            <motion.svg
              className="absolute bottom-20 left-10 w-[400px] h-[400px] opacity-[0.03]"
              viewBox="0 0 200 200"
              animate={{ rotate: -360 }}
              transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
            >
              <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#ff9752" strokeWidth="0.5" />
              <polygon points="100,30 170,65 170,135 100,170 30,135 30,65" fill="none" stroke="#ff00bf" strokeWidth="0.3" />
            </motion.svg>
          </div>

          {/* Circuit traces */}
          <svg className="absolute bottom-0 left-0 w-full h-32 opacity-[0.06]" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,80 H300 L320,50 H500 L520,80 H800 L830,30 H1000 L1020,80 H1200" fill="none" stroke="#00dcde" strokeWidth="1.5" />
            <path d="M0,60 H150 L170,30 H400 L420,60 H600" fill="none" stroke="#ff00bf" strokeWidth="0.8" />
          </svg>
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00dcde]/15 border border-[#00dcde]/30 mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-[#00dcde] animate-pulse" />
                <span className="text-[#83fdff] text-sm font-medium">Easter 2026 — Bookings Open</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading text-white leading-[1.1] mb-6"
              >
                <span className="text-[#00dcde]">IMAGINE.</span><br />
                <span className="text-[#ff00bf]">BUILD.</span><br />
                <span className="text-[#ff9752]">IMPROVE.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-lg sm:text-xl text-white/70 max-w-lg mb-2 leading-relaxed"
              >
                Project-packed holiday tech camps for ages 6–17.{' '}
                <WordRotate
                  words={['Robotics', 'Electronics', 'Game Development', '3D Printing', 'Mechanical Engineering']}
                  className="text-[#00dcde] font-semibold"
                />{' '}
                and more.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-sm text-[#83fdff]/50 mb-8"
              >
                Teaching tomorrow&apos;s skills, today.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/book/haf"
                  className="group relative px-8 py-4 rounded-2xl font-bold text-lg text-[#003439] bg-[#00dcde] text-center overflow-hidden shadow-[0_0_40px_rgba(0,220,222,0.3)] hover:shadow-[0_0_60px_rgba(0,220,222,0.5)] transition-shadow duration-500"
                >
                  <span className="relative z-10">
                    Book HAF (Free)
                    <span className="block text-xs font-normal mt-0.5 text-[#003439]/70">For eligible families</span>
                  </span>
                  <span className="absolute inset-0 bg-[#83fdff] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </Link>
                <Link
                  href="/book/paid"
                  className="group px-8 py-4 rounded-2xl font-bold text-lg text-white border-2 border-[#ff00bf] hover:bg-[#ff00bf]/15 transition-all duration-300 text-center relative overflow-hidden"
                >
                  <span className="relative z-10">
                    Book Paid Camp
                    <span className="block text-xs font-normal mt-0.5 text-white/50">From £25/day</span>
                  </span>
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 aspect-video">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/SPV3YG-64Pg?rel=0&modestbranding=1"
                  title="Robocode Easter Tech Camp"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#ff00bf]/20 rounded-full blur-3xl" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#00dcde]/20 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-white/30" />
        </motion.div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="relative -mt-1 bg-gradient-to-r from-[#003439] via-[#05575c] to-[#003439] border-t border-[#00dcde]/20">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 text-center">
            {[
              { value: 22000, suffix: '+', label: 'Robocoders Taught', icon: Users },
              { value: 6, suffix: '–17', label: 'Age Range', icon: GraduationCap, noAnimate: true, display: '6–17' },
              { value: 3, suffix: '', label: 'Camp Locations', icon: MapPin },
              { value: 0, suffix: '', label: '14th – 25th April', icon: Calendar, noAnimate: true, display: 'Easter 2026' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="group"
              >
                <stat.icon className="w-5 h-5 text-[#00dcde]/40 mx-auto mb-2 group-hover:text-[#00dcde] transition-colors" />
                <p className="text-2xl sm:text-3xl font-heading text-[#00dcde]">
                  {stat.noAnimate ? stat.display : <NumberTicker value={stat.value} suffix={stat.suffix} />}
                </p>
                <p className="text-xs sm:text-sm text-white/40 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Credential strip */}
        <div className="border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                { icon: Shield, text: 'Ofsted Registered' },
                { icon: BadgeCheck, text: 'DBS Checked Staff' },
                { icon: Heart, text: 'SEND-Friendly' },
                { icon: UtensilsCrossed, text: 'Hot Meal Included' },
                { icon: Award, text: 'FTC Regional Champions' },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-1.5 text-white/30 text-xs">
                  <badge.icon className="w-3.5 h-3.5 text-[#00dcde]/50" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO (MOBILE) ── */}
      <section className="lg:hidden bg-[#003439] px-4 py-8">
        <div className="max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video">
          <iframe className="w-full h-full" src="https://www.youtube.com/embed/SPV3YG-64Pg?rel=0&modestbranding=1" title="Robocode Easter Tech Camp" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </section>

      {/* ── WHAT THEY'LL BUILD ── */}
      <section id="activities" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-[#ff00bf] font-heading text-xs tracking-[0.2em]">WHAT TO EXPECT</span>
            <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">LEARNING HAPPENS WHEN CHILDREN BUILD</h2>
            <p className="text-[#05575c]/60 text-lg leading-relaxed">
              Every day is a guided project sprint. Your child works with real tools, solves real problems, and takes home real skills — guided by experienced Mentors.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVITIES.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                viewport={{ once: true, margin: '-40px' }}
              >
                <TiltCard>
                  <div className="group robo-card overflow-hidden h-full flex flex-col hover:shadow-xl hover:shadow-black/5 transition-shadow duration-500">
                    <div className="relative h-48 overflow-hidden">
                      <Image src={a.img} alt={a.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <div className="h-1 w-10 rounded-full mb-2" style={{ background: a.color }} />
                          <h3 className="font-heading text-white text-sm">{a.title}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <a.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className={clsx('p-5 flex-1 bg-gradient-to-br', a.gradient)}>
                      <p className="text-sm text-[#05575c]/70 leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00dcde]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-[#00dcde] font-heading text-xs tracking-[0.2em]">EVERYTHING INCLUDED</span>
            <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">WHAT YOUR CHILD GETS</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: UtensilsCrossed, title: 'Hot Meal', desc: 'A hot meal with fruit and vegetables every session. Allergy and dietary needs catered for.', color: '#ff9752' },
              { icon: Zap, title: 'All Equipment', desc: 'Robotics kits, electronics, laptops, and all materials provided. Nothing to buy or bring.', color: '#00dcde' },
              { icon: Activity, title: '1 Hour Activity', desc: 'Physical activity every day — team games, table tennis, and active breaks built into the schedule.', color: '#ff00bf' },
              { icon: Shield, title: 'Safe & Supervised', desc: 'Ofsted-registered. DBS-checked Mentors. SEND-friendly with trained support staff.', color: '#00dcde' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="group text-center p-6 rounded-2xl bg-[#f0f7f7] border border-[#00dcde]/10 hover:border-[#00dcde]/30 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-colors duration-300" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-6 h-6 transition-colors duration-300" style={{ color: item.color }} />
                </div>
                <h3 className="font-heading text-[#003439] text-sm mb-2">{item.title}</h3>
                <p className="text-sm text-[#05575c]/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ── */}
      <section className="py-4 bg-[#003439] overflow-hidden">
        <div className="flex gap-4 animate-scroll-x">
          {[...PHOTOS, ...PHOTOS].map((src, i) => (
            <div key={i} className="flex-none w-64 h-44 rounded-xl overflow-hidden">
              <Image src={src} alt="Camp moment" width={256} height={176} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ── LOCATIONS ── */}
      <section id="locations" className="py-20 sm:py-28 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-[#ff9752] font-heading text-xs tracking-[0.2em]">CAMP LOCATIONS</span>
            <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">3 LOCATIONS ACROSS THE WEST MIDLANDS</h2>
            <p className="text-[#05575c]/60 text-lg">Choose the site closest to you. All locations offer the same quality Robocode experience.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {LOCATIONS.map((loc, i) => (
              <motion.div
                key={loc.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <TiltCard>
                  <div className="robo-card overflow-hidden h-full flex flex-col group hover:shadow-xl hover:shadow-black/5 transition-shadow duration-500">
                    <div className="relative h-44 overflow-hidden">
                      <Image src={loc.img} alt={loc.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg" style={{ background: loc.color }}>
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
                      <p className="text-xs text-[#05575c]/40 mb-4">{loc.council}</p>
                      <div className="space-y-3 text-sm flex-1">
                        <div className="flex gap-3 items-start">
                          <MapPin className="w-4 h-4 mt-0.5 text-[#05575c]/30 flex-none" />
                          <span className="text-[#05575c]/60">{loc.address}</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <Calendar className="w-4 h-4 text-[#05575c]/30 flex-none" />
                          <span className="text-[#05575c]/60">{loc.days}</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <Clock className="w-4 h-4 text-[#05575c]/30 flex-none" />
                          <span className="text-[#05575c]/60">{loc.time}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-5">
                        {loc.haf && (
                          <Link href="/book/haf" className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-[#003439] bg-[#00dcde]/15 hover:bg-[#00dcde]/25 transition-colors flex items-center justify-center gap-1.5">
                            HAF (Free) <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {loc.paid && (
                          <Link href="/book/paid" className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-[#98036c] bg-[#ff00bf]/10 hover:bg-[#ff00bf]/20 transition-colors flex items-center justify-center gap-1.5">
                            Paid <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-8 space-y-3"
          >
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
          </motion.div>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section className="py-20 sm:py-28 bg-[#003439] relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0">
          <motion.svg
            className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.03]"
            viewBox="0 0 200 200"
            animate={{ rotate: 360 }}
            transition={{ duration: 200, repeat: Infinity, ease: 'linear' }}
          >
            <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#00dcde" strokeWidth="1" />
            <polygon points="100,30 170,65 170,135 100,170 30,135 30,65" fill="none" stroke="#ff00bf" strokeWidth="0.5" />
          </motion.svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-[#00dcde] font-heading text-xs tracking-[0.2em]">IS THIS RIGHT FOR YOUR CHILD?</span>
            <h2 className="text-3xl sm:text-4xl font-heading text-white mt-3">WHO IS THIS FOR</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { num: '01', title: 'AGES 6–17', desc: 'Activities adapted to suit different learning stages and skill levels.', icon: GraduationCap },
              { num: '02', title: 'CURIOUS MINDS', desc: 'Kids who love asking questions and exploring how things work.', icon: Star },
              { num: '03', title: 'CREATORS', desc: 'Kids who enjoy building things with their hands and imagination.', icon: Wrench },
              { num: '04', title: 'CHALLENGE SEEKERS', desc: 'Kids who thrive with meaningful challenges that keep them engaged.', icon: Zap },
              { num: '05', title: 'CONFIDENCE BUILDERS', desc: 'Kids developing problem-solving skills through hands-on learning.', icon: Award },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                viewport={{ once: true }}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00dcde]/40 hover:bg-white/[0.08] transition-all duration-500 backdrop-blur-sm"
              >
                <item.icon className="w-8 h-8 text-[#00dcde]/40 group-hover:text-[#00dcde] transition-colors duration-300 mb-3" />
                <span className="font-heading text-[#00dcde]/60 text-xs">{item.num}</span>
                <h3 className="font-heading text-white text-sm mt-1 mb-3">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-[#ff00bf] font-heading text-xs tracking-[0.2em]">PARENT REVIEWS</span>
            <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">WHAT OTHER PARENTS SAID</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="robo-card p-6 sm:p-8 h-full flex flex-col hover:shadow-xl hover:shadow-black/5 transition-shadow duration-500">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-[#ff9752] fill-[#ff9752]" />
                    ))}
                  </div>
                  <p className="text-[#05575c]/70 text-sm leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 sm:py-28 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-[#ff9752] font-heading text-xs tracking-[0.2em]">PAID CAMP PRICING</span>
            <h2 className="text-3xl sm:text-4xl font-heading text-[#003439] mt-3 mb-4">FLEXIBLE PACKAGES</h2>
            <p className="text-[#05575c]/60 text-lg">Available at the Solihull centre. The more days, the bigger the saving. Prices are per family — days can be shared across siblings.</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {PRICING.map((pkg, i) => (
              <motion.div
                key={pkg.days}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <TiltCard>
                  <div className={clsx(
                    'relative rounded-2xl p-6 text-center h-full flex flex-col justify-between transition-shadow duration-500',
                    pkg.popular
                      ? 'bg-gradient-to-br from-[#003439] to-[#05575c] text-white shadow-xl shadow-[#003439]/30 ring-2 ring-[#00dcde]/30'
                      : 'bg-[#f0f7f7] border-2 border-gray-100 hover:border-[#00dcde]/40 hover:shadow-lg'
                  )}>
                    {pkg.popular && (
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                        viewport={{ once: true }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#ff00bf] text-white text-xs font-bold whitespace-nowrap shadow-lg shadow-[#ff00bf]/30"
                      >
                        BEST VALUE
                      </motion.span>
                    )}
                    <div>
                      <p className={clsx('text-sm font-medium mb-1', pkg.popular ? 'text-[#83fdff]' : 'text-[#05575c]/50')}>
                        {pkg.days} {pkg.days === 1 ? 'Day' : 'Days'}
                      </p>
                      <p className={clsx('text-4xl font-heading mb-1', pkg.popular ? 'text-white' : 'text-[#003439]')}>
                        £{pkg.price}
                      </p>
                      <p className={clsx('text-xs', pkg.popular ? 'text-white/50' : 'text-[#05575c]/40')}>
                        {pkg.per}
                      </p>
                    </div>
                    {pkg.save && (
                      <span className={clsx(
                        'inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold',
                        pkg.popular ? 'bg-[#00dcde]/20 text-[#83fdff]' : 'bg-[#00dcde]/10 text-[#00adb3]'
                      )}>
                        Save {pkg.save}
                      </span>
                    )}
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/book/paid" className="group inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-[#ff00bf] to-[#ff58ea] hover:from-[#df009b] hover:to-[#ff00bf] transition-all duration-300 shadow-lg shadow-[#ff00bf]/20 hover:shadow-xl hover:shadow-[#ff00bf]/30">
              Book Paid Camp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── ABOUT ROBOCODE ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#edfffe] to-[#f0f7f7] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#ff00bf]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <span className="text-[#00dcde] font-heading text-xs tracking-[0.2em]">ABOUT ROBOCODE</span>
            <h2 className="text-2xl sm:text-3xl font-heading text-[#003439] mt-3 mb-6">MORE THAN A HOLIDAY CAMP</h2>
            <p className="text-[#05575c]/60 text-lg leading-relaxed mb-6">
              Robocode is an Ofsted-registered tech education company teaching 22,000+ young people real-world skills across robotics, coding, AI, cyber security, 3D printing, and electronics. Our weekly courses, JCQ exam centre, and FTC competition teams run year-round from our flagship centre in Solihull and our franchise centre in Leicester.
            </p>
            <p className="text-[#05575c]/60 text-lg leading-relaxed mb-8">
              Holiday tech camps are where many Robocoders start their journey. If your child loves the camp, they can continue with weekly Studio Lab courses and work toward BCS qualifications and early GCSEs.
            </p>
            <a
              href="https://robocode.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm text-[#003439] bg-[#83fdff] hover:bg-[#00dcde] transition-colors"
            >
              Explore robocode.uk <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/camp/rc-47.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#003439]/92" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white mb-6 leading-tight">
              GIVE YOUR CHILD AN EASTER OF BUILDING, THINKING, AND IMPROVING
            </h2>
            <p className="text-white/50 text-lg mb-4">
              Not just playing. Not just watching. Not just scrolling.
            </p>
            <p className="text-[#83fdff] font-semibold mb-10">Book their place now before it&apos;s gone.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book/haf"
                className="group relative px-10 py-4 rounded-2xl font-bold text-lg text-[#003439] bg-[#00dcde] overflow-hidden shadow-[0_0_40px_rgba(0,220,222,0.3)] hover:shadow-[0_0_60px_rgba(0,220,222,0.5)] transition-shadow duration-500"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Book HAF Camp (Free) <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-[#83fdff] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
              <Link
                href="/book/paid"
                className="px-10 py-4 rounded-2xl font-bold text-lg text-white border-2 border-[#ff00bf] hover:bg-[#ff00bf]/15 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Book Paid Camp <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#003439] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/mascot.png" alt="Robocode" width={32} height={32} />
                <span className="font-heading text-white text-sm">ROBOCODE</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed mb-5">
                Teaching tomorrow&apos;s skills, today. Ofsted-registered tech education for ages 6–17.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, href: 'https://instagram.com/RobocodeOfficial', label: 'Instagram' },
                  { icon: Facebook, href: 'https://facebook.com/RobocodeOfficial', label: 'Facebook' },
                  { icon: Youtube, href: 'https://youtube.com/@RobocodeUK', label: 'YouTube' },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#00dcde]/20 flex items-center justify-center transition-colors duration-300 group">
                    <s.icon className="w-4 h-4 text-white/40 group-hover:text-[#00dcde] transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white text-xs mb-4 tracking-wider">QUICK LINKS</h4>
              <div className="space-y-2.5">
                <Link href="/book/haf" className="block text-white/40 hover:text-white text-sm transition-colors">Book HAF Camp (Free)</Link>
                <Link href="/book/paid" className="block text-white/40 hover:text-white text-sm transition-colors">Book Paid Camp</Link>
                <a href="https://robocode.uk" target="_blank" rel="noopener noreferrer" className="block text-white/40 hover:text-white text-sm transition-colors">robocode.uk</a>
                <a href="https://robocode.uk/franchise" target="_blank" rel="noopener noreferrer" className="block text-white/40 hover:text-white text-sm transition-colors">Franchise Opportunities</a>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white text-xs mb-4 tracking-wider">CONTACT</h4>
              <div className="space-y-2.5 text-sm">
                <a href="mailto:info@robocode.uk" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-[#00dcde]/40" /> info@robocode.uk
                </a>
                <a href="tel:01216619222" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-[#00dcde]/40" /> 0121 661 9222
                </a>
                <div className="flex items-start gap-2 text-white/40">
                  <MapPin className="w-4 h-4 text-[#00dcde]/40 mt-0.5 flex-none" />
                  <span>The Exchange, 26 Haslucks Green Road, Shirley, B90 2EL</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white text-xs mb-4 tracking-wider">ACCREDITATIONS</h4>
              <div className="space-y-2.5 text-sm">
                {['Ofsted Registered', 'JCQ Exam Centre', 'BCS Certified', 'Matrix Accredited', 'FTC Regional Champions'].map((a) => (
                  <div key={a} className="flex items-center gap-2 text-white/40">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#00dcde]/40" /> {a}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} RobocodeUK Limited (Company #14161031). All Rights Reserved.</p>
            <Link href="/superadmin" className="text-white/10 hover:text-white/30 text-xs transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
