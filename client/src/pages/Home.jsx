import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const CATEGORY_ICONS = {
  clinic: '🏥', salon: '✂️', hospital: '🏨', government: '🏛️',
  bank: '🏦', pharmacy: '💊', default: '🏢',
};

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    api.get('/businesses').then(r => setBusinesses(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-brand-900/40 border border-brand-700/40 rounded-full px-4 py-1.5 text-brand-300 text-sm mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          Live queue tracking
        </div>
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-4">
          Skip the waiting room.<br />
          <span className="text-brand-400">Not the appointment.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Book your slot, get a token, track your position in real time. No more guessing how long the wait is.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-10">
        <input
          type="text"
          placeholder="Search clinics, salons, offices…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input text-center"
        />
      </div>

      {/* Business Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-40 bg-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No businesses found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(biz => (
            <div key={biz.id} className="card hover:border-brand-600/50 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">
                  {CATEGORY_ICONS[biz.category?.toLowerCase()] || CATEGORY_ICONS.default}
                </span>
                <span className="badge bg-slate-700 text-slate-300 capitalize">{biz.category}</span>
              </div>
              <h3 className="font-display font-bold text-lg mb-1 group-hover:text-brand-300 transition-colors">
                {biz.name}
              </h3>
              {biz.branch && <p className="text-slate-400 text-sm mb-1">{biz.branch}</p>}
              {biz.address && <p className="text-slate-500 text-xs mb-4 truncate">{biz.address}</p>}
              <p className="text-slate-500 text-xs mb-4">~{biz.avg_service_time} min per customer</p>
              <div className="flex gap-2">
                <Link to={`/book/${biz.id}`} className="btn-primary text-sm py-2 flex-1 text-center">
                  Book Slot
                </Link>
                <Link to={`/board/${biz.id}`} className="btn-secondary text-sm py-2 px-3 text-center">
                  👁 Live
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
