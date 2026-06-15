import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useSSE } from '../hooks/useSSE';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:  { label: 'Waiting',  color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/40' },
  arrived:  { label: 'Checked In', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40' },
  serving:  { label: 'Your Turn!', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40' },
  done:     { label: 'Done',     color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  skipped:  { label: 'Skipped', color: 'text-red-650 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40' },
};

export default function MyToken() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!booking?.id) return;
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    toast.success('Booking ID copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
       .then(r => setBooking(r.data))
       .finally(() => setLoading(false));
  }, [bookingId]);

  // Connect to live queue via SSE
  const businessId = booking?.slots?.businesses?.id || booking?.slot?.business_id;
  const slotId = booking?.slot_id;
  const { queue, connected } = useSSE(businessId, slotId);

  // Compute my position from live queue
  const activeQueue = queue.filter(b => b.status !== 'done');
  const myEntry    = activeQueue.find(b => b.id === bookingId);
  const position   = myEntry ? activeQueue.indexOf(myEntry) + 1 : null;
  const nowServing = activeQueue.find(b => b.status === 'serving');
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

        <p className="text-slate-400 dark:text-slate-550 text-sm mb-2">Token Number</p>
        <div className="token-display text-slate-900 dark:text-white mb-2">
          #{String(booking.token_number).padStart(3, '0')}
        </div>
        <span className={`badge ${status.bg} border ${status.color} text-base px-3 py-1 font-bold`}>
          {status.label}
        </span>
      </div>

      {/* Live Queue Info */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{position ?? '—'}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Position</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {nowServing ? `#${String(nowServing.token_number).padStart(3,'0')}` : '—'}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Now Serving</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {waitMins > 0 ? `~${waitMins}m` : position === 1 ? 'Soon' : '—'}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Est. Wait</p>
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
          <p className="text-slate-800 dark:text-slate-300 font-medium mb-4">Check-in QR Code</p>
          <img
            src={booking.qr_code}
            alt="QR Code for check-in"
            className="mx-auto rounded-xl w-48 h-48 border border-slate-100 dark:border-slate-800 p-2 bg-white"
          />
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-3">Show this to staff when you arrive</p>
        </div>
      )}

      {/* Slot info */}
      <div className="card mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-450 dark:text-slate-400">Date</span>
          <span className="text-slate-850 dark:text-slate-200">{booking.slots?.date}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-450 dark:text-slate-400">Time Slot</span>
          <span className="text-slate-850 dark:text-slate-200 font-mono">
            {booking.slots?.start_time?.slice(0,5)} – {booking.slots?.end_time?.slice(0,5)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-slate-450 dark:text-slate-400">Booking ID</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-xs" title={booking.id}>
              {booking.id.slice(0,8)}…
            </span>
            <button
              onClick={handleCopy}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40"
              title="Copy full Booking ID"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-emerald-400 animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
