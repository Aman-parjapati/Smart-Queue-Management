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
          <h1 className="font-display text-3xl font-black text-slate-900 mt-1">{business?.name || '—'}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white border border-slate-100 px-3.5 py-1.5 rounded-full shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className={`${isLive ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-blue-400' : 'bg-red-500'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-blue-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`font-bold ${isLive ? 'text-blue-600' : 'text-red-500'}`}>
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
                    ? 'bg-blue-50/50 border-blue-500 text-blue-600'
                    : 'bg-white border-slate-200/80 text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-bold ${activeSlot?.id === s.id ? 'text-blue-500' : 'text-slate-400'}`}>
                  Slot {index + 1}
                </span>
                <span className={`font-mono text-base font-bold leading-none my-1 ${activeSlot?.id === s.id ? 'text-blue-600' : 'text-slate-700'}`}>
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
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Now Serving</p>
        {serving.length === 0 ? (
          <div className="card border-dashed border-slate-200 text-center py-12 text-slate-450 bg-white">
            No one is being served right now
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serving.map(b => (
              <div key={b.id} className="card border-blue-200 bg-blue-50/20 text-center relative overflow-hidden animate-pulse-slow">
                <div className="absolute top-0 inset-x-0 h-1 bg-blue-500" />
                <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">Token</p>
                <div className="token-display text-blue-600 font-mono">
                  #{String(b.token_number).padStart(3, '0')}
                </div>
                <p className="text-slate-700 text-sm font-semibold mt-2">{b.users?.name || '—'}</p>
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
            <div key={b.id} className="card text-center py-6 bg-white border border-slate-200/60">
              <p className="font-mono text-2xl font-bold text-slate-800">
                #{String(b.token_number).padStart(3, '0')}
              </p>
              <p className="text-slate-400 text-xs mt-1">Position {i + 1}</p>
              <span className={`badge mt-3 border text-[10px] font-bold ${
                b.status === 'arrived'
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {b.status === 'arrived' ? 'Checked In' : b.status}
              </span>
            </div>
          ))}
          {waiting.length === 0 && (
            <div className="col-span-full card text-center text-slate-400 py-12 bg-white">Queue is empty</div>
          )}
        </div>
      </div>
    </div>
  );
}
