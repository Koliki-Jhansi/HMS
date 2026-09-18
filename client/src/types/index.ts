export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
}

export interface Patient {
  id: string;
  userId: string;
  user: User;
  medicalRecordNumber: string;
  dateOfBirth?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  createdAt: string;
  appointments?: Appointment[];
  admissions?: Admission[];
  prescriptions?: Prescription[];
  medicalRecords?: MedicalRecord[];
  _count?: {
    appointments?: number;
    admissions?: number;
    prescriptions?: number;
    medicalRecords?: number;
  };
}

export interface Doctor {
  id: string;
  userId: string;
  user: User;
  specialization: string;
  licenseNumber: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  departmentId?: string | null;
  department?: Department | null;
  bio?: string | null;
  availableDays: string;
  timeSlots: string;
  roomNumber?: string | null;
  createdAt: string;
  appointments?: Appointment[];
  _count?: {
    appointments?: number;
    admissions?: number;
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  doctors?: Doctor[];
  _count?: {
    doctors?: number;
    appointments?: number;
  };
}

export type WardType = 'GENERAL' | 'ICU' | 'EMERGENCY' | 'PRIVATE' | 'SEMI_PRIVATE' | 'MATERNITY' | 'PEDIATRIC';

export interface Ward {
  id: string;
  name: string;
  code: string;
  type: WardType;
  floor: number;
  capacity: number;
  description?: string | null;
  beds?: Bed[];
  stats?: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    maintenance: number;
    occupancyRate: number;
  };
}

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE';

export interface Bed {
  id: string;
  bedNumber: string;
  wardId: string;
  ward: Ward;
  status: BedStatus;
  dailyRate: number;
  notes?: string | null;
  admissions?: Admission[];
}

export type AdmissionStatus = 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED';

export interface Admission {
  id: string;
  admissionNumber: string;
  patientId: string;
  patient: Patient;
  bedId: string;
  bed: Bed;
  admittingDoctorId: string;
  doctor: Doctor;
  admissionDate: string;
  dischargeDate?: string | null;
  reason: string;
  diagnosis?: string | null;
  status: AdmissionStatus;
  dischargeSummary?: string | null;
  totalBill?: number | null;
  createdAt: string;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: Doctor;
  departmentId?: string | null;
  department?: Department | null;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  reason: string;
  symptoms?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  prescription?: Prescription | null;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string | null;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  appointmentId?: string | null;
  appointment?: Appointment | null;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: Doctor;
  diagnosis: string;
  notes?: string | null;
  followUpDate?: string | null;
  items: PrescriptionItem[];
  createdAt: string;
}

export type RecordType = 'CONSULTATION' | 'LAB_REPORT' | 'SURGERY' | 'DISCHARGE_SUMMARY' | 'DIAGNOSIS';

export interface MedicalRecord {
  id: string;
  recordNumber: string;
  patientId: string;
  patient: Patient;
  doctorId?: string | null;
  doctor?: Doctor | null;
  title: string;
  recordType: RecordType;
  notes: string;
  attachments?: string | null;
  recordDate: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'ADMISSION' | 'PRESCRIPTION' | 'SYSTEM' | 'BED';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}
