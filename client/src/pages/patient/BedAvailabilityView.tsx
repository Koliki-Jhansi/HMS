import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Building2,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { Ward, Bed, Admission } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const BedAvailabilityView: React.FC = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedStats, setBedStats] = useState<any>(null);
  const [activeAdmission, setActiveAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wardRes, bedRes, statsRes, admRes] = await Promise.all([
        api.get('/wards'),
        api.get('/beds'),
        api.get('/beds/stats'),
        api.get('/admissions?status=ACTIVE'),
      ]);

      if (wardRes.data.success) setWards(wardRes.data.data);
      if (bedRes.data.success) setBeds(bedRes.data.data);
      if (statsRes.data.success) setBedStats(statsRes.data.data);
      if (admRes.data.success && admRes.data.data.length > 0) {
        setActiveAdmission(admRes.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to load bed availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBeds =
    selectedWard === 'ALL' ? beds : beds.filter((b) => b.wardId === selectedWard);

  if (loading) {
    return <LoadingSpinner text="Checking live ward & bed capacity..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Hospital Ward & Bed Availability
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time bed occupancy tracker across Intensive Care, Emergency, General, and Private suites.
        </p>
      </div>

      {/* Active Admission Banner if Patient is Admitted */}
      {activeAdmission && (
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white backdrop-blur-md">
                <BedDouble className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    Your Active Inpatient Admission
                  </span>
                  <Badge status="ACTIVE" size="sm" />
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {activeAdmission.bed?.ward?.name} • Bed #{activeAdmission.bed?.bedNumber}
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Admission #: <span className="font-mono font-bold">{activeAdmission.admissionNumber}</span> • Attending: Dr. {activeAdmission.doctor?.user?.name}
                </p>
              </div>
            </div>

            <div className="text-left md:text-right bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
              <p className="text-purple-200">Admitted on</p>
              <p className="font-bold text-white text-sm">
                {new Date(activeAdmission.admissionDate).toLocaleString()}
              </p>
              <p className="text-purple-200 mt-1">
                Diagnosis: <span className="text-white font-semibold">{activeAdmission.diagnosis || activeAdmission.reason}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Bed Metrics Bar */}
      {bedStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Beds</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{bedStats.total}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-card text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Available</span>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{bedStats.available}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-card text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase">Occupied</span>
            <p className="text-xl font-extrabold text-rose-700 mt-0.5">{bedStats.occupied}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-card text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Reserved</span>
            <p className="text-xl font-extrabold text-amber-700 mt-0.5">{bedStats.reserved}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 shadow-card text-center">
            <span className="text-[10px] font-bold text-cyan-700 uppercase">Cleaning</span>
            <p className="text-xl font-extrabold text-cyan-700 mt-0.5">{bedStats.cleaning}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 shadow-card text-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase">Occupancy Rate</span>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{bedStats.occupancyRate}%</p>
          </div>
        </div>
      )}

      {/* Ward Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedWard('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedWard === 'ALL'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Wards ({beds.length} Beds)
        </button>
        {wards.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWard(w.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedWard === w.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {w.name} ({w.beds?.length || 0})
          </button>
        ))}
      </div>

      {/* Interactive Visual Bed Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isAvailable = bed.status === 'AVAILABLE';

          return (
            <div
              key={bed.id}
              className={`rounded-2xl p-4 border transition-all duration-200 bg-white ${
                isAvailable
                  ? 'border-emerald-200 hover:border-emerald-400 shadow-card hover:shadow-card-hover'
                  : 'border-slate-200 shadow-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-xl ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-600'
                        : bed.status === 'OCCUPIED'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 font-mono">
                      {bed.bedNumber}
                    </h3>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                      {bed.ward.name}
                    </span>
                  </div>
                </div>

                <Badge status={bed.status} size="sm" />
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Ward Type:</span>
                  <span className="font-semibold text-slate-700">{bed.ward.type}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Daily Rate:</span>
                  <span className="font-bold text-slate-900">${bed.dailyRate}/day</span>
                </div>
                {bed.notes && (
                  <p className="text-[11px] text-slate-400 italic pt-1 truncate">
                    Note: {bed.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
