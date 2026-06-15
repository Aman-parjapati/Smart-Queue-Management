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
    <div className="p-6 md:p-12 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 select-none">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Queue Board</p>
          <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white mt-1">{business?.name || '—'}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-sm text-slate-800 dark:text-slate-100">
          <span className="relative flex h-2 w-2">
            <span className={`${isLive ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-amber-400' : 'bg-red-500'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-amber-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`font-bold ${isLive ? 'text-amber-600 dark:text-amber-400' : 'text-red-550 dark:text-red-400'}`}>
            {isLive ? 'LIVE UPDATES' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Slots Selector */}
      {slots.length > 1 && (
        <div className="mb-10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Time Slots</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {slots.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setActiveSlot(s)}
                className={`px-4 py-3 rounded-xl text-left transition-all border flex flex-col justify-between h-[100px] shadow-sm
                  ${activeSlot?.id === s.id
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 text-amber-600 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'}`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-bold ${activeSlot?.id === s.id ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  Slot {index + 1}
                </span>
                <span className={`font-mono text-base font-bold leading-none my-1 ${activeSlot?.id === s.id ? 'text-amber-600 dark:text-blue-300' : 'text-slate-700 dark:text-slate-350'}`}>
                  {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {s.booked_count} Booked
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Now Serving */}
      <div className="mb-10">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Now Serving</p>
        {serving.length === 0 ? (
          <div className="card border-dashed border-slate-200 dark:border-slate-800 text-center py-12 text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900">
            No one is being served right now
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serving.map(b => (
              <div key={b.id} className="card border-blue-200 dark:border-blue-900/60 bg-amber-50/20 dark:bg-blue-950/10 text-center relative overflow-hidden animate-pulse-slow">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
                <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold mb-2">Token</p>
                <div className="token-display text-amber-600 dark:text-amber-400 font-mono">
                  #{String(b.token_number).padStart(3, '0')}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold mt-2">{b.users?.name || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
          Waiting — {waiting.length} in queue
        </p>
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {waiting.map((b, i) => (
            <div key={b.id} className="card text-center py-6 bg-white dark:bg-slate-900 border border-slate-205/65 dark:border-slate-800/60">
              <p className="font-mono text-2xl font-bold text-slate-850 dark:text-white">
                #{String(b.token_number).padStart(3, '0')}
              </p>
              <p className="text-slate-450 dark:text-slate-500 text-xs mt-1">Position {i + 1}</p>
              <span className={`badge mt-3 border text-[10px] font-bold ${
                b.status === 'arrived'
                  ? 'bg-amber-50 dark:bg-blue-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                {b.status === 'arrived' ? 'Checked In' : b.status}
              </span>
            </div>
          ))}
          {waiting.length === 0 && (
            <div className="col-span-full card text-center text-slate-550 dark:text-slate-500 py-12 bg-white dark:bg-slate-900">Queue is empty</div>
          )}
        </div>
      </div>
    </div>
  );
}
