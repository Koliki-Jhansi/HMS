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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Find Specialists & Book Appointment</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select department, choose your preferred physician, and book your consultation in seconds.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, specialty, or condition..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors"
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
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleDepartmentChange(dept.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDept === dept.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          const slots = doc.timeSlots ? doc.timeSlots.split(',') : [];

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
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
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/20 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                      {doc.department?.name || 'General Practice'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{doc.user.name}</h3>
                    <p className="text-xs text-slate-500">{doc.qualification}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{doc.experienceYears} Years Exp.</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-bold">${doc.consultationFee} Fee</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3.5 line-clamp-2 italic">
                  "{doc.bio || 'Experienced hospital clinical specialist dedicated to exceptional patient care.'}"
                </p>

                <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Days: {availableDays.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Location: {doc.roomNumber || 'Main OPD Block'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openBookingModal(doc)}
                className="mt-5 w-full py-2.5 bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
          title={`Book Consultation with ${selectedDoctor.user.name}`}
          subtitle={`${selectedDoctor.specialization} (${selectedDoctor.department?.name || 'Department'})`}
          maxWidth="lg"
        >
          {bookingSuccess ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-slate-900">Appointment Request Submitted!</h4>
              <p className="text-xs text-slate-500">
                Your appointment request for {bookingDate} at {selectedSlot} has been sent to Dr. {selectedDoctor.user.name}. Redirecting to your appointments...
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Consultation Fee Badge */}
              <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Standard Consultation Fee:</span>
                <span className="text-brand-700 font-bold text-sm">${selectedDoctor.consultationFee}.00 USD</span>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              {/* Time slot pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Available Time Slot *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedDoctor.timeSlots.split(',').map((slot) => {
                    const cleanSlot = slot.trim();
                    return (
                      <button
                        type="button"
                        key={cleanSlot}
                        onClick={() => setSelectedSlot(cleanSlot)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          selectedSlot === cleanSlot
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cleanSlot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason for visit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Chest pain on exertion, Routine checkup, Migraine follow-up"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Symptoms & Duration (Optional)
                </label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe when symptoms started and any current discomfort..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-70"
                >
                  {submitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
