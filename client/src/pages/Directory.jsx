import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const CATEGORY_ICONS = {
  clinic: '🏥', salon: '✂️', hospital: '🏨', government: '🏛️',
  bank: '🏦', pharmacy: '💊', default: '🏢',
};

const CATEGORIES = [
  { id: 'all', name: 'All Services', icon: '✨' },
  { id: 'clinic', name: 'Clinics', icon: '🏥' },
  { id: 'salon', name: 'Salons & Spas', icon: '✂️' },
  { id: 'hospital', name: 'Hospitals', icon: '🏨' },
  { id: 'government', name: 'Government', icon: '🏛️' },
  { id: 'bank', name: 'Banks', icon: '🏦' },
  { id: 'pharmacy', name: 'Pharmacies', icon: '💊' },
];

export default function Directory() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    api.get('/businesses')
      .then(r => setBusinesses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.branch && b.branch.toLowerCase().includes(search.toLowerCase())) ||
      (b.category && b.category.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      (b.category && b.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-100 select-none animate-fade-in">
      {/* ── HEADER ── */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/40 rounded-full px-3.5 py-1 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
          🔍 Discover Services
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Explore Local Businesses
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Browse active shops, banks, and clinics to book slots and track your queue status instantly.
        </p>
      </div>

      {/* ── SEARCH & FILTERS ── */}
      <div className="space-y-6 mb-10">
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <input
            type="text"
            placeholder="Search by name, branch, or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pr-12 shadow-sm border-slate-200 dark:border-slate-700/65 bg-white dark:bg-slate-900 text-sm py-3"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-3 scrollbar-none mask-image-horizontal">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all border shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-brand-400 border-brand-500 text-slate-900 shadow-md shadow-brand-400/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── BUSINESS GRID ── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-52 dark:bg-slate-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-1">No matches found</h3>
          <p className="text-sm text-slate-400 mb-4">
            Try adjusting your search criteria or selecting a different category.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('all'); }}
            className="btn-secondary text-xs py-2 px-4"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(biz => (
            <div key={biz.id} className="card flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-800 transition-all duration-300">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-xl shadow-inner select-none">
                    {CATEGORY_ICONS[biz.category?.toLowerCase()] || CATEGORY_ICONS.default}
                  </div>
                  <span className="badge bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-450 border border-slate-200/80 dark:border-slate-700/60 capitalize font-semibold text-[10px]">
                    {biz.category}
                  </span>
                </div>

                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-0.5">{biz.name}</h3>
                {biz.branch && <p className="text-slate-400 dark:text-slate-500 text-xs mb-1 font-medium">{biz.branch}</p>}
                {biz.address && <p className="text-slate-450 dark:text-slate-500 text-xs mb-3 truncate leading-normal">{biz.address}</p>}

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-450 text-[11px] font-mono mb-4">
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
                    className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-bold rounded-lg text-center bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                    Live
                  </Link>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-surface-800 border border-slate-100 dark:border-slate-855 text-[11px] py-2 px-3 flex items-center justify-center gap-1 rounded-lg cursor-not-allowed select-none font-semibold">
                    Offline
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
