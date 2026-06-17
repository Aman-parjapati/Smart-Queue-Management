import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const STATUS_BADGES = {
  pending: 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 border-yellow-250 dark:border-yellow-700/40',
  arrived: 'bg-brand-50 dark:bg-blue-900/40 text-brand-600 dark:text-brand-400 border-blue-200 dark:border-blue-700/40',
  serving: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-emerald-700/40 animate-pulse',
  done: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  skipped: 'bg-red-50 dark:bg-red-900/40 text-red-650 dark:text-red-400 border-red-200 dark:border-red-700/40',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // 'all', 'active', 'done', 'skipped'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = oldest first (booked sequence), 'desc' = newest first

  useEffect(() => {
    api.get('/bookings/my')
      .then(r => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'arrived', 'serving'].includes(b.status);
    return b.status === filter; // 'done' or 'skipped'
  });

  const sortedAndFilteredBookings = [...filteredBookings].sort((a, b) => {
    const dateTimeStrA = `${a.slots?.date || ''}T${a.slots?.start_time || '00:00:00'}`;
    const dateTimeStrB = `${b.slots?.date || ''}T${b.slots?.start_time || '00:00:00'}`;
    const timeA = new Date(dateTimeStrA).getTime();
    const timeB = new Date(dateTimeStrB).getTime();
    
    if (timeA !== timeB) {
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }
    return sortOrder === 'asc'
      ? (a.token_number || 0) - (b.token_number || 0)
      : (b.token_number || 0) - (a.token_number || 0);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">My Bookings</h1>
        <p className="text-slate-400 text-sm mt-1">Track your active and past appointment tokens</p>
      </div>

      {/* Filter and Sort controls */}
      {!loading && bookings.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none bg-slate-50/50 dark:bg-surface-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'done', label: 'Completed' },
              { id: 'skipped', label: 'Skipped' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all ${
                  filter === tab.id
                    ? 'bg-brand-600/10 dark:bg-brand-500/10 text-brand-500 dark:text-brand-400 border-brand-500/35'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Order:</span>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 px-3 py-2 rounded-xl font-semibold transition-all"
            >
              {sortOrder === 'asc' ? (
                <>
                  <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                  </svg>
                  Date (Oldest First)
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5L21 12.75m0 0l-3.75 3.75M21 12.75V3" />
                  </svg>
                  Date (Newest First)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <p className="text-lg">No bookings found</p>
          <Link to="/" className="btn-primary inline-block mt-4 text-sm px-6 py-2">
            Browse Businesses & Book a Slot
          </Link>
        </div>
      ) : sortedAndFilteredBookings.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <p className="text-lg">No bookings found with the selected filter</p>
          <button onClick={() => setFilter('all')} className="btn-secondary inline-block mt-4 text-sm px-6 py-2">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAndFilteredBookings.map(b => (
            <div key={b.id} className="card hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-display font-bold text-slate-900 dark:text-white text-lg">
                    {b.slots?.businesses?.name}
                  </span>
                  <span className={`badge border capitalize ${STATUS_BADGES[b.status] || STATUS_BADGES.pending}`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-slate-400 text-sm space-y-1">
                  <p>📅 Date: {b.slots?.date}</p>
                  <p className="font-mono">
                    ⏰ Time: {b.slots?.start_time?.slice(0, 5)} – {b.slots?.end_time?.slice(0, 5)}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-150 dark:border-slate-800 pt-3 sm:pt-0 gap-3">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500">Token Number</p>
                  <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    #{String(b.token_number).padStart(3, '0')}
                  </p>
                </div>
                <Link to={`/token/${b.id}`} className="btn-primary text-xs py-2 px-4">
                  View Live Queue →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
