import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const CATEGORY_ICONS = {
  clinic: '🏥', salon: '✂️', hospital: '🏨', government: '🏛️',
  bank: '🏦', pharmacy: '💊', default: '🏢',
};

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    api.get('/businesses')
      .then(r => setBusinesses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="text-slate-800 font-sans">
      {/* ── 1. HERO SECTION ── */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-blue-600 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            ✨ The Future of Queue Management
          </div>
          
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900">
            Skip the wait.<br />
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              Own your time.
            </span>
          </h1>

          <p className="text-slate-500 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Book appointments, track queues live on your phone, and arrive exactly when it's your turn. Say goodbye to crowded waiting rooms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            <a href="#directory" className="btn-primary gap-2 shadow-lg shadow-blue-500/20 text-base py-3.5 px-8">
              Book Appointment
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a href="#features" className="btn-secondary text-base py-3.5 px-8 shadow-sm">
              Watch Demo
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-6 border-t border-slate-200/60 max-w-md mx-auto lg:mx-0">
            <div className="flex -space-x-2">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80'
              ].map((src, i) => (
                <img key={i} className="w-8 h-8 rounded-full border-2 border-white object-cover" src={src} alt="User avatar" />
              ))}
            </div>
            <div className="text-slate-500 text-sm">
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <span className="text-amber-400">★★★★★</span>
                <span className="font-semibold text-slate-800">4.8/5</span>
              </div>
              <p className="text-xs">from 2,500+ happy customers</p>
            </div>
          </div>
        </div>

        {/* Hero Right: 3D-Like CSS Mockup */}
        <div className="lg:col-span-5 flex justify-center relative">
          {/* Decorative Background Blob */}
          <div className="absolute w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-60 -z-10 top-10 right-10" />

          {/* Mockup Container */}
          <div className="w-full max-w-md relative select-none">
            {/* Live Queue Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 relative z-10 transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex justify-between items-center mb-4">
                <span className="badge bg-blue-50 text-blue-600 border border-blue-100 font-bold">LIVE QUEUE</span>
                <span className="text-slate-400 text-xs">Updated 2s ago</span>
              </div>
              
              <div className="text-center py-6 border-b border-slate-100">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Your Token</p>
                <div className="text-5xl font-black text-slate-900 tracking-tight font-mono">
                  A 045
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-center">
                <div>
                  <p className="text-slate-400 text-xs">Your Position</p>
                  <p className="text-xl font-bold text-slate-800">12 / 36</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Est. Wait Time</p>
                  <p className="text-xl font-bold text-blue-600">08 min</p>
                </div>
              </div>

              <button className="btn-primary w-full mt-6 text-sm py-3 shadow-md">
                View Details
              </button>
            </div>

            {/* Currently Serving Overlay Card */}
            <div className="absolute top-[-20px] left-[-20px] bg-white border border-slate-100 shadow-lg rounded-xl p-4 flex items-center gap-3 z-20 animate-bounce-slow">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                📢
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Currently Serving</p>
                <p className="font-mono font-bold text-slate-800 text-sm">A 032</p>
              </div>
            </div>

            {/* Float details bar */}
            <div className="absolute bottom-[-20px] right-[-20px] bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-3 flex items-center gap-2 z-20">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-600 font-medium">Smart Check-in Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUSTED BY LOGOS ── */}
      <section className="bg-white border-y border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
            Trusted by 100+ businesses worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 items-center justify-items-center opacity-60">
            {[
              { name: 'Apollo Hospital', style: 'text-emerald-700 font-extrabold' },
              { name: 'Naturals Salon', style: 'text-purple-700 font-semibold italic' },
              { name: 'SBI', style: 'text-blue-700 font-black' },
              { name: 'PNB Bank', style: 'text-amber-800 font-black' },
              { name: 'Narayana', style: 'text-rose-600 font-bold' },
              { name: 'LIC India', style: 'text-blue-800 font-bold tracking-widest' }
            ].map((logo, idx) => (
              <div key={idx} className={`text-base md:text-lg select-none ${logo.style}`}>
                {logo.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. DIRECTORY & BOOKING SECTION (id="directory") ── */}
      <section id="directory" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Book slots at local businesses
          </h2>
          <p className="text-slate-500 mt-2">
            Search for registered clinics, offices, and stores to secure your spot today.
          </p>
          
          {/* Search container */}
          <div className="mt-8 max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Search by business name or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pr-12 shadow-sm border-slate-200"
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
              <div key={i} className="card animate-pulse h-48 bg-white" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium">No businesses found. Try another search.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(biz => (
              <div key={biz.id} className="card bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-inner select-none">
                      {CATEGORY_ICONS[biz.category?.toLowerCase()] || CATEGORY_ICONS.default}
                    </div>
                    <span className="badge bg-slate-50 text-slate-600 border border-slate-200/80 capitalize font-medium text-xs">
                      {biz.category}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-slate-900 text-lg mb-1">{biz.name}</h3>
                  {biz.branch && <p className="text-slate-400 text-sm mb-1">{biz.branch}</p>}
                  {biz.address && <p className="text-slate-400 text-xs mb-3 truncate">{biz.address}</p>}

                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono mb-4">
                    <svg className="w-4 h-4 text-blue-500/70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ~{biz.avg_service_time} min service window
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-50 mt-2">
                  <Link
                    to={`/book/${biz.id}`}
                    className="btn-primary text-xs py-2 px-4 flex-1 font-bold tracking-wide rounded-lg text-center"
                  >
                    Book Slot
                  </Link>
                  {biz.has_slots_today ? (
                    <Link
                      to={`/board/${biz.id}`}
                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1 font-bold rounded-lg text-center bg-blue-50 border-blue-100 hover:bg-blue-100"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                      </span>
                      Live
                    </Link>
                  ) : (
                    <span className="text-slate-400 bg-slate-50 border border-slate-100 text-[11px] py-2 px-3 flex items-center justify-center gap-1 rounded-lg cursor-not-allowed select-none font-semibold">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. FEATURES & TRACKING SIMULATOR (id="features") ── */}
      <section id="features" className="bg-white border-y border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Live updates simulator box */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-2xl shadow-inner p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase font-bold text-slate-400">Live Status Tracker</span>
                <span className="flex items-center gap-1.5 text-xs text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  📢 Serving
                </span>
              </div>

              {/* Status values */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Currently Serving</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight font-mono mt-1">A 041</p>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Your Token</p>
                      <p className="text-xl font-bold font-mono text-slate-800">A 045</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Your Position</p>
                      <p className="text-xl font-bold text-slate-800">12 / 36</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-400 font-semibold mb-1">Queue Progress</p>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-xs text-slate-500">Estimated Wait Time</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">08 Minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Features Grid */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <p className="text-blue-600 text-xs font-extrabold uppercase tracking-widest mb-2">Queue management features</p>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Powerful features for smarter queue management
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: 'Smart Booking', desc: 'Book appointments in advance and save time from anywhere.', icon: '📅' },
                { title: 'Live Tracking', desc: 'Track your exact position in the queue live on your phone.', icon: '📲' },
                { title: 'QR Check-in', desc: 'Arrive at the business and scan the QR code to check in instantly.', icon: '🔳' },
                { title: 'Smart Notifications', desc: 'Get SMS or email alerts when your turn is approaching.', icon: '🔔' },
                { title: 'Analytics Dashboard', desc: 'View statistics to optimize average wait times.', icon: '📈' },
                { title: 'Multi-Branch Support', desc: 'Manage slots and capacity across multiple stores seamlessly.', icon: '🏢' }
              ].map((f, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
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
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Three simple steps</h2>
          <p className="text-slate-500 mt-2">From booking to being served, we make it seamless.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            { step: '1', title: 'Book Your Slot', desc: 'Select your preferred business and choose a time slot.', icon: '🕒' },
            { step: '2', title: 'Track in Real-Time', desc: 'Monitor the live board. Get alerts before your turn.', icon: '📱' },
            { step: '3', title: 'Arrive & Get Served', desc: 'Scan check-in and get served without any wait.', icon: '👍' }
          ].map((s, i) => (
            <div key={i} className="card bg-white text-center p-8 relative flex flex-col items-center">
              <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {s.step}
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-50 text-3xl flex items-center justify-center mb-6">
                {s.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. ANALYTICS SAAS DASHBOARD MOCKUP ── */}
      <section className="bg-white border-y border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-blue-600 text-xs font-extrabold uppercase tracking-widest">Analytics & Insights</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Data that helps you serve better
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Understand peak hours, average customer visit times, daily queue volume, and staff operational efficiency.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-slate-650 font-medium">
              {[
                'Real-time queue analytics and reports',
                'Identify peak hours and optimize staff allocation',
                'Monitor customer check-in vs check-out speed',
                'Download summaries and analytics charts with one click'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="text-blue-500 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* SaaS Analytics Board CSS illustration */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg bg-slate-50 border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-white border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">SmartQueue Dashboard</span>
                <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px]">Active</span>
              </div>
              <div className="p-6 space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Customers Served', val: '1,248', change: '+12% this week', color: 'text-blue-600' },
                    { label: 'Avg. Service Time', val: '12 min', change: '-2m optimization', color: 'text-indigo-600' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.val}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{stat.change}</p>
                    </div>
                  ))}
                </div>

                {/* SVG mock graph */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-3">Daily Queue Traffic</p>
                  <div className="h-24 flex items-end justify-between gap-2">
                    {[30, 45, 35, 60, 80, 55, 70, 90, 65, 80].map((val, i) => (
                      <div key={i} className="flex-1 bg-blue-100 rounded-t-sm hover:bg-blue-600 transition-colors" style={{ height: `${val}%` }}></div>
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
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Pricing Plans</p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Simple pricing for every business</h2>
          <p className="text-slate-500 mt-2">Choose the plan that fits your business scale. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1 */}
          <div className="card bg-white flex flex-col justify-between p-8 border-slate-100 relative">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Starter</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">₹999</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-slate-500 text-sm mb-8">
                <li>✓ 1 Branch</li>
                <li>✓ 1,000 Tokens/Month</li>
                <li>✓ Basic Live Board</li>
                <li>✓ Email Support</li>
              </ul>
            </div>
            <button className="btn-secondary w-full py-2.5 rounded-xl border border-slate-200">Get Started</button>
          </div>

          {/* Plan 2: Business (Popular) */}
          <div className="card bg-white flex flex-col justify-between p-8 border-blue-500 shadow-xl relative scale-105 z-10">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
              POPULAR
            </div>
            <div>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">Business</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">₹2,499</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-slate-500 text-sm mb-8">
                <li className="font-medium text-slate-800">✓ 5 Branches</li>
                <li className="font-medium text-slate-800">✓ 5,000 Tokens/Month</li>
                <li>✓ Custom Board Themes</li>
                <li>✓ SMS & Email Alerts</li>
                <li>✓ Analytics Dashboard</li>
                <li>✓ Priority Support</li>
              </ul>
            </div>
            <button className="btn-primary w-full py-3 rounded-xl shadow-lg shadow-blue-500/20">Get Started</button>
          </div>

          {/* Plan 3 */}
          <div className="card bg-white flex flex-col justify-between p-8 border-slate-100">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Enterprise</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-slate-900">Custom</span>
                <span className="text-slate-400 text-sm">pricing</span>
              </div>
              <ul className="space-y-3 text-slate-500 text-sm mb-8">
                <li>✓ Unlimited Branches</li>
                <li>✓ Unlimited Tokens</li>
                <li>✓ Dedicated Server Support</li>
                <li>✓ Custom API Integrations</li>
                <li>✓ Whitelabel Branding</li>
                <li>✓ 24/7 Phone Support</li>
              </ul>
            </div>
            <button className="btn-secondary w-full py-2.5 rounded-xl border border-slate-200">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* ── 8. FAQS SECTION (id="faq") ── */}
      <section id="faq" className="bg-white border-t border-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently asked questions</h2>
            <p className="text-slate-500 mt-2">Have a question? We have answered the most common questions here.</p>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How does SmartQueue work?', a: 'Customers can view your business board, select their preferred date/time slot, and book a token. As their turn approaches, they monitor the live queue progress on their phone and arrive just in time.' },
              { q: 'Can I use SmartQueue for multiple branches?', a: 'Yes! The Business and Enterprise plans allow you to add and manage multiple business branches, slots, and active queues from a single dashboard.' },
              { q: 'Is there a mobile app?', a: 'SmartQueue is fully responsive and functions exactly like a native app on all mobile web browsers. Users do not need to download anything to check tokens or track queues.' },
              { q: 'Can I customize my queue flow?', a: 'Absolutely. As a staff administrator, you can configure average service times per client, total capacities per slot, edit slot details, or trigger immediate queue updates.' }
            ].map((faq, i) => (
              <div key={i} className="border-b border-slate-100 pb-4">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center text-left py-3 font-semibold text-slate-800 hover:text-blue-600 transition-colors text-base"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl font-mono text-slate-400 select-none">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="text-slate-500 text-sm leading-relaxed mt-2 animate-fade-in pl-1">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
