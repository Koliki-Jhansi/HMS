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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Working Hours & Slot Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Define the working days, time slots, room location, and consultation fee visible to patients booking online.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Your schedule and consultation settings have been successfully updated!</span>
          </div>
        )}

        {/* Working Days */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Available Consulting Days</h3>
              <p className="text-xs text-slate-500">Select the days you are available for OPD consultations</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  <span className="text-[10px] font-normal">{isSelected ? 'Active' : 'Off'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Consultation Time Slots</h3>
              <p className="text-xs text-slate-500">Define the bookable appointment slots per working day</p>
            </div>
          </div>

          {/* Add slot input */}
          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder="e.g. 11:30 AM or 04:00 PM"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 w-full"
            />
            <button
              type="button"
              onClick={handleAddSlot}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold whitespace-nowrap"
            >
              Add Slot
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {timeSlots.map((slot) => (
              <span
                key={slot}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {slot}
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(slot)}
                  className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Room & Fee */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Room Location & Consultation Fee</h3>
              <p className="text-xs text-slate-500">Physical OPD suite and patient billing rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Consultation Room / Suite Number
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Suite 301 (Cardiac Wing)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Standard Consultation Fee ($ USD)
              </label>
              <input
                type="number"
                min={0}
                step={5}
                required
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 flex items-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Schedule Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
