import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const STATUS_BADGES = {
  pending: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40',
  arrived: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
  serving: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40 animate-pulse',
  done: 'bg-slate-800 text-slate-400',
  skipped: 'bg-red-900/40 text-red-400 border-red-700/40',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/bookings/my')
      .then(r => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">My Bookings</h1>
        <p className="text-slate-400 text-sm mt-1">Track your active and past appointment tokens</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-slate-800" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <p className="text-lg">No bookings found</p>
          <Link to="/" className="btn-primary inline-block mt-4 text-sm px-6 py-2">
            Browse Businesses & Book a Slot
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="card hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-display font-bold text-white text-lg">
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
              <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 gap-3">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500">Token Number</p>
                  <p className="text-2xl font-display font-bold text-white">
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
