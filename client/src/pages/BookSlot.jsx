import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../components/CustomDatePicker';
import { useAuth } from '../lib/AuthContext';

function SlotCard({ slot, selected, onSelect }) {
  const pct = Math.round((slot.booked_count / slot.max_capacity) * 100);
  const full = slot.booked_count >= slot.max_capacity;

  return (
    <button
      disabled={full}
      onClick={() => onSelect(slot)}
      className={`card text-left transition-all duration-200 w-full
        ${selected?.id === slot.id ? 'border-brand-500 bg-brand-900/20' : 'hover:border-slate-600'}
        ${full ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-lg font-medium text-white">
          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
        </span>
        {full
          ? <span className="badge bg-red-900/40 text-red-400">Full</span>
          : <span className="badge bg-emerald-900/40 text-emerald-400">Available</span>
        }
      </div>
      <div className="text-slate-400 text-sm mb-3">
        {slot.booked_count} / {slot.max_capacity} booked
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

export default function BookSlot() {
  const { user } = useAuth();
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [slots, setSlots]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.get(`/businesses/${businessId}`).then(r => setBusiness(r.data));
  }, [businessId]);

  useEffect(() => {
    api.get(`/slots/business/${businessId}?date=${date}`)
       .then(r => setSlots(r.data))
       .catch(() => setSlots([]));
  }, [businessId, date]);

  async function handleBook() {
    if (!selected) return;
    if (!user) {
      toast.error('Please log in or sign up to confirm your booking.');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/bookings', { slot_id: selected.id });
      toast.success('Booking confirmed! Here is your token.');
      navigate(`/token/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const availableSlots = slots.filter(slot => {
    if (slot.date < todayStr) return false;
    if (slot.date > todayStr) return true;
    return slot.end_time.slice(0, 5) >= currentHHMM;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      {business && (
        <div className="mb-8">
          <p className="text-slate-400 text-sm mb-1 capitalize">{business.category}</p>
          <h1 className="font-display text-3xl font-bold">{business.name}</h1>
          {business.branch && <p className="text-slate-400 mt-1">{business.branch}</p>}
        </div>
      )}

      {/* Date picker */}
      <div className="mb-6">
        <label className="block text-sm text-slate-300 mb-1.5">Select Date</label>
        <CustomDatePicker
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={val => { setDate(val); setSelected(null); }}
        />
      </div>

      {/* Slots */}
      <h2 className="font-display font-semibold text-lg mb-4">Available Time Slots</h2>
      {availableSlots.length === 0 ? (
        <div className="card text-center text-slate-400 py-12 px-6">
          <p className="font-medium text-slate-300 mb-2">No slots available for this date.</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
            If you are the business administrator, please log in to the Staff Portal and go to the **Slots** tab to create time slots for this business.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {availableSlots.map(slot => (
            <SlotCard key={slot.id} slot={slot} selected={selected} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <div className="card border-brand-600/40 bg-brand-900/10 mb-6 animate-slide-up">
          <p className="text-sm text-brand-300 mb-1">Selected slot</p>
          <p className="font-mono font-medium text-white">
            {selected.start_time.slice(0, 5)} – {selected.end_time.slice(0, 5)}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            You'll be token #{selected.booked_count + 1}
          </p>
        </div>
      )}

      <button onClick={handleBook} disabled={!selected || loading} className="btn-primary w-full text-base py-3">
        {loading ? 'Booking…' : 'Confirm Booking'}
      </button>
    </div>
  );
}
