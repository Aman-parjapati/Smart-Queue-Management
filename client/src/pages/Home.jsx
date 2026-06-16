import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  clinic: '🏥', salon: '✂️', hospital: '🏨', government: '🏛️',
  bank: '🏦', pharmacy: '💊', default: '🏢',
};

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  // Pricing inquiry modal state
  const [inquiryPlan, setInquiryPlan] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', description: '' });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const scrollRef = useRef(null);
  const pricingContainerRef = useRef(null);
  const [activePricingIndex, setActivePricingIndex] = useState(1);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    api.get('/businesses')
      .then(r => setBusinesses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && filtered.length > 3) {
      const interval = setInterval(() => {
        if (scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 5) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            scrollRef.current.scrollBy({ left: 380, behavior: 'smooth' });
          }
        }
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [loading, filtered.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pricingContainerRef.current && window.innerWidth < 768) {
        const container = pricingContainerRef.current;
        const cards = container.children;
        if (cards && cards.length >= 2) {
          const secondCard = cards[1];
          const scrollLeft = secondCard.offsetLeft - (container.clientWidth - secondCard.clientWidth) / 2;
          container.scrollTo({ left: scrollLeft });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePricingScroll = () => {
    if (pricingContainerRef.current && window.innerWidth < 768) {
      const container = pricingContainerRef.current;
      const containerCenter = container.scrollLeft + container.clientWidth / 2;
      let closestIndex = 1;
      let minDistance = Infinity;
      const cards = container.children;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      if (closestIndex !== activePricingIndex) {
        setActivePricingIndex(closestIndex);
      }
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  async function handleInquirySubmit(e) {
    e.preventDefault();
    setInquiryLoading(true);
    try {
      await api.post('/contact', {
        ...inquiryForm,
        plan: inquiryPlan
      });
      toast.success('Our executive will contact you shortly');
      setInquiryPlan(null);
      setInquiryForm({ name: '', email: '', phone: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send inquiry. Please try again.');
    } finally {
      setInquiryLoading(false);
    }
  }

  return (
    <div className="text-slate-800 dark:text-slate-100 font-sans animate-fade-in">
      {/* ── 1. HERO SECTION ── */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold tracking-wider uppercase shadow-sm">
            THE FUTURE OF QUEUE MANAGEMENT
          </div>
          
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
            Skip the wait.<br />
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Own</span> your{' '}
            <span className="bg-gradient-to-r from-brand-500 to-emerald-500 dark:from-brand-400 dark:to-blue-400 bg-clip-text text-transparent">time.</span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Book appointments, track queues live on your phone, and arrive exactly when it's your turn. Say goodbye to crowded waiting rooms.
          </p>

          <div className="flex flex-row items-center gap-8 justify-center lg:justify-start pt-4 select-none">
            <a href="#directory" className="font-bold text-slate-800 dark:text-white hover:opacity-85 flex items-center gap-2 text-base transition-opacity">
              Book Appointment
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a href="#features" className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold py-3.5 px-6 rounded-xl border border-slate-200 dark:border-slate-800 transition-all text-base shadow-sm">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
              </svg>
              Watch Demo
            </a>
          </div>


        </div>

        {/* Hero Right: 3D-Like CSS Mockup */}
        <div className="lg:col-span-5 flex justify-center relative">
          {/* Decorative Background Blob */}
          <div className="absolute w-72 h-72 bg-blue-100 dark:bg-blue-950/20 rounded-full blur-3xl opacity-60 dark:opacity-30 -z-10 top-10 right-10" />

          {/* Mockup Container */}
          <div className="w-full max-w-md relative select-none">
            {/* Live Queue Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl p-6 relative z-10 transition-transform duration-300 hover:scale-[1.02] text-slate-900 dark:text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                    <span className="text-xl text-slate-400 mr-0.5">A</span>045
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">Updated 2s ago</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Status
                  </span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-4" />

              <div className="grid grid-cols-2 gap-4 py-2 text-center relative">
                {/* Vertical Divider line */}
                <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-px bg-slate-100 dark:bg-slate-800/80" />
                
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Your Position</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
                    12 <span className="text-sm text-slate-400 font-sans font-normal">/ 36</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Est. Wait Time</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white font-mono">
                    08 <span className="text-sm text-slate-400 font-sans font-normal">min</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-4" />

              <button className="w-full mt-2 text-sm py-3 font-semibold rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 transition-all">
                View Details
              </button>
            </div>

            {/* Currently Serving Overlay Card */}
            <div className="absolute top-[-24px] left-[-12px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xl rounded-xl p-3.5 flex items-center gap-3.5 z-20 transition-transform hover:scale-105">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </div>
              <div className="pr-2 select-none">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider">Currently Serving</p>
                <p className="font-mono font-bold text-slate-800 dark:text-white text-base mt-0.5">A 032</p>
              </div>
            </div>

            {/* Float details bar */}
            <div className="absolute bottom-[-20px] right-[-8px] sm:right-[-20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg rounded-xl px-4 py-3 flex items-center gap-2 z-20">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Smart Check-in Active</span>
            </div>
          </div>
        </div>
      </section>



      {/* ── 3. DIRECTORY & BOOKING SECTION (id="directory") ── */}
      <section id="directory" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Book slots at local businesses
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Search for registered clinics, offices, and stores to secure your spot today.
          </p>
          
          {/* Search container */}
          <div className="mt-8 max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Search by business name or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pr-12 shadow-sm border-slate-200 dark:border-slate-700/65 bg-white dark:bg-slate-900"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Business Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse h-48 dark:bg-slate-900" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium">No businesses found. Try another search.</div>
        ) : (
          <div className="space-y-8 animate-fade-in px-4">
            
            {/* Wrapper that only contains the slider and is relative */}
            <div className="relative">
              {filtered.length > 3 && (
                <>
                  {/* Left pointer arrow */}
                  <button
                    onClick={() => scroll('left')}
                    className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 w-10 h-10 rounded-full hidden md:flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                    title="Previous"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  {/* Right pointer arrow */}
                  <button
                    onClick={() => scroll('right')}
                    className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 w-10 h-10 rounded-full hidden md:flex items-center justify-center shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                    title="Next"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </>
              )}

              {/* Slider Container */}
              <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filtered.map(biz => (
                  <div
                    key={biz.id}
                    className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start card flex flex-col justify-between hover:border-brand-350 dark:hover:border-brand-800 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-xl shadow-inner select-none">
                          {CATEGORY_ICONS[biz.category?.toLowerCase()] || CATEGORY_ICONS.default}
                        </div>
                        <span className="badge bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60 capitalize font-medium text-xs">
                          {biz.category}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-1">{biz.name}</h3>
                      {biz.branch && <p className="text-slate-400 dark:text-slate-500 text-sm mb-1">{biz.branch}</p>}
                      {biz.address && <p className="text-slate-400 dark:text-slate-500 text-xs mb-3 truncate">{biz.address}</p>}

                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-mono mb-4">
                        <svg className="w-4 h-4 text-blue-500/70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{biz.avg_service_time} min service window
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-slate-100/50 dark:border-slate-800/50 mt-2">
                      <Link
                        to={`/book/${biz.id}`}
                        className="btn-primary text-xs py-2 px-4 flex-1 font-bold tracking-wide rounded-lg text-center"
                      >
                        Book Slot
                      </Link>
                      {biz.has_slots_today ? (
                        <Link
                          to={`/board/${biz.id}`}
                          className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1 font-bold rounded-lg text-center bg-brand-50 dark:bg-blue-950/20 border-brand-200 dark:border-brand-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-brand-600 dark:text-brand-400"
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
                          </span>
                          Live
                        </Link>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-surface-800 border border-slate-100 dark:border-slate-800 text-[11px] py-2 px-3 flex items-center justify-center gap-1 rounded-lg cursor-not-allowed select-none font-semibold">
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redirection CTA */}
            <div className="flex justify-center pt-4 select-none">
              <Link
                to={search ? `/directory?search=${encodeURIComponent(search)}` : "/directory"}
                className="btn-secondary group gap-2 text-xs font-bold py-2.5 px-5 shadow-sm border border-slate-200 dark:border-slate-800"
              >
                Book Queue for Nearby Businesses
                <svg className="w-4 h-4 text-brand-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. FEATURES & TRACKING SIMULATOR (id="features") ── */}
      <section id="features" className="bg-surface-100/50 dark:bg-surface-950/50 border-y border-surface-200 dark:border-surface-700/80 py-20">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Live updates simulator box */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-surface-100 dark:bg-surface-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase font-bold text-slate-400">Live Status Tracker</span>
                <span className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/40 px-2 py-0.5 rounded-full">
                  📢 Serving
                </span>
              </div>

              {/* Status values */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700/60 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Currently Serving</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono mt-1">A 041</p>
                </div>

                <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700/60 p-4 rounded-xl shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Your Token</p>
                      <p className="text-xl font-bold font-mono text-slate-855 dark:text-slate-200">A 045</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Your Position</p>
                      <p className="text-xl font-bold text-slate-855 dark:text-slate-200">12 / 36</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">Queue Progress</p>
                    <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700/60 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Wait Time</p>
                  <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">08 Minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Features Grid */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <p className="text-brand-600 dark:text-brand-400 text-xs font-extrabold uppercase tracking-widest mb-2">Queue management features</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Powerful features for smarter queue management
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'Smart Booking',
                  desc: 'Book appointments in advance and save time from anywhere.',
                  icon: (
                    <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  )
                },
                {
                  title: 'Live Tracking',
                  desc: 'Track your exact position in the queue live on your phone.',
                  icon: (
                    <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H14a2 2 0 012 2v17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-17a2 2 0 012-2zM12 18.75h.008v.008H12v-.008z" />
                    </svg>
                  )
                },
                {
                  title: 'QR Check-in',
                  desc: 'Arrive at the business and scan the QR code to check in instantly.',
                  icon: (
                    <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.125 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 13.5h.75v.75h-.75v-.75zM13.5 16.5h.75v.75h-.75v-.75zM16.5 13.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM15 15h.75v.75H15V15zM15 18h.75v.75H15V18zM18 15h.75v.75H18V15zM18 18h.75v.75H18V18z" />
                    </svg>
                  )
                },
                {
                  title: 'Smart Notifications',
                  desc: 'Get SMS or email alerts when your turn is approaching.',
                  icon: (
                    <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
                    </svg>
                  )
                },
                {
                  title: 'Analytics Dashboard',
                  desc: 'View statistics to optimize average wait times.',
                  icon: (
                    <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  )
                },
                {
                  title: 'Multi-Branch Support',
                  desc: 'Manage slots and capacity across multiple stores seamlessly.',
                  icon: (
                    <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3.75h.008v.008h-.008V3.75z" />
                    </svg>
                  )
                }
              ].map((f, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0 shadow-inner">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{f.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Three simple steps</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">From booking to being served, we make it seamless.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            {
              step: '1',
              title: 'Book Your Slot',
              desc: 'Select your preferred business and choose a time slot.',
              icon: (
                <svg className="w-8 h-8 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            {
              step: '2',
              title: 'Track in Real-Time',
              desc: 'Monitor the live board. Get alerts before your turn.',
              icon: (
                <svg className="w-8 h-8 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H14a2 2 0 012 2v17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-17a2 2 0 012-2zM9 10.5h6" />
                </svg>
              )
            },
            {
              step: '3',
              title: 'Arrive & Get Served',
              desc: 'Scan check-in and get served without any wait.',
              icon: (
                <svg className="w-8 h-8 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              )
            }
          ].map((s, i) => (
            <div key={i} className="card text-center p-8 relative flex flex-col items-center">
              <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs select-none">
                {s.step}
              </div>
              <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center mb-6 shadow-inner">
                {s.icon}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{s.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. ANALYTICS SAAS DASHBOARD MOCKUP ── */}
      <section className="bg-surface-100/50 dark:bg-surface-950/50 border-y border-surface-200 dark:border-surface-700/80 py-20">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-extrabold uppercase tracking-widest">Analytics & Insights</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Data that helps you serve better
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Understand peak hours, average customer visit times, daily queue volume, and staff operational efficiency.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-slate-650 dark:text-slate-300 font-medium">
              {[
                'Real-time queue analytics and reports',
                'Identify peak hours and optimize staff allocation',
                'Monitor customer check-in vs check-out speed',
                'Download summaries and analytics charts with one click'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                  <span className="text-blue-500 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* SaaS Analytics Board CSS illustration */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg bg-surface-100 dark:bg-surface-900/60 border border-surface-200/60 dark:border-surface-700/60 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-white dark:bg-surface-800 border-b border-surface-200/60 dark:border-surface-700/60 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">SmartQueue Dashboard</span>
                <span className="badge bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 text-[10px]">Active</span>
              </div>
              <div className="p-6 space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Customers Served', val: '1,248', change: '+12% this week', color: 'text-brand-600 dark:text-brand-400' },
                    { label: 'Avg. Service Time', val: '12 min', change: '-2m optimization', color: 'text-indigo-650 dark:text-indigo-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-surface-800 border border-surface-200/60 dark:border-surface-700/60 p-4 rounded-xl shadow-sm">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.val}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{stat.change}</p>
                    </div>
                  ))}
                </div>

                {/* SVG mock graph */}
                <div className="bg-white dark:bg-surface-800 border border-surface-200/60 dark:border-surface-700/60 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mb-3">Daily Queue Traffic</p>
                  <div className="h-24 flex items-end justify-between gap-2">
                    {[30, 45, 35, 60, 80, 55, 70, 90, 65, 80].map((val, i) => (
                      <div key={i} className="flex-1 bg-blue-100 dark:bg-brand-950/40 rounded-t-sm hover:bg-brand-500 dark:hover:bg-brand-500 transition-colors" style={{ height: `${val}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PRICING SECTIONS (id="pricing") ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">Pricing Plans</p>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Simple pricing for every business</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Choose the plan that fits your business scale. Cancel anytime.</p>
        </div>

        <div
          ref={pricingContainerRef}
          onScroll={handlePricingScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-5 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 md:items-stretch md:overflow-visible md:pb-0 md:pt-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Plan 1 */}
          <div className={`card flex flex-col justify-between p-8 relative w-[285px] sm:w-[340px] flex-shrink-0 snap-center md:w-auto md:shrink transition-all duration-300 ease-in-out ${
            activePricingIndex === 0 
              ? 'scale-105 z-10 border-blue-500 shadow-xl' 
              : 'scale-95 opacity-85 border-surface-200/60 dark:border-surface-700/80 md:scale-100 md:opacity-100'
          }`}>
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Starter</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹999</span>
                <span className="text-slate-400 dark:text-slate-500 text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-slate-500 dark:text-slate-400 text-sm mb-8">
                <li>✓ 1 Branch</li>
                <li>✓ 1,000 Tokens/Month</li>
                <li>✓ Basic Live Board</li>
                <li>✓ Email Support</li>
              </ul>
            </div>
            <button
              onClick={() => setInquiryPlan('Starter')}
              className="btn-secondary w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Get Started
            </button>
          </div>

          {/* Plan 2: Business (Popular) */}
          <div className={`card flex flex-col justify-between p-8 relative w-[285px] sm:w-[340px] flex-shrink-0 snap-center md:w-auto md:shrink transition-all duration-300 ease-in-out ${
            activePricingIndex === 1
              ? 'scale-105 z-10 border-blue-500 shadow-xl'
              : 'scale-95 opacity-85 border-surface-200/60 dark:border-surface-700/80 md:scale-105 md:z-10 md:border-blue-500 md:shadow-xl md:opacity-100'
          }`}>
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
              POPULAR
            </div>
            <div>
              <p className="text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">Business</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹2,499</span>
                <span className="text-slate-400 dark:text-slate-500 text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-slate-500 dark:text-slate-400 text-sm mb-8">
                <li className="font-medium text-slate-800 dark:text-slate-200">✓ 5 Branches</li>
                <li className="font-medium text-slate-800 dark:text-slate-200">✓ 5,005 Tokens/Month</li>
                <li>✓ Custom Board Themes</li>
                <li>✓ SMS & Email Alerts</li>
                <li>✓ Analytics Dashboard</li>
                <li>✓ Priority Support</li>
              </ul>
            </div>
            <button
              onClick={() => setInquiryPlan('Business')}
              className="btn-primary w-full py-3 rounded-xl shadow-lg shadow-blue-500/20"
            >
              Get Started
            </button>
          </div>

          {/* Plan 3 */}
          <div className={`card flex flex-col justify-between p-8 relative w-[285px] sm:w-[340px] flex-shrink-0 snap-center md:w-auto md:shrink transition-all duration-300 ease-in-out ${
            activePricingIndex === 2
              ? 'scale-105 z-10 border-blue-500 shadow-xl'
              : 'scale-95 opacity-85 border-surface-200/60 dark:border-surface-700/80 md:scale-100 md:opacity-100'
          }`}>
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Enterprise</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Custom</span>
                <span className="text-slate-400 dark:text-slate-500 text-sm">pricing</span>
              </div>
              <ul className="space-y-3 text-slate-500 dark:text-slate-400 text-sm mb-8">
                <li>✓ Unlimited Branches</li>
                <li>✓ Unlimited Tokens</li>
                <li>✓ Dedicated Server Support</li>
                <li>✓ Custom API Integrations</li>
                <li>✓ Whitelabel Branding</li>
                <li>✓ 24/7 Phone Support</li>
              </ul>
            </div>
            <button
              onClick={() => setInquiryPlan('Enterprise')}
              className="btn-secondary w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. FAQS SECTION (id="faq") ── */}
      <section id="faq" className="bg-surface-100 dark:bg-surface-950 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Frequently asked questions</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Have a question? We have answered the most common questions here.</p>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How does SmartQueue work?', a: 'Customers can view your business board, select their preferred date/time slot, and book a token. As their turn approaches, they monitor the live queue progress on their phone and arrive just in time.' },
              { q: 'Can I use SmartQueue for multiple branches?', a: 'Yes! The Business and Enterprise plans allow you to add and manage multiple business branches, slots, and active queues from a single dashboard.' },
              { q: 'Is there a mobile app?', a: 'SmartQueue is fully responsive and functions exactly like a native app on all mobile web browsers. Users do not need to download anything to check tokens or track queues.' },
              { q: 'Can I customize my queue flow?', a: 'Absolutely. As a staff administrator, you can configure average service times per client, total capacities per slot, edit slot details, or trigger immediate queue updates.' }
            ].map((faq, i) => (
              <div key={i} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-blue-400 transition-colors text-base"
                >
                  <span>{faq.q}</span>
                  <span className={`text-xl font-mono text-slate-400 dark:text-slate-500 select-none transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                    openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="min-h-0">
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed pt-3">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING INQUIRY DIALOG ── */}
      {inquiryPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="bg-slate-50 dark:bg-surface-800 px-6 py-4 border-b border-surface-200/60 dark:border-surface-700/80 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">Inquire: {inquiryPlan} Plan</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Please provide your details below</p>
              </div>
              <button
                onClick={() => setInquiryPlan(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xl font-semibold p-1"
                type="button"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="input text-sm"
                  value={inquiryForm.name}
                  onChange={e => setInquiryForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="input text-sm"
                  value={inquiryForm.email}
                  onChange={e => setInquiryForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 99999 99999"
                  className="input text-sm"
                  value={inquiryForm.phone}
                  onChange={e => setInquiryForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Description / Message</label>
                <textarea
                  required
                  rows="3"
                  placeholder="How can we help you? Describe your business requirements..."
                  className="input text-sm resize-none"
                  value={inquiryForm.description}
                  onChange={e => setInquiryForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInquiryPlan(null)}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inquiryLoading}
                  className="btn-primary flex-1 py-2.5 text-sm"
                >
                  {inquiryLoading ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
