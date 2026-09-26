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
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Hospital Ward & Bed Availability
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Real-time bed occupancy tracker across Intensive Care, Emergency, General, and Private suites.
        </p>
      </div>

      {/* Active Admission Banner if Patient is Admitted */}
      {activeAdmission && (
        <div className="bg-purple-950/60 backdrop-blur-xl rounded-3xl border border-purple-500/40 p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300 shadow-md">
                <BedDouble className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full">
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

            <div className="text-left md:text-right bg-slate-950/40 p-3.5 rounded-2xl border border-white/10 text-xs">
              <p className="text-purple-300">Admitted on</p>
              <p className="font-bold text-white text-sm">
                {new Date(activeAdmission.admissionDate).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/45 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Beds</span>
          <span className="text-2xl font-extrabold text-white">{bedStats?.total || beds.length}</span>
          <span className="text-[11px] text-teal-300 block font-medium">Hospital Capacity</span>
        </div>
        <div className="bg-slate-900/45 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Available Beds</span>
          <span className="text-2xl font-extrabold text-emerald-400">{bedStats?.available || 0}</span>
          <span className="text-[11px] text-emerald-300 block font-medium">Ready for Intake</span>
        </div>
        <div className="bg-slate-900/45 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Occupied Beds</span>
          <span className="text-2xl font-extrabold text-amber-400">{bedStats?.occupied || 0}</span>
          <span className="text-[11px] text-amber-300 block font-medium">Currently in Use</span>
        </div>
        <div className="bg-slate-900/45 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Occupancy Rate</span>
          <span className="text-2xl font-extrabold text-sky-400">{bedStats?.occupancyRate || 0}%</span>
          <span className="text-[11px] text-sky-300 block font-medium">Global Capacity</span>
        </div>
      </div>

      {/* Ward Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        <button
          onClick={() => setSelectedWard('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedWard === 'ALL'
              ? 'bg-teal-500/30 text-teal-300 border border-teal-400/50 shadow-md backdrop-blur-md'
              : 'bg-slate-900/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md'
          }`}
        >
          All Wards ({beds.length})
        </button>
        {wards.map((ward) => {
          const wardBeds = beds.filter((b) => b.wardId === ward.id);
          return (
            <button
              key={ward.id}
              onClick={() => setSelectedWard(ward.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedWard === ward.id
                  ? 'bg-teal-500/30 text-teal-300 border border-teal-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-900/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md'
              }`}
            >
              {ward.name} ({wardBeds.length})
            </button>
          );
        })}
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredBeds.map((bed) => {
          const isAvail = bed.status === 'AVAILABLE';
          const isOcc = bed.status === 'OCCUPIED';
          const isMaint = bed.status === 'MAINTENANCE';

          return (
            <div
              key={bed.id}
              className={`p-3.5 rounded-2xl border backdrop-blur-xl transition-all shadow-md flex flex-col justify-between ${
                isAvail
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100'
                  : isOcc
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-100'
                  : 'bg-slate-950/30 border-slate-700/40 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase">{bed.ward?.name || 'Ward'}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAvail ? 'bg-emerald-400 animate-pulse' : isOcc ? 'bg-rose-400' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div className="my-1">
                <BedDouble className="w-5 h-5 mb-1 opacity-80" />
                <span className="text-base font-extrabold font-mono block">Bed {bed.bedNumber}</span>
                <span className="text-[10px] opacity-75">{(bed as any).type || (bed as any).category || 'Standard'}</span>
              </div>

              <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-bold">
                <span>{bed.status}</span>
                <span className="font-mono">${bed.dailyRate}/day</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BedAvailabilityView;
