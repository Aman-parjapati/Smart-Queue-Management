import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import api from '../lib/api';

export default function QueueBoard() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [slots, setSlots]       = useState([]);
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    api.get(`/businesses/${businessId}`).then(r => setBusiness(r.data)).catch(() => {});
    
    // Fetch today's slots for the business
    const today = new Date().toISOString().split('T')[0];
    api.get(`/slots/business/${businessId}?date=${today}`)
       .then(r => {
         setSlots(r.data);
         if (r.data.length > 0) setActiveSlot(r.data[0]);
       })
       .catch(() => {});
  }, [businessId]);

  const { queue, connected } = useSSE(businessId, activeSlot?.id);
  const isLive = connected && slots.length > 0;

  const serving  = queue.filter(b => b.status === 'serving');
  const waiting  = queue.filter(b => b.status !== 'serving' && b.status !== 'done');

  return (
    <div className="min-h-screen bg-surface-950 p-6 md:p-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 select-none">
        <div>
          <p className="text-slate-500 text-sm uppercase tracking-widest">Queue Board</p>
          <h1 className="font-display text-3xl font-bold">{business?.name || '—'}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`${isLive ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-emerald-400' : 'bg-red-500'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={isLive ? 'text-emerald-400' : 'text-red-400'}>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Slots Selector */}
      {slots.length > 1 && (
        <div className="mb-8">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Time Slots</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setActiveSlot(s)}
                className={`px-4 py-3.5 rounded-xl text-left transition-all border flex flex-col justify-between h-[100px]
                  ${activeSlot?.id === s.id
                    ? 'bg-brand-600/10 border-brand-500 text-white shadow-lg shadow-brand-600/5'
                    : 'bg-surface-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Slot {index + 1}
                </span>
                <span className="font-mono text-sm font-bold text-white leading-none my-1">
                  {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {s.booked_count} Booked
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Now Serving */}
      <div className="mb-10">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Now Serving</p>
        {serving.length === 0 ? (
          <div className="card border-dashed border-slate-700 text-center py-8 text-slate-500">
            No one is being served right now
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serving.map(b => (
              <div key={b.id} className="card border-emerald-500/50 bg-emerald-900/10 text-center animate-pulse-slow">
                <p className="text-slate-400 text-sm mb-2">Token</p>
                <div className="token-display text-emerald-400">
                  #{String(b.token_number).padStart(3, '0')}
                </div>
                <p className="text-slate-400 text-sm mt-2">{b.users?.name || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue */}
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">
          Waiting — {waiting.length} in queue
        </p>
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {waiting.map((b, i) => (
            <div key={b.id} className="card text-center py-4">
              <p className="font-mono text-2xl font-medium text-white">
                #{String(b.token_number).padStart(3, '0')}
              </p>
              <p className="text-slate-500 text-xs mt-1">Position {i + 1}</p>
              <span className={`badge mt-2 ${
                b.status === 'arrived'
                  ? 'bg-blue-900/40 text-blue-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {b.status}
              </span>
            </div>
          ))}
          {waiting.length === 0 && (
            <div className="col-span-full card text-center text-slate-500 py-8">Queue is empty</div>
          )}
        </div>
      </div>
    </div>
  );
}
