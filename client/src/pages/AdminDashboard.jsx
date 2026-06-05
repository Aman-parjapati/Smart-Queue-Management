import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useSSE } from '../hooks/useSSE';
import api from '../lib/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../components/CustomDatePicker';
import { Html5Qrcode } from 'html5-qrcode';

// ── Analytics Panel ─────────────────────────────────────────
function AnalyticsPanel({ businessId }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    api.get(`/analytics/${businessId}`)
       .then(r => setData(r.data))
       .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) return <div className="animate-pulse text-slate-500">Loading analytics…</div>;
  if (!data)   return null;

  const { summary, hourCounts } = data;
  const stats = [
    { label: 'Total', value: summary.total, color: 'text-white' },
    { label: 'Served', value: summary.done, color: 'text-emerald-400' },
    { label: 'Pending', value: summary.pending, color: 'text-yellow-400' },
    { label: 'Skipped', value: summary.skipped, color: 'text-red-400' },
  ];

  return (
    <div className="card mb-6">
      <h3 className="font-display font-semibold text-lg mb-4">Today's Analytics</h3>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-surface-900 rounded-xl p-3 text-center">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      {hourCounts && Object.keys(hourCounts).length > 0 && (
        <div>
          <p className="text-slate-400 text-sm mb-2">Activity by hour</p>
          <div className="flex items-end gap-1 h-16">
            {Array.from({ length: 24 }, (_, h) => {
              const count = hourCounts[h] || 0;
              const max   = Math.max(...Object.values(hourCounts), 1);
              return (
                <div key={h} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div
                    className="w-full bg-brand-600 rounded-sm transition-all"
                    style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? 2 : 0 }}
                    title={`${h}:00 — ${count} events`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-slate-600 text-xs mt-1">
            <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span><span>11PM</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Slots Manager ────────────────────────────────────────────
function SlotsManager({ businessId, slots = [], onRefresh }) {
  const [form, setForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    start_time: '09:00', 
    end_time: '17:00', 
    max_capacity: 20 
  });
  const [loading, setLoading] = useState(false);
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ start_time: '', end_time: '', max_capacity: 20 });
  const [editLoading, setEditLoading] = useState(false);

  // Deleting confirmation state
  const [deletingSlot, setDeletingSlot] = useState(null);

  async function handleCreate() {
    setLoading(true);
    try {
      await api.post('/slots', { ...form, business_id: businessId });
      toast.success('Slot created!');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create slot');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(slot) {
    setEditingId(slot.id);
    setEditForm({
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      max_capacity: slot.max_capacity
    });
  }

  async function handleUpdate(id) {
    setEditLoading(true);
    try {
      await api.put(`/slots/${id}`, editForm);
      toast.success('Slot updated!');
      setEditingId(null);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update slot');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/slots/${id}`);
      toast.success('Slot deleted!');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete slot');
    }
  }

  return (
    <div className="grid md:grid-cols-5 gap-6">
      {/* Creation form */}
      <div className="card md:col-span-2 self-start">
        <h3 className="font-display font-semibold text-lg mb-4">Create Time Slot</h3>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Date</label>
            <CustomDatePicker
              value={form.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={val => setForm(p => ({ ...p, date: val }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Time</label>
            <input type="time" className="input text-sm py-2.5" value={form.start_time}
              onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Time</label>
            <input type="time" className="input text-sm py-2.5" value={form.end_time}
              onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Capacity</label>
            <input type="number" className="input text-sm py-2.5" value={form.max_capacity}
              onChange={e => setForm(p => ({ ...p, max_capacity: parseInt(e.target.value) || 20 }))} />
          </div>
        </div>
        <button onClick={handleCreate} disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating…' : 'Create Slot'}
        </button>
      </div>

      {/* Existing Slots List */}
      <div className="card md:col-span-3">
        <h3 className="font-display font-semibold text-lg mb-4">Today's Slots</h3>
        
        {slots.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8 select-none">No slots created for today yet.</p>
        ) : (
          <div className="space-y-3.5">
            {slots.map((slot, idx) => {
              const isEditing = editingId === slot.id;

              return (
                <div key={slot.id} className="bg-surface-900 border border-slate-800/80 rounded-xl p-4 transition-all">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1 select-none">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Editing Slot {idx + 1}</span>
                        <span className="text-xs text-slate-500">{slot.booked_count} Booked</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Start Time</label>
                          <input type="time" className="input text-xs py-1.5 px-2.5" value={editForm.start_time}
                            onChange={e => setEditForm(p => ({ ...p, start_time: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">End Time</label>
                          <input type="time" className="input text-xs py-1.5 px-2.5" value={editForm.end_time}
                            onChange={e => setEditForm(p => ({ ...p, end_time: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Max Capacity</label>
                        <input type="number" className="input text-xs py-1.5 px-2.5" value={editForm.max_capacity}
                          onChange={e => setEditForm(p => ({ ...p, max_capacity: parseInt(e.target.value) || 20 }))} />
                      </div>
                      <div className="flex gap-2 pt-1.5 select-none">
                        <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5 px-3 flex-1">
                          Cancel
                        </button>
                        <button onClick={() => handleUpdate(slot.id)} disabled={editLoading} className="btn-primary text-xs py-1.5 px-3 flex-1">
                          {editLoading ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 select-none">
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Slot {idx + 1}
                          </span>
                          {slot.booked_count >= slot.max_capacity ? (
                            <span className="badge bg-red-950/40 text-red-400 text-[10px]">Full</span>
                          ) : (
                            <span className="badge bg-emerald-950/40 text-emerald-450 text-[10px]">Active</span>
                          )}
                        </div>
                        <p className="font-mono text-base font-bold text-white tracking-wide">
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 select-none">
                          {slot.booked_count} / {slot.max_capacity} booked
                        </p>
                      </div>
                      <div className="flex gap-2 select-none">
                        <button
                          onClick={() => startEdit(slot)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-700/50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingSlot(slot)}
                          className="text-xs bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors border border-red-900/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="relative bg-surface-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-slide-up origin-center text-center">
            {/* Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-700/30 flex items-center justify-center mx-auto mb-4 text-red-450">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="font-display font-bold text-lg text-white mb-2">Delete Timeslot</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete the slot <span className="font-mono font-bold text-white">{deletingSlot.start_time.slice(0, 5)} – {deletingSlot.end_time.slice(0, 5)}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingSlot(null)}
                className="btn-secondary text-sm py-2 flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = deletingSlot.id;
                  setDeletingSlot(null);
                  handleDelete(id);
                }}
                className="btn-primary bg-red-600 hover:bg-red-500 border-none text-sm py-2 flex-1 font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Queue Control Panel ──────────────────────────────────────
function QueueControl({ slotId, queue, slots = [], activeSlot = null, setActiveSlot = () => {} }) {
  const [loading, setLoading] = useState(false);
  const serving = queue.find(b => b.status === 'serving');
  const next    = queue.find(b => ['pending','arrived'].includes(b.status));

  const activeQueue = queue.filter(b => b.status !== 'done');
  const completedQueue = queue.filter(b => b.status === 'done');

  async function callNext() {
    if (!slotId) return toast.error('No active slot');
    setLoading(true);
    try {
      await api.post('/queue/next', { slotId });
      toast.success('Called next token!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function skip(bookingId) {
    setLoading(true);
    try {
      await api.post('/queue/skip', { bookingId, slotId });
      toast.success('Token skipped');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function complete(bookingId) {
    setLoading(true);
    try {
      await api.post('/queue/complete', { bookingId, slotId });
      toast.success('Service completed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">Queue Control</h3>
        <span className="text-slate-400 text-sm">{activeQueue.length} in queue</span>
      </div>

      {slots.length > 1 && (
        <div className="mb-5 bg-surface-950 p-3.5 rounded-xl border border-slate-800/60">
          <label className="block text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">Select Time Slot to Manage</label>
          <div className="grid grid-cols-2 gap-3">
            {slots.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSlot(s)}
                className={`px-4 py-3 rounded-xl text-left transition-all border flex flex-col justify-between h-[90px]
                  ${activeSlot?.id === s.id
                    ? 'bg-brand-600/10 border-brand-500 text-white shadow-lg shadow-brand-600/5'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
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

      {serving && (
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-xs uppercase tracking-widest mb-1">Now Serving</p>
            <p className="font-mono text-2xl font-bold text-white mb-1">
              #{String(serving.token_number).padStart(3,'0')}
            </p>
            <p className="text-slate-300 text-sm">
              Customer: <span className="text-white font-medium">{serving.users?.name || '—'}</span>
            </p>
          </div>
          <button
            onClick={() => complete(serving.id)}
            disabled={loading}
            className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-none text-xs py-2 px-3.5 self-center"
          >
            {loading ? 'Completing…' : 'Complete'}
          </button>
        </div>
      )}

      <button onClick={callNext} disabled={loading || !next} className="btn-primary w-full mb-3 text-base py-3">
        {loading ? 'Calling…' : next ? `Call Next — #${String(next.token_number).padStart(3,'0')}` : 'Queue Empty'}
      </button>

      {/* Queue list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {activeQueue.map((b, i) => (
          <div key={b.id} className="flex items-center justify-between bg-surface-900 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium text-white w-12">
                #{String(b.token_number).padStart(3,'0')}
              </span>
              <span className="text-slate-300 text-sm font-medium">
                {b.users?.name || '—'}
              </span>
              <span className={`badge ${
                b.status === 'serving'  ? 'bg-emerald-900/40 text-emerald-400' :
                b.status === 'arrived'  ? 'bg-blue-900/40 text-blue-400' :
                b.status === 'skipped'  ? 'bg-red-900/40 text-red-400' :
                'bg-slate-700 text-slate-400'
              }`}>{b.status}</span>
            </div>
            {['pending','arrived'].includes(b.status) && (
              <button onClick={() => skip(b.id)} className="text-slate-500 hover:text-red-400 text-xs transition-colors">
                Skip
              </button>
            )}
          </div>
        ))}
        {activeQueue.length === 0 && (
          <p className="text-center text-slate-500 py-4">No active queue</p>
        )}
      </div>

      {/* Completed History */}
      {completedQueue.length > 0 && (
        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Completed History</h4>
            <span className="badge bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5">{completedQueue.length} served</span>
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {completedQueue.map((b) => (
              <div key={b.id} className="flex items-center justify-between bg-slate-900/40 rounded-xl px-4 py-2 border border-slate-850">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 w-12">#{String(b.token_number).padStart(3, '0')}</span>
                  <span className="text-slate-300 text-sm font-medium">{b.users?.name || '—'}</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-semibold uppercase bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                  Served
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── QR Check-in Scanner ──────────────────────────────────────
function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [result, setResult]     = useState(null);

  async function checkIn(bookingId) {
    try {
      const { data } = await api.post('/bookings/checkin', { bookingId });
      setResult({ success: true, message: `Token #${data.booking.token_number} checked in!` });
      toast.success('Check-in successful!');
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Check-in failed' });
      toast.error('Check-in failed');
    }
  }

  useEffect(() => {
    let html5QrCode = null;
    let isMounted = true;

    if (scanning) {
      html5QrCode = new Html5Qrcode("reader");
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          checkIn(decodedText);
          if (isMounted) {
            setScanning(false);
          }
        },
        () => {} // ignore scan failures
      ).catch(err => {
        console.error("QR scanner start failed:", err);
        toast.error("Could not access camera. Please check permissions.");
        if (isMounted) {
          setScanning(false);
        }
      });
    }

    return () => {
      isMounted = false;
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Failed to stop QR scanner", err));
        }
      }
    };
  }, [scanning]);

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4 select-none">
        <h3 className="font-display font-semibold text-lg">QR Check-in</h3>
        {!scanning && (
          <button 
            onClick={() => { setScanning(true); setResult(null); }}
            className="text-xs bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg border border-brand-500/20 flex items-center gap-1.5 transition-all font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            Scan with Camera
          </button>
        )}
      </div>

      {scanning && (
        <div className="relative mb-6 mx-auto w-full max-w-sm rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
          <div className="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden mb-4">
            <div id="reader" className="w-full h-full"></div>
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[220px] h-[220px] border-2 border-dashed border-emerald-500 rounded-xl flex items-center justify-center bg-emerald-500/5">
                <div className="w-[200px] h-0.5 bg-emerald-400 absolute animate-pulse shadow-md shadow-emerald-500/50" />
              </div>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={() => setScanning(false)}
            className="btn-secondary w-full text-xs py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border-red-900/20"
          >
            Cancel Scanning
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Paste booking ID…" value={manualId}
          onChange={e => setManualId(e.target.value)} />
        <button className="btn-primary" onClick={() => manualId && checkIn(manualId)}>Check In</button>
      </div>

      {result && (
        <div className={`mt-3 p-3 rounded-xl text-sm ${result.success ? 'bg-emerald-900/20 text-emerald-455' : 'bg-red-900/20 text-red-400'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}

// ── Staff Manager (admin only) ───────────────────────────────
function StaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  function fetchStaff() {
    api.get('/auth/staff').then(r => setStaffList(r.data)).finally(() => setFetching(false));
  }
  useEffect(() => { fetchStaff(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/staff', form);
      toast.success(`Staff account created for ${form.name}`);
      setForm({ name: '', email: '', phone: '', password: '' });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove ${name} from staff?`)) return;
    try {
      await api.delete(`/auth/staff/${id}`);
      toast.success('Staff removed');
      fetchStaff();
    } catch {
      toast.error('Failed to remove staff');
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="card">
        <h3 className="font-display font-semibold text-lg mb-1">Add Staff Member</h3>
        <p className="text-slate-500 text-sm mb-4">
          Share the email and password with them directly — they cannot self-register.
        </p>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Name',     key: 'name',     type: 'text',     placeholder: 'Priya Sharma'      },
              { label: 'Email',    key: 'email',    type: 'email',    placeholder: 'priya@clinic.com'  },
              { label: 'Phone',    key: 'phone',    type: 'tel',      placeholder: '+91 90000 00000'   },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Set a strong password' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input type={type} required={key !== 'phone'} className="input text-sm py-2.5"
                  value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating…' : '+ Add Staff'}
          </button>
        </form>
      </div>

      {/* Staff list */}
      <div className="card">
        <h3 className="font-display font-semibold text-lg mb-4">
          Current Staff <span className="text-slate-500 font-normal text-base">({staffList.length})</span>
        </h3>
        {fetching ? (
          <p className="text-slate-500 animate-pulse text-sm">Loading…</p>
        ) : staffList.length === 0 ? (
          <p className="text-slate-500 text-sm">No staff added yet.</p>
        ) : (
          <div className="space-y-2">
            {staffList.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-surface-900 rounded-xl px-4 py-3">
                <div>
                  <p className="text-slate-200 text-sm font-medium">{s.name}</p>
                  <p className="text-slate-500 text-xs">{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                </div>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="text-slate-600 hover:text-red-400 text-xs transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────
// ── Create Business Form (For Admins who don't have a business yet) ──
function CreateBusinessForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    category: 'clinic',
    address: '',
    branch: '',
    avg_service_time: 15
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/businesses', form);
      toast.success(`Business "${data.name}" created successfully!`);
      
      // Auto-create default slots for today
      try {
        const today = new Date().toISOString().split('T')[0];
        await api.post('/slots', {
          business_id: data.id,
          date: today,
          start_time: '09:00',
          end_time: '12:00',
          max_capacity: 20
        });
        await api.post('/slots', {
          business_id: data.id,
          date: today,
          start_time: '13:00',
          end_time: '17:00',
          max_capacity: 20
        });
        toast.success('Default time slots created for today!');
      } catch (slotErr) {
        console.error('Failed to auto-create slots:', slotErr);
      }

      onCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-lg mx-auto">
      <h3 className="font-display font-semibold text-xl mb-2 text-white">Create Your Business</h3>
      <p className="text-slate-400 text-sm mb-6">You must create a business before you can manage slots, queues, or staff.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Business Name</label>
          <input
            type="text"
            required
            className="input"
            placeholder="e.g. City Dental Clinic"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            >
              <option value="clinic">🏥 Clinic</option>
              <option value="salon">✂️ Salon</option>
              <option value="hospital">🏨 Hospital</option>
              <option value="government">🏛️ Government</option>
              <option value="bank">🏦 Bank</option>
              <option value="pharmacy">💊 Pharmacy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Branch</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Downtown"
              value={form.branch}
              onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Address</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. 123 Main St, Sector 4"
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Avg Service Time (mins)</label>
          <input
            type="number"
            required
            min="1"
            className="input"
            value={form.avg_service_time}
            onChange={e => setForm(p => ({ ...p, avg_service_time: parseInt(e.target.value) }))}
          />
        </div>

        <div className="flex gap-3 mt-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
          )}
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Business'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Business Selector Dropdown ───────────────────────────────
function BusinessSelector({ businesses, activeBiz, setActiveBiz, onAddBusiness }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex gap-3 items-end mb-6">
      <div className="flex-1 max-w-xs relative" ref={dropdownRef}>
        <label className="block text-sm text-slate-400 mb-1.5 font-medium">Business</label>
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input flex items-center justify-between w-full text-left bg-surface-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-slate-200 hover:border-brand-500/50 transition-all font-medium"
        >
          <span>{activeBiz?.name || 'Select Business'}</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-surface-950 border border-slate-700/60 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-slide-up">
            {businesses.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setActiveBiz(b);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                  ${activeBiz?.id === b.id 
                    ? 'bg-brand-600/20 text-brand-300 font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                <span>{b.name}</span>
                {activeBiz?.id === b.id && (
                  <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button
        onClick={onAddBusiness}
        className="btn-secondary py-2.5 px-4 h-[44px] flex items-center justify-center text-sm font-medium transition-all rounded-xl"
      >
        + Add Business
      </button>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboard() {
  const { user }  = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeBiz, setActiveBiz]   = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [slots, setSlots]           = useState([]);
  const [tab, setTab]               = useState('queue');
  const [showCreateBiz, setShowCreateBiz] = useState(false);

  const { queue, connected } = useSSE(activeBiz?.id, activeSlot?.id);
  const isAdmin = user?.role === 'admin';
  const isLive = connected && slots.length > 0;

  useEffect(() => {
    api.get('/businesses').then(r => {
      const filtered = user?.role === 'admin'
        ? r.data.filter(b => b.owner_id === user.id)
        : r.data.filter(b => b.id === user.business_id);
      
      setBusinesses(filtered);
      if (filtered.length > 0) {
        setActiveBiz(filtered[0]);
      } else {
        setActiveBiz(null);
      }
    });
  }, [user]);

  const refreshSlots = () => {
    if (!activeBiz) return;
    const today = new Date().toISOString().split('T')[0];
    api.get(`/slots/business/${activeBiz.id}?date=${today}`)
       .then(r => {
         setSlots(r.data);
         if (r.data.length > 0) {
           setActiveSlot(prev => r.data.find(s => s.id === prev?.id) || r.data[0]);
         } else {
           setActiveSlot(null);
         }
       })
       .catch(() => {
         setSlots([]);
         setActiveSlot(null);
       });
  };

  useEffect(() => {
    refreshSlots();
  }, [activeBiz]);

  function handleBusinessCreated(newBiz) {
    setBusinesses(prev => [...prev, newBiz]);
    setActiveBiz(newBiz);
    setShowCreateBiz(false);
  }

  // Admin sees all tabs; staff sees queue + slots + checkin
  const TABS = isAdmin
    ? ['queue', 'analytics', 'slots', 'checkin', 'staff']
    : ['queue', 'slots', 'checkin'];

  const TAB_LABELS = { queue: 'Queue', analytics: 'Analytics', slots: 'Slots', checkin: 'Check-in', staff: '👤 Staff' };

  if (businesses.length === 0 || showCreateBiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              {user?.name}
              <span className={`ml-2 badge ${isAdmin ? 'bg-brand-900/40 text-brand-400' : 'bg-slate-700 text-slate-400'}`}>
                {user?.role}
              </span>
            </p>
          </div>
        </div>
        
        {isAdmin ? (
          <CreateBusinessForm 
            onCreated={handleBusinessCreated} 
            onCancel={businesses.length > 0 ? () => setShowCreateBiz(false) : null} 
          />
        ) : (
          <div className="card text-center py-10">
            <p className="text-slate-400 font-medium">No business associated with this staff account.</p>
            <p className="text-slate-500 text-sm mt-2">Please contact your administrator to assign you to a business.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {user.name}
            <span className={`ml-2 badge ${isAdmin ? 'bg-brand-900/40 text-brand-400' : 'bg-slate-700 text-slate-400'}`}>
              {user.role}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm select-none">
          <span className="relative flex h-2 w-2">
            <span className={`${isLive ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-emerald-400' : 'bg-red-500'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`text-xs ${isLive ? 'text-emerald-400' : 'text-red-400'}`}>{isLive ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Business selector */}
      {isAdmin && (
        <BusinessSelector
          businesses={businesses}
          activeBiz={activeBiz}
          setActiveBiz={setActiveBiz}
          onAddBusiness={() => setShowCreateBiz(true)}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-900 rounded-xl p-1 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all min-w-[70px]
              ${tab === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'queue'     && (
        <QueueControl
          slotId={activeSlot?.id}
          queue={queue}
          slots={slots}
          activeSlot={activeSlot}
          setActiveSlot={setActiveSlot}
        />
      )}
      {tab === 'analytics' && <AnalyticsPanel businessId={activeBiz?.id} />}
      {tab === 'slots'     && (
        <SlotsManager
          businessId={activeBiz?.id}
          slots={slots}
          onRefresh={refreshSlots}
        />
      )}
      {tab === 'checkin'   && <QRScanner />}
      {tab === 'staff'     && isAdmin && <StaffManager />}
    </div>
  );
}
