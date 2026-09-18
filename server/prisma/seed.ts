import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing existing database records...');
  // Delete in order to respect foreign key constraints
  await prisma.notification.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Seeding departments...');
  const deptCardio = await prisma.department.create({
    data: {
      name: 'Cardiology',
      code: 'CARD',
      description: 'Comprehensive diagnosis and treatment of cardiovascular diseases and heart care.',
      icon: 'HeartPulse',
    },
  });

  const deptNeuro = await prisma.department.create({
    data: {
      name: 'Neurology',
      code: 'NEUR',
      description: 'Expert treatment of disorders of the brain, spinal cord, and nervous system.',
      icon: 'Brain',
    },
  });

  const deptPed = await prisma.department.create({
    data: {
      name: 'Pediatrics',
      code: 'PED',
      description: 'Dedicated healthcare and wellness for infants, children, and adolescents.',
      icon: 'Baby',
    },
  });

  const deptOrtho = await prisma.department.create({
    data: {
      name: 'Orthopedics',
      code: 'ORTHO',
      description: 'Specialized musculoskeletal system care, joints, bones, and spine health.',
      icon: 'Activity',
    },
  });

  const deptGenMed = await prisma.department.create({
    data: {
      name: 'General Medicine',
      code: 'GENMED',
      description: 'Primary care, chronic disease management, and preventative health services.',
      icon: 'Stethoscope',
    },
  });

  console.log('🌱 Seeding users and doctors...');
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordDoctor = await bcrypt.hash('doctor123', 10);
  const passwordPatient = await bcrypt.hash('patient123', 10);

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hospital.com',
      password: passwordAdmin,
      name: 'Dr. Sarah Mitchell',
      role: 'ADMIN',
      phone: '+1 (555) 019-2831',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
  });

  // Doctor 1: Dr. Marcus Smith (Cardio)
  const docUser1 = await prisma.user.create({
    data: {
      email: 'dr.smith@hospital.com',
      password: passwordDoctor,
      name: 'Dr. Marcus Smith, MD',
      role: 'DOCTOR',
      phone: '+1 (555) 234-5671',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    },
  });
  const doc1 = await prisma.doctor.create({
    data: {
      userId: docUser1.id,
      departmentId: deptCardio.id,
      specialization: 'Senior Cardiologist & Interventionalist',
      licenseNumber: 'MD-CARD-88412',
      qualification: 'MBBS, MD (Cardiology), FACC',
      experienceYears: 14,
      consultationFee: 120.0,
      bio: 'Leading specialist in preventive cardiology, coronary interventions, and arrhythmias with over 14 years of clinical excellence.',
      roomNumber: 'Suite 301 (Cardiac Wing)',
      availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
      timeSlots: '09:00 AM,10:00 AM,11:30 AM,02:00 PM,03:30 PM',
    },
  });

  // Doctor 2: Dr. Emily Chen (Neuro)
  const docUser2 = await prisma.user.create({
    data: {
      email: 'dr.chen@hospital.com',
      password: passwordDoctor,
      name: 'Dr. Emily Chen, MD',
      role: 'DOCTOR',
      phone: '+1 (555) 345-6782',
      avatar: 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?auto=format&fit=crop&q=80&w=300',
    },
  });
  const doc2 = await prisma.doctor.create({
    data: {
      userId: docUser2.id,
      departmentId: deptNeuro.id,
      specialization: 'Neurologist & Neuro-electrophysiologist',
      licenseNumber: 'MD-NEUR-77291',
      qualification: 'MBBS, DM (Neurology)',
      experienceYears: 10,
      consultationFee: 110.0,
      bio: 'Specialized in stroke rehabilitation, epilepsy management, migraine treatments, and neurological diagnostics.',
      roomNumber: 'Suite 405 (Neuro Center)',
      availableDays: 'Monday,Wednesday,Thursday,Friday',
      timeSlots: '09:30 AM,10:30 AM,11:30 AM,02:30 PM,04:00 PM',
    },
  });

  // Doctor 3: Dr. Rajesh Patel (Pediatrics)
  const docUser3 = await prisma.user.create({
    data: {
      email: 'dr.patel@hospital.com',
      password: passwordDoctor,
      name: 'Dr. Rajesh Patel, MD',
      role: 'DOCTOR',
      phone: '+1 (555) 456-7893',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    },
  });
  const doc3 = await prisma.doctor.create({
    data: {
      userId: docUser3.id,
      departmentId: deptPed.id,
      specialization: 'Consultant Pediatrician',
      licenseNumber: 'MD-PED-66104',
      qualification: 'MBBS, DCH, MD (Pediatrics)',
      experienceYears: 12,
      consultationFee: 85.0,
      bio: 'Compassionate pediatric specialist caring for child developmental milestones, vaccinations, and pediatric acute illnesses.',
      roomNumber: 'Suite 102 (Child Care Wing)',
      availableDays: 'Monday,Tuesday,Wednesday,Friday,Saturday',
      timeSlots: '09:00 AM,10:00 AM,11:00 AM,03:00 PM,04:30 PM',
    },
  });

  // Doctor 4: Dr. Jessica Taylor (Orthopedics)
  const docUser4 = await prisma.user.create({
    data: {
      email: 'dr.taylor@hospital.com',
      password: passwordDoctor,
      name: 'Dr. Jessica Taylor, MS',
      role: 'DOCTOR',
      phone: '+1 (555) 567-8904',
      avatar: 'https://images.unsplash.com/photo-1559839734-73891461ff39?auto=format&fit=crop&q=80&w=300',
    },
  });
  const doc4 = await prisma.doctor.create({
    data: {
      userId: docUser4.id,
      departmentId: deptOrtho.id,
      specialization: 'Orthopedic & Joint Replacement Surgeon',
      licenseNumber: 'MS-ORTH-99382',
      qualification: 'MBBS, MS (Orthopedics), Fellowship in Arthroscopy',
      experienceYears: 15,
      consultationFee: 130.0,
      bio: 'Renowned joint replacement specialist focusing on minimally invasive arthroscopic surgery and sports injury recovery.',
      roomNumber: 'Suite 208 (Ortho Clinic)',
      availableDays: 'Tuesday,Thursday,Saturday',
      timeSlots: '09:00 AM,10:30 AM,01:30 PM,03:00 PM',
    },
  });

  // Doctor 5: Dr. David Williams (General Medicine)
  const docUser5 = await prisma.user.create({
    data: {
      email: 'dr.williams@hospital.com',
      password: passwordDoctor,
      name: 'Dr. David Williams, MD',
      role: 'DOCTOR',
      phone: '+1 (555) 678-9015',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    },
  });
  const doc5 = await prisma.doctor.create({
    data: {
      userId: docUser5.id,
      departmentId: deptGenMed.id,
      specialization: 'Internal Medicine & Primary Care Physician',
      licenseNumber: 'MD-GEN-55421',
      qualification: 'MBBS, MD (Internal Medicine)',
      experienceYears: 8,
      consultationFee: 75.0,
      bio: 'Dedicated primary care physician skilled in diabetes, hypertension management, infectious diseases, and holistic healthcare.',
      roomNumber: 'Suite 101 (OPD Block A)',
      availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      timeSlots: '08:30 AM,09:30 AM,10:30 AM,11:30 AM,02:00 PM,03:00 PM,04:00 PM',
    },
  });

  console.log('🌱 Seeding patients...');
  // Patient 1: John Doe
  const pUser1 = await prisma.user.create({
    data: {
      email: 'john@patient.com',
      password: passwordPatient,
      name: 'John Doe',
      role: 'PATIENT',
      phone: '+1 (555) 789-0123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    },
  });
  const pat1 = await prisma.patient.create({
    data: {
      userId: pUser1.id,
      medicalRecordNumber: 'MRN-2026-1001',
      dateOfBirth: '1988-05-14',
      gender: 'MALE',
      bloodGroup: 'O+',
      address: '742 Evergreen Terrace, Springfield, OR',
      emergencyContactName: 'Sarah Doe (Spouse)',
      emergencyContactPhone: '+1 (555) 789-9999',
      allergies: 'Penicillin, Shellfish',
      chronicConditions: 'Mild Hypertension',
      insuranceProvider: 'Blue Cross Shield',
      insurancePolicyNumber: 'BCS-88392019',
    },
  });

  // Patient 2: Jane Smith
  const pUser2 = await prisma.user.create({
    data: {
      email: 'jane@patient.com',
      password: passwordPatient,
      name: 'Jane Smith',
      role: 'PATIENT',
      phone: '+1 (555) 890-1234',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    },
  });
  const pat2 = await prisma.patient.create({
    data: {
      userId: pUser2.id,
      medicalRecordNumber: 'MRN-2026-1002',
      dateOfBirth: '1994-11-20',
      gender: 'FEMALE',
      bloodGroup: 'A+',
      address: '124 Conch Street, Pacific Grove, CA',
      emergencyContactName: 'Mark Smith (Brother)',
      emergencyContactPhone: '+1 (555) 890-8888',
      allergies: 'Sulfa Drugs',
      chronicConditions: 'None',
      insuranceProvider: 'Aetna Health Care',
      insurancePolicyNumber: 'AET-3392810',
    },
  });

  // Patient 3: Robert Johnson
  const pUser3 = await prisma.user.create({
    data: {
      email: 'robert@patient.com',
      password: passwordPatient,
      name: 'Robert Johnson',
      role: 'PATIENT',
      phone: '+1 (555) 901-2345',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    },
  });
  const pat3 = await prisma.patient.create({
    data: {
      userId: pUser3.id,
      medicalRecordNumber: 'MRN-2026-1003',
      dateOfBirth: '1965-03-08',
      gender: 'MALE',
      bloodGroup: 'B+',
      address: '456 Oak Avenue, Austin, TX',
      emergencyContactName: 'Clara Johnson (Daughter)',
      emergencyContactPhone: '+1 (555) 901-7777',
      allergies: 'Aspirin',
      chronicConditions: 'Type 2 Diabetes, Osteoarthritis',
      insuranceProvider: 'United Healthcare',
      insurancePolicyNumber: 'UHC-9928172',
    },
  });

  // Patient 4: Maria Garcia
  const pUser4 = await prisma.user.create({
    data: {
      email: 'maria@patient.com',
      password: passwordPatient,
      name: 'Maria Garcia',
      role: 'PATIENT',
      phone: '+1 (555) 012-3456',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    },
  });
  const pat4 = await prisma.patient.create({
    data: {
      userId: pUser4.id,
      medicalRecordNumber: 'MRN-2026-1004',
      dateOfBirth: '1999-07-25',
      gender: 'FEMALE',
      bloodGroup: 'AB+',
      address: '89 Maple Court, Denver, CO',
      emergencyContactName: 'Elena Garcia (Mother)',
      emergencyContactPhone: '+1 (555) 012-6666',
      allergies: 'None',
      chronicConditions: 'Asthma',
      insuranceProvider: 'Cigna Global',
      insurancePolicyNumber: 'CIG-1129384',
    },
  });

  console.log('🌱 Seeding Wards & Beds...');
  // Ward 1: ICU
  const wardICU = await prisma.ward.create({
    data: {
      name: 'Intensive Care Unit (ICU)',
      code: 'ICU-3F',
      type: 'ICU',
      floor: 3,
      capacity: 6,
      description: 'Equipped with continuous advanced vital monitoring, ventilators, and 24/7 dedicated critical care staff.',
    },
  });

  // Ward 2: Emergency Trauma
  const wardEmerg = await prisma.ward.create({
    data: {
      name: 'Emergency & Trauma Ward',
      code: 'EMERG-1F',
      type: 'EMERGENCY',
      floor: 1,
      capacity: 8,
      description: 'Rapid triage and immediate acute stabilization wing.',
    },
  });

  // Ward 3: General Ward A
  const wardGenA = await prisma.ward.create({
    data: {
      name: 'General Medical Ward - Unit A',
      code: 'GEN-2A',
      type: 'GENERAL',
      floor: 2,
      capacity: 10,
      description: 'Standard inpatient hospitalization care unit for medical observation and recovery.',
    },
  });

  // Ward 4: Private Deluxe Suites
  const wardPriv = await prisma.ward.create({
    data: {
      name: 'Private Deluxe Suites',
      code: 'PRIV-4F',
      type: 'PRIVATE',
      floor: 4,
      capacity: 5,
      description: 'Premium private patient suites with dedicated caregiver amenities and enhanced privacy.',
    },
  });

  // Ward 5: Maternity Ward
  const wardMat = await prisma.ward.create({
    data: {
      name: 'Maternity & Neonatal Ward',
      code: 'MAT-3F',
      type: 'MATERNITY',
      floor: 3,
      capacity: 6,
      description: 'Mother and newborn specialized birthing and post-natal care suites.',
    },
  });

  // Create Beds for ICU
  const bedICU1 = await prisma.bed.create({
    data: { bedNumber: 'ICU-101', wardId: wardICU.id, status: 'AVAILABLE', dailyRate: 350.0, notes: 'Ventilator ready' },
  });
  const bedICU2 = await prisma.bed.create({
    data: { bedNumber: 'ICU-102', wardId: wardICU.id, status: 'OCCUPIED', dailyRate: 350.0, notes: 'Cardiac monitor active' },
  });
  const bedICU3 = await prisma.bed.create({
    data: { bedNumber: 'ICU-103', wardId: wardICU.id, status: 'CLEANING', dailyRate: 350.0, notes: 'Disinfected at 08:00 AM' },
  });
  const bedICU4 = await prisma.bed.create({
    data: { bedNumber: 'ICU-104', wardId: wardICU.id, status: 'RESERVED', dailyRate: 350.0, notes: 'Reserved for incoming post-op' },
  });
  const bedICU5 = await prisma.bed.create({
    data: { bedNumber: 'ICU-105', wardId: wardICU.id, status: 'AVAILABLE', dailyRate: 350.0 },
  });
  const bedICU6 = await prisma.bed.create({
    data: { bedNumber: 'ICU-106', wardId: wardICU.id, status: 'MAINTENANCE', dailyRate: 350.0, notes: 'Telemetry sensor calibration' },
  });

  // Create Beds for Emergency
  const bedEm1 = await prisma.bed.create({
    data: { bedNumber: 'EMR-01', wardId: wardEmerg.id, status: 'AVAILABLE', dailyRate: 200.0 },
  });
  const bedEm2 = await prisma.bed.create({
    data: { bedNumber: 'EMR-02', wardId: wardEmerg.id, status: 'OCCUPIED', dailyRate: 200.0, notes: 'Acute trauma observation' },
  });
  const bedEm3 = await prisma.bed.create({
    data: { bedNumber: 'EMR-03', wardId: wardEmerg.id, status: 'AVAILABLE', dailyRate: 200.0 },
  });
  const bedEm4 = await prisma.bed.create({
    data: { bedNumber: 'EMR-04', wardId: wardEmerg.id, status: 'AVAILABLE', dailyRate: 200.0 },
  });

  // Create Beds for General Ward A
  const bedGen1 = await prisma.bed.create({
    data: { bedNumber: 'GEN-201', wardId: wardGenA.id, status: 'AVAILABLE', dailyRate: 95.0 },
  });
  const bedGen2 = await prisma.bed.create({
    data: { bedNumber: 'GEN-202', wardId: wardGenA.id, status: 'AVAILABLE', dailyRate: 95.0 },
  });
  const bedGen3 = await prisma.bed.create({
    data: { bedNumber: 'GEN-203', wardId: wardGenA.id, status: 'CLEANING', dailyRate: 95.0 },
  });
  const bedGen4 = await prisma.bed.create({
    data: { bedNumber: 'GEN-204', wardId: wardGenA.id, status: 'AVAILABLE', dailyRate: 95.0 },
  });
  const bedGen5 = await prisma.bed.create({
    data: { bedNumber: 'GEN-205', wardId: wardGenA.id, status: 'AVAILABLE', dailyRate: 95.0 },
  });

  // Create Beds for Private Suites
  const bedPrv1 = await prisma.bed.create({
    data: { bedNumber: 'PRV-401', wardId: wardPriv.id, status: 'OCCUPIED', dailyRate: 280.0, notes: 'VIP Suite A' },
  });
  const bedPrv2 = await prisma.bed.create({
    data: { bedNumber: 'PRV-402', wardId: wardPriv.id, status: 'AVAILABLE', dailyRate: 280.0, notes: 'VIP Suite B' },
  });
  const bedPrv3 = await prisma.bed.create({
    data: { bedNumber: 'PRV-403', wardId: wardPriv.id, status: 'RESERVED', dailyRate: 280.0 },
  });

  // Create Beds for Maternity
  const bedMat1 = await prisma.bed.create({
    data: { bedNumber: 'MAT-301', wardId: wardMat.id, status: 'AVAILABLE', dailyRate: 180.0 },
  });
  const bedMat2 = await prisma.bed.create({
    data: { bedNumber: 'MAT-302', wardId: wardMat.id, status: 'AVAILABLE', dailyRate: 180.0 },
  });

  console.log('🌱 Seeding Admissions...');
  // Admission 1: John Doe in ICU-102
  const adm1 = await prisma.admission.create({
    data: {
      admissionNumber: 'ADM-2026-0081',
      patientId: pat1.id,
      bedId: bedICU2.id,
      admittingDoctorId: doc1.id,
      admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      reason: 'Acute Subacute Coronary Syndrome with severe angina',
      diagnosis: 'NSTEMI (Non-ST elevation myocardial infarction) under continuous telemetry observation',
      status: 'ACTIVE',
      totalBill: 1250.0,
    },
  });

  // Admission 2: Robert Johnson in PRV-401
  const adm2 = await prisma.admission.create({
    data: {
      admissionNumber: 'ADM-2026-0082',
      patientId: pat3.id,
      bedId: bedPrv1.id,
      admittingDoctorId: doc4.id,
      admissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
      reason: 'Post-operative Total Knee Arthroplasty (Right Knee)',
      diagnosis: 'Right Knee Osteoarthritis Stage IV, recovery undergoing physical therapy',
      status: 'ACTIVE',
      totalBill: 2400.0,
    },
  });

  console.log('🌱 Seeding Appointments...');
  // Today's date string YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Appointment 1: Completed - John Doe with Dr. Marcus Smith
  const apt1 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-501',
      patientId: pat1.id,
      doctorId: doc1.id,
      departmentId: deptCardio.id,
      appointmentDate: yesterday,
      timeSlot: '10:00 AM',
      status: 'COMPLETED',
      reason: 'Chest tightness, shortness of breath on exertion',
      symptoms: 'Substernal pressure radiating to left arm for 3 days',
      notes: 'Initial evaluation completed. Patient subsequently admitted to ICU for continuous telemetry.',
    },
  });

  // Appointment 2: In Progress - Jane Smith with Dr. Emily Chen
  const apt2 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-502',
      patientId: pat2.id,
      doctorId: doc2.id,
      departmentId: deptNeuro.id,
      appointmentDate: today,
      timeSlot: '09:30 AM',
      status: 'IN_PROGRESS',
      reason: 'Recurrent severe throbbing migraines with visual aura',
      symptoms: 'Photophobia, nausea, unilateral temporal headache',
      notes: 'Consultation currently ongoing in Suite 405.',
    },
  });

  // Appointment 3: Accepted - Maria Garcia with Dr. David Williams
  const apt3 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-503',
      patientId: pat4.id,
      doctorId: doc5.id,
      departmentId: deptGenMed.id,
      appointmentDate: today,
      timeSlot: '02:00 PM',
      status: 'ACCEPTED',
      reason: 'Annual comprehensive physical exam and persistent dry cough',
      symptoms: 'Mild wheezing at night, fatigue',
      notes: 'Doctor confirmed slot. Patient advised to bring previous allergy test reports.',
    },
  });

  // Appointment 4: Pending - Jane Smith with Dr. Marcus Smith
  const apt4 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-504',
      patientId: pat2.id,
      doctorId: doc1.id,
      departmentId: deptCardio.id,
      appointmentDate: tomorrow,
      timeSlot: '11:30 AM',
      status: 'PENDING',
      reason: 'Palpitations during workout sessions',
      symptoms: 'Occasional racing heartbeat and lightheadedness',
    },
  });

  // Appointment 5: Pending - Maria Garcia with Dr. Jessica Taylor
  const apt5 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-505',
      patientId: pat4.id,
      doctorId: doc4.id,
      departmentId: deptOrtho.id,
      appointmentDate: tomorrow,
      timeSlot: '01:30 PM',
      status: 'PENDING',
      reason: 'Ankle sprain after trail running',
      symptoms: 'Localized lateral ankle swelling, pain while weight-bearing',
    },
  });

  console.log('🌱 Seeding Prescriptions...');
  // Prescription for Appointment 1 (John Doe / Dr. Marcus Smith)
  const presc1 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-8801',
      appointmentId: apt1.id,
      patientId: pat1.id,
      doctorId: doc1.id,
      diagnosis: 'Acute Coronary Syndrome / Hypertensive Urgency',
      notes: 'Maintain strict low sodium diet, avoid strenuous exertion, monitor blood pressure daily.',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: {
        create: [
          {
            medicineName: 'Atorvastatin (Lipitor)',
            dosage: '40mg',
            frequency: 'Once daily at bedtime (0-0-1)',
            duration: '30 days',
            route: 'Oral',
            instructions: 'Take with or without food. Avoid grapefruit juice.',
          },
          {
            medicineName: 'Amlodipine Besylate',
            dosage: '5mg',
            frequency: 'Once daily in morning (1-0-0)',
            duration: '30 days',
            route: 'Oral',
            instructions: 'Monitor blood pressure log before taking.',
          },
          {
            medicineName: 'Clopidogrel (Plavix)',
            dosage: '75mg',
            frequency: 'Once daily (1-0-0)',
            duration: '90 days',
            route: 'Oral',
            instructions: 'Take strictly after breakfast.',
          },
          {
            medicineName: 'Sublingual Nitroglycerin',
            dosage: '0.4mg',
            frequency: 'As needed (PRN)',
            duration: '30 days',
            route: 'Sublingual',
            instructions: 'Place 1 tablet under tongue for acute chest pain. Seek emergency if pain persists > 5 mins.',
          },
        ],
      },
    },
  });

  console.log('🌱 Seeding Medical Records...');
  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-001',
      patientId: pat1.id,
      doctorId: doc1.id,
      title: '12-Lead Electrocardiogram (ECG) Report',
      recordType: 'LAB_REPORT',
      notes: 'Sinus rhythm, HR 82 bpm. T-wave inversion observed in leads V3-V6 indicating anterior myocardial ischemia. Troponin I levels: 0.18 ng/mL (elevated).',
      recordDate: yesterday,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-002',
      patientId: pat3.id,
      doctorId: doc4.id,
      title: 'Surgical Operative Note: Total Knee Arthroplasty',
      recordType: 'SURGERY',
      notes: 'Successful robotic-assisted right total knee replacement with cemented titanium prosthesis. Zero intraoperative complications. Estimated blood loss: 120 mL.',
      recordDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-003',
      patientId: pat2.id,
      doctorId: doc2.id,
      title: 'Brain MRI & EEG Diagnostic Screening',
      recordType: 'LAB_REPORT',
      notes: 'Normal structural MRI of the brain with no intracranial lesion or vascular malformation. Consistent with typical migraine with aura etiology.',
      recordDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  console.log('🌱 Seeding Notifications...');
  await prisma.notification.create({
    data: {
      userId: pUser1.id,
      title: 'Prescription Issued',
      message: 'Dr. Marcus Smith has generated prescription RX-2026-8801 for your treatment.',
      type: 'PRESCRIPTION',
      link: '/patient/prescriptions',
    },
  });

  await prisma.notification.create({
    data: {
      userId: docUser1.id,
      title: 'New Appointment Booking Request',
      message: 'Patient Jane Smith has requested an appointment for tomorrow at 11:30 AM.',
      type: 'APPOINTMENT',
      link: '/doctor/appointments',
    },
  });

  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: 'ICU Bed Occupancy Alert',
      message: 'John Doe admitted to ICU Bed 102. ICU capacity is now at 50%.',
      type: 'BED',
      link: '/admin/beds',
    },
  });

  console.log('✅ Demo seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('DEMO ACCOUNTS READY:');
  console.log('Admin:   admin@hospital.com   / admin123');
  console.log('Doctor:  dr.smith@hospital.com / doctor123');
  console.log('Patient: john@patient.com     / patient123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
