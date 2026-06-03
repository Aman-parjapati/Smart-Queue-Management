import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useSSE } from '../hooks/useSSE';
import api from '../lib/api';
import toast from 'react-hot-toast';

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

// ── Slot Creator ─────────────────────────────────────────────
function SlotCreator({ businessId, onCreated }) {
  const [form, setForm]   = useState({ date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '17:00', max_capacity: 20 });
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      await api.post('/slots', { ...form, business_id: businessId });
      toast.success('Slot created!');
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create slot');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6">
      <h3 className="font-display font-semibold text-lg mb-4">Create Time Slot</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Date', key: 'date', type: 'date' },
          { label: 'Start Time', key: 'start_time', type: 'time' },
          { label: 'End Time', key: 'end_time', type: 'time' },
          { label: 'Max Capacity', key: 'max_capacity', type: 'number' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="block text-sm text-slate-400 mb-1">{label}</label>
            <input type={type} className="input" value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
          </div>
        ))}
      </div>
      <button onClick={handleCreate} disabled={loading} className="btn-primary">
        {loading ? 'Creating…' : 'Create Slot'}
      </button>
    </div>
  );
}

// ── Queue Control Panel ──────────────────────────────────────
function QueueControl({ slotId, queue }) {
  const [loading, setLoading] = useState(false);
  const serving = queue.find(b => b.status === 'serving');
  const next    = queue.find(b => ['pending','arrived'].includes(b.status));

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

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">Queue Control</h3>
        <span className="text-slate-400 text-sm">{queue.length} in queue</span>
      </div>

      {serving && (
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4 mb-4">
          <p className="text-emerald-400 text-xs uppercase tracking-widest mb-1">Now Serving</p>
          <p className="font-mono text-2xl font-bold text-white">
            #{String(serving.token_number).padStart(3,'0')}
          </p>
        </div>
      )}

      <button onClick={callNext} disabled={loading || !next} className="btn-primary w-full mb-3 text-base py-3">
        {loading ? 'Calling…' : next ? `Call Next — #${String(next.token_number).padStart(3,'0')}` : 'Queue Empty'}
      </button>

      {/* Queue list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {queue.map((b, i) => (
          <div key={b.id} className="flex items-center justify-between bg-surface-900 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium text-white w-12">
                #{String(b.token_number).padStart(3,'0')}
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
        {queue.length === 0 && (
          <p className="text-center text-slate-500 py-4">No active queue</p>
        )}
      </div>
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

  return (
    <div className="card mb-6">
      <h3 className="font-display font-semibold text-lg mb-4">QR Check-in</h3>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Paste booking ID…" value={manualId}
          onChange={e => setManualId(e.target.value)} />
        <button className="btn-primary" onClick={() => manualId && checkIn(manualId)}>Check In</button>
      </div>
      {result && (
        <div className={`mt-3 p-3 rounded-xl text-sm ${result.success ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-400'}`}>
          {result.message}
        </div>
      )}
      <p className="text-slate-500 text-xs mt-3">
        For camera QR scanning, install the html5-qrcode scanner component in production.
      </p>
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
export default function AdminDashboard() {
  const { user }  = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeBiz, setActiveBiz]   = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [slots, setSlots]           = useState([]);
  const [tab, setTab]               = useState('queue');

  const { queue, connected } = useSSE(activeBiz?.id);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    api.get('/businesses').then(r => {
      setBusinesses(r.data);
      if (r.data.length > 0) {
        const initialBiz = user?.role === 'staff'
          ? r.data.find(b => b.id === user.business_id)
          : r.data[0];
        setActiveBiz(initialBiz || r.data[0]);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!activeBiz) return;
    const today = new Date().toISOString().split('T')[0];
    api.get(`/slots/business/${activeBiz.id}?date=${today}`)
       .then(r => {
         setSlots(r.data);
         if (r.data.length > 0) setActiveSlot(r.data[0]);
       });
  }, [activeBiz]);

  // Admin sees all tabs; staff sees queue + checkin only
  const TABS = isAdmin
    ? ['queue', 'analytics', 'slots', 'checkin', 'staff']
    : ['queue', 'checkin'];

  const TAB_LABELS = { queue: 'Queue', analytics: 'Analytics', slots: 'Slots', checkin: 'Check-in', staff: '👤 Staff' };

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
        <div className="flex items-center gap-2 text-sm">
          <span className="relative flex h-2 w-2">
            <span className={`${connected ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-500'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Business selector */}
      {businesses.length > 1 && isAdmin && (
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-1.5">Business</label>
          <select className="input max-w-xs" value={activeBiz?.id || ''}
            onChange={e => setActiveBiz(businesses.find(b => b.id === e.target.value))}>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
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

      {tab === 'queue'     && <QueueControl slotId={activeSlot?.id} queue={queue} />}
      {tab === 'analytics' && <AnalyticsPanel businessId={activeBiz?.id} />}
      {tab === 'slots'     && <SlotCreator businessId={activeBiz?.id} onCreated={() => {}} />}
      {tab === 'checkin'   && <QRScanner />}
      {tab === 'staff'     && isAdmin && <StaffManager />}
    </div>
  );
}
