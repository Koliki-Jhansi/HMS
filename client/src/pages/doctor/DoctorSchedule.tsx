import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Building2, DollarSign, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorSchedule: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(60);

  useEffect(() => {
    if (user?.doctor) {
      const days = user.doctor.availableDays ? user.doctor.availableDays.split(',') : [];
      const slots = user.doctor.timeSlots ? user.doctor.timeSlots.split(',') : [];
      setSelectedDays(days.map((d) => d.trim()));
      setTimeSlots(slots.map((s) => s.trim()));
      setRoomNumber(user.doctor.roomNumber || 'Suite 101');
      setConsultationFee(user.doctor.consultationFee || 60);
      setLoading(false);
    }
  }, [user]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddSlot = () => {
    if (newSlot.trim() && !timeSlots.includes(newSlot.trim())) {
      setTimeSlots([...timeSlots, newSlot.trim()]);
      setNewSlot('');
    }
  };

  const handleRemoveSlot = (slotToRemove: string) => {
    setTimeSlots(timeSlots.filter((s) => s !== slotToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.doctor?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await api.put(`/doctors/${user.doctor.id}/schedule`, {
        availableDays: selectedDays.join(','),
        timeSlots: timeSlots.join(','),
        roomNumber,
        consultationFee,
      });

      if (res.data.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your schedule configurations..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl text-white select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Working Hours & Slot Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Define working days, time slots, room location, and consultation fee visible to patients.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Schedule parameters updated successfully!</span>
          </div>
        )}

        {/* Available Working Days */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-cyan-300">
            <Calendar className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Weekly Availability</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`p-3 rounded-2xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-md backdrop-blur-md'
                      : 'bg-slate-950/40 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {day.slice(0, 3)}
                  <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                    {isSelected ? 'Active' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-cyan-300">
            <Clock className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Consultation Slots</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2"
              >
                <span>{slot}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(slot)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm pt-2">
            <input
              type="text"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              placeholder="e.g. 02:30 PM"
              className="w-full p-2.5 bg-slate-950/50 border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleAddSlot}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
            >
              Add Slot
            </button>
          </div>
        </div>

        {/* Room & Fee Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-6 shadow-xl space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Room / Suite Location
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. Suite 204, Wing B"
              className="w-full p-2.5 bg-slate-950/50 border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-6 shadow-xl space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Consultation Fee (USD)
            </label>
            <input
              type="number"
              min={0}
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-950/50 border border-white/15 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-70 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Schedule...' : 'Save Schedule Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorSchedule;
