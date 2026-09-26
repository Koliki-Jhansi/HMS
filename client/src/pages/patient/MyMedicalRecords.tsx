import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  FileText,
  Activity,
  Calendar,
  User,
  Search,
  Filter,
  Stethoscope,
  Eye,
} from 'lucide-react';
import api from '../../services/api';
import { MedicalRecord, RecordType } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { HospitalHeader3D } from '../../components/3d/HospitalHeader3D';

export const MyMedicalRecords: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [typeFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url =
        typeFilter === 'ALL'
          ? '/medical-records'
          : `/medical-records?recordType=${typeFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recordNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-white select-none">
      {/* 3D Digital Clinical Matrix Header */}
      <HospitalHeader3D
        type="records"
        badge="Digital EHR Matrix"
        title="Electronic Health Records (EHR)"
        subtitle="Complete medical history, diagnostic reports, surgical notes, and discharge summaries."
      />

      {/* Controls Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, notes, keywords..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400 placeholder:text-slate-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'CONSULTATION', 'LAB_REPORT', 'SURGERY', 'DISCHARGE_SUMMARY', 'DIAGNOSIS'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                typeFilter === t
                  ? 'bg-teal-500/30 text-teal-300 border border-teal-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Records Timeline */}
      {loading ? (
        <LoadingSpinner text="Querying digital health record vault..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No medical records found"
          description="Clinical records, diagnoses, and lab results will appear here as they are filed."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-5 shadow-xl hover:border-teal-400/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-white"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-2xl shrink-0 mt-1">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md border border-teal-400/30">
                      {rec.recordNumber}
                    </span>
                    <Badge status={rec.recordType} size="sm" />
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-400" />
                      {new Date(rec.recordDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">{rec.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{rec.notes}</p>
                  <p className="text-[11px] text-teal-300/80 mt-1.5 font-medium">
                    Attending: Dr. {rec.doctor?.user?.name || 'Staff Physician'} ({rec.doctor?.specialization || 'General'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => setSelectedRecord(rec)}
                  className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-400/30 flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Full Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord.title}
          subtitle={`Record #${selectedRecord.recordNumber} • Date: ${new Date(selectedRecord.recordDate).toLocaleDateString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-white">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3.5 rounded-2xl border border-white/10">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Record Category</span>
                <span className="font-bold text-white">{selectedRecord.recordType.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Authoring Specialist</span>
                <span className="font-bold text-white">Dr. {selectedRecord.doctor?.user?.name || 'Staff Physician'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                Clinical Examination & Findings
              </h4>
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/10 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedRecord.notes}
              </div>
            </div>

            {((selectedRecord as any).diagnosis || (selectedRecord as any).chiefComplaint) && (
              <div>
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                  Confirmed Diagnosis / Findings
                </h4>
                <div className="p-3 bg-teal-500/10 border border-teal-400/20 rounded-xl text-xs font-semibold text-teal-200">
                  {(selectedRecord as any).diagnosis || (selectedRecord as any).chiefComplaint}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md"
              >
                Close Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyMedicalRecords;
