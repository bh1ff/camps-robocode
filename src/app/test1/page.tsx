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
  Star,
  Cpu,
  Printer,
  Gamepad2,
  Zap,
  Bot,
  Shield,
} from 'lucide-react';

/* ─── Neon Architect palette (Robocode-adapted) ─── */
const C = {
  bg: '#021a1c',
  surface: '#03282b',
  surfaceHigh: '#053e42',
  surfaceBright: '#075459',
  glass: 'rgba(5,62,66,0.55)',
  ghostBorder: 'rgba(0,220,222,0.12)',
  primary: '#00dcde',
  primaryDim: '#00adb3',
  secondary: '#ff00bf',
  secondaryDim: '#cc0099',
  tertiary: '#83fdff',
  accent: '#ff9752',
  textHigh: '#e8feff',
  textMed: 'rgba(232,254,255,0.7)',
  textLow: 'rgba(232,254,255,0.4)',
};

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── date helpers ─── */
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function summariseDates(dateStrings: string[]) {
  if (!dateStrings.length) return { summary: '', totalDays: 0 };
  const dates = dateStrings.map(s => new Date(s)).filter(d => !isNaN(d.getTime())).sort((a,b) => a.getTime()-b.getTime());
  if (!dates.length) return { summary: '', totalDays: 0 };
  const runs: Date[][] = []; let run: Date[] = [dates[0]];
  for (let i=1;i<dates.length;i++){const gap=Math.round((dates[i].getTime()-run[run.length-1].getTime())/86400000);if(gap===1){run.push(dates[i])}else{runs.push(run);run=[dates[i]]}}runs.push(run);
  const groups: Date[][][]=[[runs[0]]];for(let i=1;i<runs.length;i++){const lg=groups[groups.length-1];const lr=lg[lg.length-1];const gap=Math.round((runs[i][0].getTime()-lr[lr.length-1].getTime())/86400000);if(gap>=2&&gap<=5&&lr.length===runs[i].length&&lr[0].getUTCDay()===runs[i][0].getUTCDay()){lg.push(runs[i])}else{groups.push([runs[i]])}}
  const parts=groups.map(g=>{const a=g.flat();const f=a[0];const l=a[a.length-1];if(a.length===1)return`${DAY_SHORT[f.getUTCDay()]} ${f.getUTCDate()} ${MONTH_SHORT[f.getUTCMonth()]}`;const dows=[...new Set(a.map(d=>d.getUTCDay()))].sort((x,y)=>x-y);const ds=dows.length===1?DAY_SHORT[dows[0]]:`${DAY_SHORT[dows[0]]}–${DAY_SHORT[dows[dows.length-1]]}`;return f.getUTCMonth()===l.getUTCMonth()?`${ds}, ${f.getUTCDate()}–${l.getUTCDate()} ${MONTH_SHORT[f.getUTCMonth()]}`:`${ds}, ${f.getUTCDate()} ${MONTH_SHORT[f.getUTCMonth()]} – ${l.getUTCDate()} ${MONTH_SHORT[l.getUTCMonth()]}`});
  return { summary: parts.join(' & '), totalDays: dates.length };
}

interface ApiLocation { id:string; name:string; slug:string; address:string; region:string; imageUrl:string|null; camps:{allowsHaf:boolean;allowsPaid:boolean;campDays:{id:string;date:string}[]}[] }
interface Loc { name:string; slug:string; region:string; address:string; dates:string; time:string; haf:boolean; paid:boolean; img:string }

const LOC_IMGS: Record<string,string> = { shirley:'/camp/location-shirley-centre.jpg', solihull:'/camp/location-shirley-centre.jpg', kingshurst:'/camp/location-kingshurst.jpg', 'tudor grange':'/camp/location-kingshurst.jpg', 'birmingham city':'/camp/location-bcu.jpg', bcu:'/camp/location-bcu.jpg' };
function locImg(name:string){ const l=name.toLowerCase(); for(const[k,v] of Object.entries(LOC_IMGS)) if(l.includes(k)) return v; return '/camp/location-shirley-centre.jpg'; }
function toLoc(a:ApiLocation):Loc{ const days=a.camps.flatMap(c=>c.campDays.map(d=>d.date)); const{summary}=summariseDates(days); return{name:a.name,slug:a.slug||a.name.toLowerCase().replace(/\s+/g,'-'),region:a.region.charAt(0).toUpperCase()+a.region.slice(1),address:a.address,dates:summary,time:'10:00 AM – 2:00 PM',haf:a.camps.some(c=>c.allowsHaf),paid:a.camps.some(c=>c.allowsPaid),img:a.imageUrl||locImg(a.name)}}

interface PricingCard { days:string; price:number; perDay:string; save:string|null; best:boolean }
function buildCards(tiers:{days:number;pricePence:number}[]):PricingCard[]{
  const s=[...tiers].sort((a,b)=>a.days-b.days); const base=s.find(t=>t.days===1)?.pricePence??s[0]?.pricePence??0; const mx=Math.max(...s.map(t=>t.days));
  return s.map(t=>{const p=t.pricePence/100;const pd=t.pricePence/t.days/100;const sv=base*t.days-t.pricePence;return{days:`${t.days} day${t.days!==1?'s':''}`,price:p%1===0?p:+p.toFixed(2),perDay:pd%1===0?`£${pd}`:`£${pd.toFixed(2)}`,save:sv>0?`£${sv/100}`:null,best:t.days===mx&&s.length>1}});
}
const FALLBACK_PRICING = buildCards([{days:1,pricePence:2500},{days:2,pricePence:4000},{days:4,pricePence:7500},{days:8,pricePence:14000}]);

const ACTIVITIES = [
  { icon: Bot, title: 'Robotics', desc: 'Build, program and battle autonomous robots with competition-grade kits.' },
  { icon: Gamepad2, title: 'Game Dev', desc: 'Design characters, build levels and code playable games.' },
  { icon: Printer, title: '3D Printing', desc: 'Sketch it, model it, print it — and take it home.' },
  { icon: Zap, title: 'Electronics', desc: 'Wire circuits, sensors and Arduino microcontrollers.' },
  { icon: Cpu, title: 'AI & Cyber', desc: 'Hands-on AI projects and cyber security challenges.' },
  { icon: Shield, title: 'Physical Activity', desc: 'Movement, games and active play between sessions.' },
];

const TESTIMONIALS = [
  { quote:'My son has been attending Robocode for a few months now and absolutely loves it. The teachers are brilliant, patient, knowledgeable, and really engaging.', name:'Sarah M.', detail:'Parent, Solihull' },
  { quote:"The holiday camp was fantastic. My daughter came home buzzing every day, talking about robots and circuits. She's already asking when the next one is!", name:'David T.', detail:'Parent, Birmingham' },
  { quote:'As a parent of an autistic child I was worried, but the staff were incredible. They adapted activities and my son thrived. Truly inclusive.', name:'Priya K.', detail:'Parent, Solihull' },
];

const MARQUEE = ['/camp/marquee-arduino-smile.jpg','/camp/marquee-girl-robot.jpg','/camp/marquee-vr.jpg','/camp/marquee-racing-sim.jpg','/camp/marquee-girls-collab.jpg','/camp/marquee-scratch.jpg','/camp/marquee-table-tennis.jpg','/camp/marquee-kids-building.jpg','/camp/marquee-3d-printer.jpg','/camp/marquee-coding.jpg','/camp/marquee-3d-print-show.jpg','/camp/marquee-electronics-help.jpg','/camp/marquee-chess.jpg'];

const FAQ = [
  { q:'What are the camp timings?', a:'All sessions run 10:00 AM to 2:00 PM. Drop-off from 9:45 AM, collection at 2:00 PM sharp.' },
  { q:'What is HAF?', a:'The Holiday Activities and Food programme provides free places for children who receive benefits-related free school meals. A valid HAF code is required.' },
  { q:'What activities are included?', a:'Robocoders rotate through robotics, game dev, 3D printing, electronics, AI and cyber security, and physical activity.' },
  { q:'Is lunch provided?', a:'A hot meal, fruit and vegetables are provided for HAF-funded places. Paid camp attendees may also receive meals (subject to availability).' },
  { q:'What about children with SEND?', a:'We welcome all children. Our Mentors are experienced in supporting children with additional needs.' },
  { q:'Do I need to bring anything?', a:'Just comfortable clothes, a water bottle, and curiosity. All tech equipment is provided.' },
];

/* ─── page ─── */
export default function Test1Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pricing, setPricing] = useState(FALLBACK_PRICING);
  const [season, setSeason] = useState('');
  const [seasonEnd, setSeasonEnd] = useState<string|null>(null);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number|null>(null);
  const [tIdx, setTIdx] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start','end start'] });
  const heroY = useTransform(scrollYProgress, [0,1], ['0%','25%']);
  const heroOp = useTransform(scrollYProgress, [0,0.7], [1,0]);

  useEffect(() => {
    fetch('/api/pricing').then(r=>r.json()).then((t:{days:number;pricePence:number}[])=>{if(Array.isArray(t)&&t.length)setPricing(buildCards(t))}).catch(()=>{});
    fetch('/api/season').then(r=>r.json()).then((s:{title:string;endDate?:string|null})=>{if(s?.title)setSeason(s.title);if(s?.endDate)setSeasonEnd(s.endDate)}).catch(()=>{});
    fetch('/api/locations').then(r=>r.json()).then((l:ApiLocation[])=>{if(Array.isArray(l))setLocs(l.map(toLoc))}).catch(()=>{}).finally(()=>setLoaded(true));
  }, []);

  useEffect(() => { const t=setInterval(()=>setTIdx(p=>(p+1)%TESTIMONIALS.length),5000); return()=>clearInterval(t) }, []);

  const expired = Boolean(seasonEnd && new Date(seasonEnd) < new Date());

  return (
    <div style={{ background: C.bg, color: C.textHigh }} className="min-h-screen">

      {/* ─── NAV ─── */}
      <NeonNav menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <Image src="/camp/hero-teacher-drone-demo.jpg" alt="Robocode camp" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${C.bg}ee 0%, ${C.bg}cc 40%, ${C.bg}88 70%, transparent 100%)` }} />
        </motion.div>

        <motion.div style={{ opacity: heroOp }} className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-8" style={{ background: C.glass, border: `1px solid ${C.ghostBorder}`, backdropFilter: 'blur(20px)', color: C.primary }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.primary }} />
              {season || 'Holiday Camp'} — Now Booking
            </div>

            <h1 className="font-[var(--font-display)] text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight uppercase">
              <span className="block" style={{ color: C.textHigh }}>Holiday</span>
              <span className="block" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tech Camps</span>
            </h1>

            <p className="mt-6 text-xl md:text-2xl font-[var(--font-body)] font-semibold" style={{ color: C.textHigh }}>
              Turn screen time into build time.
            </p>
            <p className="mt-3 text-lg font-[var(--font-body)]" style={{ color: C.textMed }}>
              Robotics, coding, AI, 3D printing and more for ages 6–17.
            </p>

            {loaded && (
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                {expired ? (
                  <p className="text-sm" style={{ color: C.textLow }}>Bookings are currently closed. Sign up to be notified about the next camp.</p>
                ) : (
                  <>
                    <Link href="/book/haf" className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold tracking-wide transition-all duration-300 hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDim})`, color: C.bg, boxShadow: `0 0 30px ${C.primary}33` }}>
                      Book Free Place (HAF) <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/book/paid" className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold tracking-wide transition-all duration-300 hover:scale-[1.02]" style={{ background: C.glass, border: `1px solid ${C.ghostBorder}`, backdropFilter: 'blur(20px)', color: C.textHigh, boxShadow: `0 0 20px ${C.secondary}22` }}>
                      Book Paid Camp <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </>
                )}
              </div>
            )}

            <div className="mt-12 flex flex-wrap gap-6 text-xs uppercase tracking-wider font-semibold" style={{ color: C.textLow }}>
              <span><span style={{ color: C.primary }}>Ofsted</span> Registered</span>
              <span><span style={{ color: C.secondary }}>22,000+</span> Robocoders</span>
              <span><span style={{ color: C.accent }}>FTC</span> Champions</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── PARTNER LOGOS ─── */}
      <section style={{ background: C.surface }}>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] pt-8 pb-3" style={{ color: C.textLow }}>Trusted By</p>
        <div className="py-5 overflow-hidden">
          <div className="animate-logo-scroll flex items-center gap-20 md:gap-28">
            {[...Array(6)].flatMap((_,si) =>
              [{src:'/logos/ofsted.png',alt:'Ofsted',w:120,h:50},{src:'/logos/microsoft-education.png',alt:'Microsoft',w:70,h:70},{src:'/logos/jcq.png',alt:'JCQ',w:160,h:50},{src:'/logos/bcs.png',alt:'BCS',w:60,h:70},{src:'/logos/matrix.png',alt:'Matrix',w:160,h:50},{src:'/logos/first-tech-challenge.png',alt:'FTC',w:100,h:60},{src:'/logos/aqa.svg',alt:'AQA',w:100,h:40},{src:'/logos/wjec.png',alt:'WJEC',w:80,h:70},{src:'/logos/ukri-innovateuk.png',alt:'Innovate UK',w:110,h:50}].map(l=>
                <Image key={`${si}-${l.alt}`} src={l.src} alt={l.alt} width={l.w} height={l.h} className="h-10 md:h-12 w-auto shrink-0 opacity-40 hover:opacity-80 transition-opacity brightness-0 invert" />
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── LOCATIONS ─── */}
      <section id="locations" style={{ background: C.bg }}>
        <div className="max-w-7xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-semibold tracking-wider uppercase" style={{ color: C.accent }}>Locations & Dates</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-5xl uppercase" style={{ color: C.textHigh }}>Our Venues</h2>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-2 gap-6">
            {locs.length > 0 ? locs.map((loc, i) => (
              <Reveal key={loc.name} delay={i * 0.08}>
                <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]" style={{ background: C.surface, border: `1px solid ${C.ghostBorder}` }}>
                  <div className="relative h-52">
                    <Image src={loc.img} alt={loc.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.surface}, transparent 60%)` }} />
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: `${C.primary}22`, color: C.primary, border: `1px solid ${C.primary}44` }}>{loc.region}</span>
                      {loc.haf && <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: `${C.tertiary}22`, color: C.tertiary, border: `1px solid ${C.tertiary}44` }}>HAF Free</span>}
                      {loc.paid && <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: `${C.secondary}22`, color: C.secondary, border: `1px solid ${C.secondary}44` }}>Paid</span>}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-[var(--font-body)] text-xl font-bold" style={{ color: C.textHigh }}>{loc.name}</h3>
                    <div className="mt-4 space-y-2 text-sm" style={{ color: C.textMed }}>
                      <p className="flex items-center gap-2.5"><MapPin size={15} style={{ color: C.primary }} />{loc.address}</p>
                      <p className="flex items-center gap-2.5 font-bold" style={{ color: C.textHigh }}><Calendar size={15} style={{ color: C.secondary }} />{loc.dates}</p>
                      <p className="flex items-center gap-2.5"><Clock size={15} style={{ color: C.accent }} />{loc.time}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {expired ? (
                        <span className="text-xs font-medium italic" style={{ color: C.textLow }}>Bookings closed</span>
                      ) : (
                        <>
                          {loc.haf && <Link href={`/book/haf?location=${loc.slug}`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDim})`, color: C.bg }}>Book Free (HAF) <ChevronRight size={14} /></Link>}
                          {loc.paid && <Link href={`/book/paid?location=${loc.slug}`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]" style={{ background: C.glass, border: `1px solid ${C.ghostBorder}`, color: C.textHigh }}>Book Paid <ChevronRight size={14} /></Link>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            )) : loaded ? (
              <Reveal><div className="col-span-2 text-center py-16 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.ghostBorder}` }}><Calendar size={40} className="mx-auto mb-4" style={{ color: C.textLow }} /><p className="text-lg font-bold" style={{ color: C.textHigh }}>Venues coming soon</p><p className="mt-2 text-sm" style={{ color: C.textMed }}>Check back soon for details.</p></div></Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ background: C.surface }}>
        <div className="max-w-4xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-semibold tracking-wider uppercase text-center" style={{ color: C.secondary }}>Pricing</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-5xl uppercase text-center" style={{ color: C.textHigh }}>Paid Camp Packages</h2>
            <p className="mt-4 text-center text-sm" style={{ color: C.textLow }}>Prices per family. Days can be shared across siblings.</p>
          </Reveal>
          <Reveal className="mt-14">
            <div className={`grid gap-4 ${pricing.length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-md mx-auto' : 'grid-cols-2 md:grid-cols-4'}`}>
              {pricing.map(p => (
                <div key={p.days} className="relative rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.03]" style={{ background: p.best ? C.surfaceHigh : C.bg, border: `1px solid ${p.best ? C.primary+'55' : C.ghostBorder}`, boxShadow: p.best ? `0 0 40px ${C.primary}22` : 'none' }}>
                  {p.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDim})`, color: C.bg }}>Best Value</span>}
                  <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: C.textLow }}>{p.days}</p>
                  <p className="mt-2 text-4xl font-bold" style={{ color: C.textHigh }}>£{p.price}</p>
                  <p className="mt-1 text-sm" style={{ color: C.textLow }}>{p.perDay}/day</p>
                  {p.save && <span className="inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${C.secondary}22`, color: C.secondary }}>{`Save ${p.save}`}</span>}
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs" style={{ color: C.textLow }}>Childcare vouchers accepted. All staff DBS Enhanced checked.</p>
          </Reveal>
        </div>
      </section>

      {/* ─── WHAT TO EXPECT ─── */}
      <section id="activities" style={{ background: C.bg }}>
        <div className="max-w-7xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-semibold tracking-wider uppercase" style={{ color: C.primary }}>What To Expect</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-5xl uppercase" style={{ color: C.textHigh }}>Activities</h2>
            <p className="mt-4 text-sm italic" style={{ color: C.textLow }}>Availability may vary by venue and equipment on site.</p>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-3 gap-4">
            {ACTIVITIES.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.05}>
                <div className="rounded-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.02] group" style={{ background: C.surface, border: `1px solid ${C.ghostBorder}` }}>
                  <a.icon size={32} style={{ color: C.primary }} className="group-hover:drop-shadow-[0_0_12px_rgba(0,220,222,0.5)] transition-all" />
                  <h3 className="mt-4 font-[var(--font-body)] text-lg font-bold" style={{ color: C.textHigh }}>{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textMed }}>{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHATS INCLUDED ─── */}
      <section style={{ background: C.surface }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Utensils, label: 'Hot meal + fruit & veg', desc: 'Subject to availability', clr: C.accent },
              { icon: Wrench, label: 'All equipment included', desc: 'Laptops, kits and materials', clr: C.primary },
              { icon: Activity, label: 'Physical activity', desc: 'Sports and active play', clr: C.secondary },
              { icon: ShieldCheck, label: 'Safe & supervised', desc: 'Ofsted registered, DBS-checked', clr: C.tertiary },
            ].map(it => (
              <div key={it.label} className="text-center">
                <it.icon size={28} style={{ color: it.clr }} className="mx-auto" />
                <p className="mt-3 font-semibold text-sm" style={{ color: C.textHigh }}>{it.label}</p>
                <p className="mt-1 text-xs" style={{ color: C.textLow }}>{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PHOTO MARQUEE ─── */}
      <section style={{ background: C.bg }} className="py-4 overflow-hidden">
        <div className="animate-marquee flex gap-4">
          {[...MARQUEE,...MARQUEE].map((src,i) => (
            <div key={i} className="relative w-72 md:w-80 h-52 rounded-xl overflow-hidden shrink-0" style={{ border: `1px solid ${C.ghostBorder}` }}>
              <Image src={src} alt="Activity" fill className="object-cover object-top" sizes="320px" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="reviews" style={{ background: C.surface }}>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <Reveal>
            <p className="text-sm font-semibold tracking-wider uppercase" style={{ color: C.primary }}>Reviews</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="text-sm font-medium" style={{ color: C.textLow }}>Google Reviews</span>
              <div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}</div>
            </div>
          </Reveal>
          <div className="mt-12 relative min-h-[180px]">
            <AnimatePresence mode="wait">
              <motion.div key={tIdx} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.4}}>
                <blockquote className="text-lg md:text-xl leading-relaxed italic font-[var(--font-body)]" style={{ color: C.textHigh }}>&ldquo;{TESTIMONIALS[tIdx].quote}&rdquo;</blockquote>
                <p className="mt-6 font-semibold text-sm" style={{ color: C.textHigh }}>{TESTIMONIALS[tIdx].name}</p>
                <p className="text-xs" style={{ color: C.textLow }}>{TESTIMONIALS[tIdx].detail}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex justify-center gap-2">
            {TESTIMONIALS.map((_,i) => <button key={i} onClick={()=>setTIdx(i)} className="w-2 h-2 rounded-full transition-all" style={{ background: i===tIdx ? C.primary : `${C.textLow}` , width: i===tIdx ? 24 : 8 }} />)}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ background: C.bg }}>
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-semibold tracking-wider uppercase text-center" style={{ color: C.accent }}>FAQ</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl md:text-4xl uppercase text-center" style={{ color: C.textHigh }}>Common Questions</h2>
          </Reveal>
          <div className="mt-12 space-y-3">
            {FAQ.map((item,i) => (
              <Reveal key={i} delay={i*0.03}>
                <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.ghostBorder}` }}>
                  <button onClick={()=>setFaqOpen(faqOpen===i?null:i)} className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors" style={{ color: C.textHigh }}>
                    <span className="font-semibold text-sm pr-4">{item.q}</span>
                    {faqOpen===i ? <ChevronUp size={18} style={{color:C.textLow}} /> : <ChevronDown size={18} style={{color:C.textLow}} />}
                  </button>
                  <AnimatePresence>
                    {faqOpen===i && <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25}} className="overflow-hidden"><p className="px-6 pb-5 text-sm leading-relaxed" style={{color:C.textMed}}>{item.a}</p></motion.div>}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <Image src="/camp/cta-mural.jpg" alt="Robocode mural" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${C.bg}ee, ${C.bg}cc, ${C.secondary}33)` }} />
        <div className="relative z-10 text-center px-6">
          <Reveal>
            <h2 className="font-[var(--font-display)] text-3xl md:text-5xl uppercase leading-tight" style={{ color: C.textHigh }}>
              Book their place for<br />
              <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{season || 'Holiday Camp'}</span>
            </h2>
            {loaded && !expired && (
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/book/haf" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all hover:scale-[1.03]" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDim})`, color: C.bg }}>Book Free Place (HAF) <ArrowRight size={16} /></Link>
                <Link href="/book/paid" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all hover:scale-[1.03]" style={{ background: C.glass, border: `1px solid ${C.ghostBorder}`, color: C.textHigh }}>Book Paid Camp <ArrowRight size={16} /></Link>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: C.surface, borderTop: `1px solid ${C.ghostBorder}` }}>
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10 text-sm">
          <div className="col-span-2 md:col-span-1">
            <Image src="/logo-brand.png" alt="Robocode" width={160} height={37} className="mb-4 h-9 w-auto brightness-0 invert" />
            <p className="text-xs leading-relaxed" style={{ color: C.textLow }}>Inspiring the next generation of innovators through hands-on technology education.</p>
            <div className="mt-4 flex gap-3">
              {[
                { href: 'https://www.instagram.com/robocode_official/', icon: Instagram, label: 'Instagram' },
                { href: 'https://www.facebook.com/RobocodeOfficial/', icon: Facebook, label: 'Facebook' },
                { href: 'https://www.youtube.com/@robocode_official', icon: Youtube, label: 'YouTube' },
                { href: 'https://www.linkedin.com/company/robocodeofficial', icon: Linkedin, label: 'LinkedIn' },
              ].map(s => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} style={{ color: C.textLow }} className="hover:opacity-100 opacity-50 transition-opacity"><s.icon size={18} /></a>)}
            </div>
          </div>
          <div>
            <p className="font-semibold text-xs uppercase tracking-wider mb-3" style={{ color: C.textHigh }}>Quick Links</p>
            {[{l:'Locations',h:'#locations'},{l:'Pricing',h:'#pricing'},{l:'Activities',h:'#activities'},{l:'Reviews',h:'#reviews'},{l:'Main Website',h:'https://robocode.uk'}].map(lk=><a key={lk.h} href={lk.h} className="block py-1 transition-colors hover:opacity-100 opacity-60" style={{color:C.textMed}}>{lk.l}</a>)}
          </div>
          <div>
            <p className="font-semibold text-xs uppercase tracking-wider mb-3" style={{ color: C.textHigh }}>Contact</p>
            <a href="tel:+441216619222" className="flex items-center gap-2 py-1 opacity-60 hover:opacity-100 transition-opacity" style={{color:C.textMed}}><Phone size={13} /> 0121 661 9222</a>
            <a href="mailto:info@robocode.uk" className="flex items-center gap-2 py-1 opacity-60 hover:opacity-100 transition-opacity" style={{color:C.textMed}}><Mail size={13} /> info@robocode.uk</a>
          </div>
          <div>
            <p className="font-semibold text-xs uppercase tracking-wider mb-3" style={{ color: C.textHigh }}>Accreditations</p>
            {['Ofsted Registered','FIRST Tech Challenge','DBS Enhanced Checked','JCQ Exam Centre','BCS Accredited','Microsoft Education Partner'].map(a=><p key={a} className="py-1 opacity-60" style={{color:C.textMed}}>{a}</p>)}
          </div>
        </div>
        <div className="py-5 text-xs text-center" style={{ color: C.textLow, borderTop: `1px solid ${C.ghostBorder}` }}>
          <p>© {new Date().getFullYear()} RobocodeUK Limited. Company No. 14161031. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Neon Nav ─── */
function NeonNav({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 40); window.addEventListener('scroll', fn, { passive: true }); return () => window.removeEventListener('scroll', fn) }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ background: scrolled ? `${C.bg}ee` : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none' }}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/test1" className="shrink-0"><Image src="/logo-brand.png" alt="Robocode" width={150} height={35} priority className="h-8 w-auto brightness-0 invert" /></Link>
        <div className="hidden md:flex items-center gap-8">
          {[{l:'Locations',h:'#locations'},{l:'Pricing',h:'#pricing'},{l:'Activities',h:'#activities'},{l:'Reviews',h:'#reviews'}].map(n=><a key={n.h} href={n.h} className="text-sm font-medium transition-colors font-[var(--font-body)]" style={{color:C.textMed}}>{n.l}</a>)}
          <Link href="/book/haf" className="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:scale-[1.03]" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDim})`, color: C.bg }}>Book Now</Link>
        </div>
        <button onClick={()=>setMenuOpen(!menuOpen)} className="md:hidden p-2" style={{color:C.textHigh}}>{menuOpen?<X size={22}/>:<Menu size={22}/>}</button>
      </nav>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="md:hidden absolute top-16 left-0 right-0" style={{background:`${C.bg}ee`,backdropFilter:'blur(20px)',borderBottom:`1px solid ${C.ghostBorder}`}}>
            <div className="px-6 py-5 flex flex-col gap-1">
              {[{l:'Locations',h:'#locations'},{l:'Pricing',h:'#pricing'},{l:'Activities',h:'#activities'},{l:'Reviews',h:'#reviews'}].map(n=><a key={n.h} href={n.h} onClick={()=>setMenuOpen(false)} className="text-sm font-medium py-2.5 transition-colors" style={{color:C.textMed,borderBottom:`1px solid ${C.ghostBorder}`}}>{n.l}</a>)}
              <Link href="/book/haf" onClick={()=>setMenuOpen(false)} className="mt-3 px-6 py-3 rounded-full text-sm font-semibold text-center" style={{background:`linear-gradient(135deg, ${C.primary}, ${C.primaryDim})`,color:C.bg}}>Book Now</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
