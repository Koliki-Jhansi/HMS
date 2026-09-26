import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import api from '../../services/api';
import { Department, Doctor } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected doctor for booking modal
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptRes, docRes] = await Promise.all([
        api.get('/departments'),
        api.get('/doctors'),
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (docRes.data.success) setDoctors(docRes.data.data);
    } catch (err) {
      console.error('Failed to load doctors & departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDept(deptId);
    try {
      const res = await api.get(`/doctors?departmentId=${deptId}`);
      if (res.data.success) setDoctors(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.get(
        `/doctors?departmentId=${selectedDept}&search=${encodeURIComponent(searchQuery)}`
      );
      if (res.data.success) setDoctors(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openBookingModal = (doc: Doctor) => {
    setSelectedDoctor(doc);
    const slots = doc.timeSlots.split(',');
    setSelectedSlot(slots[0]?.trim() || '09:00 AM');
    setReason('');
    setSymptoms('');
    setError(null);
    setBookingSuccess(false);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate || !selectedSlot || !reason) {
      setError('Please fill in all required booking fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/appointments', {
        doctorId: selectedDoctor.id,
        departmentId: selectedDoctor.departmentId,
        appointmentDate: bookingDate,
        timeSlot: selectedSlot,
        reason,
        symptoms,
      });

      if (res.data.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          setSelectedDoctor(null);
          navigate('/patient/appointments');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment. Time slot may be occupied.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading doctors directory..." />;
  }

  return (
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Find Specialists & Book Consultation
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Select clinical specialty, choose your physician, and book in real time.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by physician name or specialty..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400 placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Department Pills */}
        <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => handleDepartmentChange('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDept === 'ALL'
                ? 'bg-teal-500/30 text-teal-300 border border-teal-400/50 shadow-md backdrop-blur-md'
                : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            All Units
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleDepartmentChange(dept.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDept === dept.id
                  ? 'bg-teal-500/30 text-teal-300 border border-teal-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map((doc) => {
          const availableDays = doc.availableDays ? doc.availableDays.split(',') : [];

          return (
            <div
              key={doc.id}
              className="bg-slate-900/45 backdrop-blur-xl rounded-3xl border border-white/15 p-5 shadow-xl hover:border-teal-400/40 transition-all duration-200 flex flex-col justify-between text-white"
            >
              <div>
                <div className="flex items-start gap-4">
                  <img
                    src={
                      doc.user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        doc.user.name
                      )}&background=0284c7&color=fff&bold=true`
                    }
                    alt={doc.user.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-500/30 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-md border border-teal-400/30">
                      {doc.department?.name || 'General Practice'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">Dr. {doc.user.name}</h3>
                    <p className="text-xs text-slate-300">{doc.qualification}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{doc.experienceYears} Years Exp.</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-teal-300 font-bold">${doc.consultationFee} Fee</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3.5 line-clamp-2 italic">
                  "{doc.bio || 'Dedicated hospital clinical specialist providing patient care.'}"
                </p>

                <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="truncate">Days: {availableDays.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Location: {doc.roomNumber || 'Consultation Suite'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openBookingModal(doc)}
                className="mt-5 w-full py-2.5 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Book Consultation Slot
              </button>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          title={`Book Consultation with Dr. ${selectedDoctor.user.name}`}
          subtitle={`${selectedDoctor.department?.name || 'Department'} • Fee: $${selectedDoctor.consultationFee}`}
          maxWidth="lg"
        >
          {bookingSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Appointment Requested!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Your consultation request has been submitted to Dr. {selectedDoctor.user.name}. Redirecting to your schedule...
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Available Time Slot
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  >
                    {selectedDoctor.timeSlots.split(',').map((slot) => (
                      <option key={slot.trim()} value={slot.trim()} className="bg-slate-900 text-white">
                        {slot.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Reason for Consultation
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Regular health checkup, persistent cough, follow-up..."
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Reported Symptoms / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms or history..."
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 disabled:opacity-70"
                >
                  {submitting ? 'Confirming...' : 'Submit Booking'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default BookAppointment;
