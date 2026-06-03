import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useSSE } from '../hooks/useSSE';

const STATUS_CONFIG = {
  pending:  { label: 'Waiting',  color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/40' },
  arrived:  { label: 'Checked In', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-700/40' },
  serving:  { label: 'Your Turn!', color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-700/40' },
  done:     { label: 'Done',     color: 'text-slate-400', bg: 'bg-slate-800' },
  skipped:  { label: 'Skipped', color: 'text-red-400', bg: 'bg-red-900/20 border-red-700/40' },
};

export default function MyToken() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
       .then(r => setBooking(r.data))
       .finally(() => setLoading(false));
  }, [bookingId]);

  // Connect to live queue via SSE
  const businessId = booking?.slots?.businesses?.id || booking?.slot?.business_id;
  const { queue, connected } = useSSE(businessId);

  // Compute my position from live queue
  const myEntry    = queue.find(b => b.id === bookingId);
  const position   = myEntry ? queue.indexOf(myEntry) + 1 : null;
  const nowServing = queue.find(b => b.status === 'serving');
  const waitTokens = myEntry ? (myEntry.token_number - (nowServing?.token_number || 0)) : null;
  const avgTime    = booking?.slots?.businesses?.avg_service_time || 10;
  const waitMins   = waitTokens > 0 ? waitTokens * avgTime : 0;

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-400 animate-pulse">Loading booking…</div>;
  }
  if (!booking) {
    return <div className="text-center py-20 text-slate-400">Booking not found.</div>;
  }

  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const isServing = booking.status === 'serving';

  return (
    <div className="max-w-lg mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-slate-400 text-sm">{booking.slots?.businesses?.name}</p>
        <h1 className="font-display text-2xl font-bold mt-1">Your Token</h1>
      </div>

      {/* Token Card */}
      <div className={`card border ${status.bg} mb-6 text-center`}>
        {isServing && (
          <div className="mb-4 py-2 px-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30 animate-pulse-slow">
            <span className="text-emerald-300 font-semibold">🎉 It's your turn! Please proceed.</span>
          </div>
        )}

        <p className="text-slate-400 text-sm mb-2">Token Number</p>
        <div className="token-display text-white mb-2">
          #{String(booking.token_number).padStart(3, '0')}
        </div>
        <span className={`badge ${status.bg} border ${status.color} text-base px-3 py-1`}>
          {status.label}
        </span>
      </div>

      {/* Live Queue Info */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-white">{position ?? '—'}</p>
          <p className="text-slate-400 text-xs mt-1">Position</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-white">
            {nowServing ? `#${String(nowServing.token_number).padStart(3,'0')}` : '—'}
          </p>
          <p className="text-slate-400 text-xs mt-1">Now Serving</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-white">
            {waitMins > 0 ? `~${waitMins}m` : position === 1 ? 'Soon' : '—'}
          </p>
          <p className="text-slate-400 text-xs mt-1">Est. Wait</p>
        </div>
      </div>

      {/* SSE status */}
      <div className="flex items-center justify-center gap-2 mb-8 text-xs text-slate-500">
        <span className={`relative flex h-2 w-2`}>
          <span className={`${connected ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
        </span>
        {connected ? 'Live updates connected' : 'Reconnecting…'}
      </div>

      {/* QR Code */}
      {booking.qr_code && (
        <div className="card text-center">
          <p className="text-slate-300 font-medium mb-4">Check-in QR Code</p>
          <img
            src={booking.qr_code}
            alt="QR Code for check-in"
            className="mx-auto rounded-xl w-48 h-48"
          />
          <p className="text-slate-500 text-xs mt-3">Show this to staff when you arrive</p>
        </div>
      )}

      {/* Slot info */}
      <div className="card mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Date</span>
          <span className="text-slate-200">{booking.slots?.date}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-400">Time Slot</span>
          <span className="text-slate-200 font-mono">
            {booking.slots?.start_time?.slice(0,5)} – {booking.slots?.end_time?.slice(0,5)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-400">Booking ID</span>
          <span className="text-slate-500 font-mono text-xs">{booking.id.slice(0,8)}…</span>
        </div>
      </div>
    </div>
  );
}
