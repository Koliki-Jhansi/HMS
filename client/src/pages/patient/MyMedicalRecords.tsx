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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Electronic Health Records (EHR)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete medical history, diagnostic reports, surgical notes, and discharge summaries.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, notes, keywords..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
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
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Records Timeline */}
      {loading ? (
        <LoadingSpinner text="Loading your medical history..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No health records found"
          description="There are no documented clinical notes matching your current filter."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{record.title}</h3>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                        {record.recordNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attending: Dr. {record.doctor?.user?.name || 'Medical Staff'} ({record.doctor?.department?.name || 'General'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  <Badge status={record.recordType} size="sm" />
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {record.recordDate}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-700 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Clinical Notes & Findings
                </span>
                <p className="whitespace-pre-line">{record.notes}</p>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Full Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord.title}
          subtitle={`Record #${selectedRecord.recordNumber} • Date: ${selectedRecord.recordDate}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-700">Documenting Physician</p>
                <p className="text-slate-900 font-semibold mt-0.5">
                  Dr. {selectedRecord.doctor?.user?.name || 'Hospital Clinical Team'}
                </p>
              </div>
              <Badge status={selectedRecord.recordType} size="md" />
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Comprehensive Clinical Documentation
              </span>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-800 leading-relaxed text-xs">
                {selectedRecord.notes}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
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
