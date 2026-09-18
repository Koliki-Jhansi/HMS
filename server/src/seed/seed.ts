import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import {
  User,
  Patient,
  Doctor,
  DoctorSchedule,
  Department,
  Ward,
  Bed,
  Admission,
  Appointment,
  Prescription,
  MedicalRecord,
  Notification,
} from '../models';

// Load server .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';

export async function seedDatabase(disconnectAfter = true) {
  try {
    console.log('🌱 Starting MongoDB Atlas / Mongoose Seeder...');

    if (mongoose.connection.readyState !== 1) {
      console.log(`Connecting to: ${MONGODB_URI}`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('🍃 Connected to database successfully!');
    }

    console.log('🧹 Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      DoctorSchedule.deleteMany({}),
      Department.deleteMany({}),
      Ward.deleteMany({}),
      Bed.deleteMany({}),
      Admission.deleteMany({}),
      Appointment.deleteMany({}),
      Prescription.deleteMany({}),
      MedicalRecord.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('✅ Cleaned all collections.');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const doctorPassword = await bcrypt.hash('doctor123', 10);
    const patientPassword = await bcrypt.hash('patient123', 10);

    // 1. Seed Departments
    console.log('🏥 Seeding Departments...');
    const deptsData = [
      {
        name: 'Cardiology',
        code: 'CARD',
        description: 'Comprehensive cardiovascular healthcare, heart surgery, and diagnostics.',
        icon: 'Heart',
      },
      {
        name: 'Neurology',
        code: 'NEUR',
        description: 'Advanced brain, spine, and nervous system diagnostic and clinical treatments.',
        icon: 'Brain',
      },
      {
        name: 'Orthopedics',
        code: 'ORTH',
        description: 'Musculoskeletal system surgery, joint replacements, trauma care, and sports medicine.',
        icon: 'Bone',
      },
      {
        name: 'Pediatrics',
        code: 'PEDI',
        description: 'Specialized healthcare and developmental support for infants, children, and adolescents.',
        icon: 'Baby',
      },
      {
        name: 'Emergency Medicine',
        code: 'EMER',
        description: '24/7 Level-1 trauma response, urgent resuscitation, and critical stabilization.',
        icon: 'Stethoscope',
      },
      {
        name: 'General Medicine',
        code: 'GENM',
        description: 'Primary care, chronic disease management, and preventative health screenings.',
        icon: 'Activity',
      },
    ];

    const departments = await Department.insertMany(deptsData);
    const deptMap: { [key: string]: any } = {};
    departments.forEach((d) => {
      deptMap[d.code] = d;
    });

    // 2. Seed Wards
    console.log('🛏️ Seeding Wards & Bed Units...');
    const wardsData = [
      {
        name: 'General Medical Ward A',
        code: 'GEN-A',
        type: 'GENERAL',
        floor: 1,
        capacity: 8,
        description: 'Primary inpatient general medical care unit.',
      },
      {
        name: 'Intensive Care Unit (ICU)',
        code: 'ICU-B',
        type: 'ICU',
        floor: 2,
        capacity: 6,
        description: 'Advanced critical care and continuous hemodynamic monitoring.',
      },
      {
        name: 'Emergency Trauma Wing',
        code: 'EMG-T',
        type: 'EMERGENCY',
        floor: 1,
        capacity: 6,
        description: 'Rapid triage, trauma stabilization, and observation beds.',
      },
      {
        name: 'Executive Deluxe Suites',
        code: 'PRV-S',
        type: 'PRIVATE',
        floor: 3,
        capacity: 6,
        description: 'Private recovery suites with premium patient amenities and dedicated nurse stations.',
      },
      {
        name: 'Semi-Private Care Wing',
        code: 'SEMI-W',
        type: 'SEMI_PRIVATE',
        floor: 2,
        capacity: 6,
        description: 'Dual-occupancy rooms with shared ensuite and modern clinical monitoring.',
      },
    ];

    const wards = await Ward.insertMany(wardsData);
    const wardMap: { [key: string]: any } = {};
    wards.forEach((w) => {
      wardMap[w.code] = w;
    });

    // 3. Seed Beds for each Ward
    const bedsData: any[] = [
      // GEN-A (8 beds)
      { bedNumber: 'GEN-101', wardId: wardMap['GEN-A']._id, status: 'AVAILABLE', dailyRate: 75.0, notes: 'Standard electric adjustable bed' },
      { bedNumber: 'GEN-102', wardId: wardMap['GEN-A']._id, status: 'AVAILABLE', dailyRate: 75.0, notes: 'Window side' },
      { bedNumber: 'GEN-103', wardId: wardMap['GEN-A']._id, status: 'OCCUPIED', dailyRate: 75.0, notes: 'Occupied by inpatient' },
      { bedNumber: 'GEN-104', wardId: wardMap['GEN-A']._id, status: 'CLEANING', dailyRate: 75.0, notes: 'Sanitization in progress' },
      { bedNumber: 'GEN-105', wardId: wardMap['GEN-A']._id, status: 'AVAILABLE', dailyRate: 75.0, notes: 'Standard bed' },
      { bedNumber: 'GEN-106', wardId: wardMap['GEN-A']._id, status: 'MAINTENANCE', dailyRate: 75.0, notes: 'Hydraulic adjustment inspection' },
      { bedNumber: 'GEN-107', wardId: wardMap['GEN-A']._id, status: 'AVAILABLE', dailyRate: 75.0, notes: 'Standard bed' },
      { bedNumber: 'GEN-108', wardId: wardMap['GEN-A']._id, status: 'RESERVED', dailyRate: 75.0, notes: 'Reserved for incoming transfer' },

      // ICU-B (6 beds)
      { bedNumber: 'ICU-201', wardId: wardMap['ICU-B']._id, status: 'OCCUPIED', dailyRate: 350.0, notes: 'Full ventilator support & multiparameter monitor' },
      { bedNumber: 'ICU-202', wardId: wardMap['ICU-B']._id, status: 'AVAILABLE', dailyRate: 350.0, notes: 'Ventilator ready, sterile' },
      { bedNumber: 'ICU-203', wardId: wardMap['ICU-B']._id, status: 'OCCUPIED', dailyRate: 350.0, notes: 'Cardiac telemetry active' },
      { bedNumber: 'ICU-204', wardId: wardMap['ICU-B']._id, status: 'CLEANING', dailyRate: 350.0, notes: 'Post-discharge deep sterilization' },
      { bedNumber: 'ICU-205', wardId: wardMap['ICU-B']._id, status: 'AVAILABLE', dailyRate: 350.0, notes: 'Ventilator unit B-5' },
      { bedNumber: 'ICU-206', wardId: wardMap['ICU-B']._id, status: 'AVAILABLE', dailyRate: 350.0, notes: 'Isolation negative pressure' },

      // EMG-T (6 beds)
      { bedNumber: 'EMG-01', wardId: wardMap['EMG-T']._id, status: 'AVAILABLE', dailyRate: 150.0, notes: 'Crash cart adjacent' },
      { bedNumber: 'EMG-02', wardId: wardMap['EMG-T']._id, status: 'OCCUPIED', dailyRate: 150.0, notes: 'Acute trauma observation' },
      { bedNumber: 'EMG-03', wardId: wardMap['EMG-T']._id, status: 'AVAILABLE', dailyRate: 150.0, notes: 'Triage bay 3' },
      { bedNumber: 'EMG-04', wardId: wardMap['EMG-T']._id, status: 'CLEANING', dailyRate: 150.0, notes: 'Disinfection cycle' },
      { bedNumber: 'EMG-05', wardId: wardMap['EMG-T']._id, status: 'AVAILABLE', dailyRate: 150.0, notes: 'Rapid assessment bay' },
      { bedNumber: 'EMG-06', wardId: wardMap['EMG-T']._id, status: 'AVAILABLE', dailyRate: 150.0, notes: 'Stretcher bay 6' },

      // PRV-S (6 beds)
      { bedNumber: 'PRV-301', wardId: wardMap['PRV-S']._id, status: 'OCCUPIED', dailyRate: 250.0, notes: 'VIP Suite 301' },
      { bedNumber: 'PRV-302', wardId: wardMap['PRV-S']._id, status: 'AVAILABLE', dailyRate: 250.0, notes: 'Executive Suite 302' },
      { bedNumber: 'PRV-303', wardId: wardMap['PRV-S']._id, status: 'AVAILABLE', dailyRate: 250.0, notes: 'Executive Suite 303' },
      { bedNumber: 'PRV-304', wardId: wardMap['PRV-S']._id, status: 'RESERVED', dailyRate: 250.0, notes: 'Reserved for post-op recovery' },
      { bedNumber: 'PRV-305', wardId: wardMap['PRV-S']._id, status: 'AVAILABLE', dailyRate: 250.0, notes: 'Executive Suite 305' },
      { bedNumber: 'PRV-306', wardId: wardMap['PRV-S']._id, status: 'CLEANING', dailyRate: 250.0, notes: 'Housekeeping turnaround' },

      // SEMI-W (6 beds)
      { bedNumber: 'SEMI-201', wardId: wardMap['SEMI-W']._id, status: 'AVAILABLE', dailyRate: 130.0, notes: 'Room 201 Bed A' },
      { bedNumber: 'SEMI-202', wardId: wardMap['SEMI-W']._id, status: 'AVAILABLE', dailyRate: 130.0, notes: 'Room 201 Bed B' },
      { bedNumber: 'SEMI-203', wardId: wardMap['SEMI-W']._id, status: 'OCCUPIED', dailyRate: 130.0, notes: 'Room 202 Bed A' },
      { bedNumber: 'SEMI-204', wardId: wardMap['SEMI-W']._id, status: 'AVAILABLE', dailyRate: 130.0, notes: 'Room 202 Bed B' },
      { bedNumber: 'SEMI-205', wardId: wardMap['SEMI-W']._id, status: 'AVAILABLE', dailyRate: 130.0, notes: 'Room 203 Bed A' },
      { bedNumber: 'SEMI-206', wardId: wardMap['SEMI-W']._id, status: 'CLEANING', dailyRate: 130.0, notes: 'Room 203 Bed B' },
    ];

    const beds = await Bed.insertMany(bedsData);
    const bedMap: { [key: string]: any } = {};
    beds.forEach((b) => {
      bedMap[b.bedNumber] = b;
    });

    // 4. Seed Admin User
    console.log('👤 Seeding Admin User...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@hospital.com',
      password: adminPassword,
      phone: '+1 (555) 019-2834',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    });

    // 5. Seed Doctors
    console.log('🩺 Seeding Doctors...');
    const doctorsData = [
      {
        user: {
          name: 'Dr. Sarah Jenkins',
          email: 'dr.sarah@hospital.com',
          password: doctorPassword,
          phone: '+1 (555) 234-5678',
          role: 'DOCTOR',
          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
        },
        docInfo: {
          specialization: 'Cardiologist & Interventional Cardiology',
          licenseNumber: 'MD-LIC-1001',
          qualification: 'MBBS, MD, FACC (Harvard Medical)',
          experienceYears: 12,
          consultationFee: 120.0,
          departmentId: deptMap['CARD']._id,
          bio: 'Specialist in non-invasive coronary diagnostics, echocardiography, and hypertension management.',
          roomNumber: 'Room 302, West Wing',
          availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          timeSlots: '09:00 AM,10:00 AM,11:00 AM,02:00 PM,03:00 PM,04:00 PM',
        },
      },
      {
        user: {
          name: 'Dr. Robert Smith',
          email: 'dr.smith@hospital.com',
          password: doctorPassword,
          phone: '+1 (555) 234-9988',
          role: 'DOCTOR',
          avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&q=80',
        },
        docInfo: {
          specialization: 'Chief Cardiologist',
          licenseNumber: 'MD-LIC-1000',
          qualification: 'MBBS, MD, DM (Cardio)',
          experienceYears: 18,
          consultationFee: 130.0,
          departmentId: deptMap['CARD']._id,
          bio: 'Senior consultant cardiologist in cardiovascular interventions and preventative care.',
          roomNumber: 'Room 301, West Wing',
          availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          timeSlots: '09:00 AM,10:00 AM,11:00 AM,02:00 PM,03:00 PM,04:00 PM',
        },
      },
      {
        user: {
          name: 'Dr. Marcus Chen',
          email: 'dr.marcus@hospital.com',
          password: doctorPassword,
          phone: '+1 (555) 345-6789',
          role: 'DOCTOR',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80',
        },
        docInfo: {
          specialization: 'Neurologist & Stroke Specialist',
          licenseNumber: 'MD-LIC-1002',
          qualification: 'MBBS, DM (Neurology), Johns Hopkins',
          experienceYears: 9,
          consultationFee: 140.0,
          departmentId: deptMap['NEUR']._id,
          bio: 'Expert in clinical epilepsy, neuro-rehabilitation, multiple sclerosis, and acute stroke recovery.',
          roomNumber: 'Room 405, North Tower',
          availableDays: 'Monday,Wednesday,Friday,Saturday',
          timeSlots: '09:30 AM,10:30 AM,11:30 AM,02:30 PM,03:30 PM',
        },
      },
      {
        user: {
          name: 'Dr. Emily Rodriguez',
          email: 'dr.emily@hospital.com',
          password: doctorPassword,
          phone: '+1 (555) 456-7890',
          role: 'DOCTOR',
          avatar: 'https://images.unsplash.com/photo-1594824813627-f4728f331908?auto=format&fit=crop&w=256&q=80',
        },
        docInfo: {
          specialization: 'Pediatric Specialist',
          licenseNumber: 'MD-LIC-1003',
          qualification: 'MBBS, MD (Pediatrics), FAAP',
          experienceYears: 7,
          consultationFee: 90.0,
          departmentId: deptMap['PEDI']._id,
          bio: 'Dedicated to compassionate pediatric care, adolescent wellness, neonatology, and immunization protocols.',
          roomNumber: 'Room 108, Pediatric Care Center',
          availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          timeSlots: '09:00 AM,10:00 AM,11:00 AM,01:30 PM,02:30 PM,03:30 PM',
        },
      },
      {
        user: {
          name: 'Dr. David Miller',
          email: 'dr.david@hospital.com',
          password: doctorPassword,
          phone: '+1 (555) 567-8901',
          role: 'DOCTOR',
          avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&q=80',
        },
        docInfo: {
          specialization: 'Orthopedic Surgeon',
          licenseNumber: 'MD-LIC-1004',
          qualification: 'MBBS, MS (Ortho), MCh, FAAOS',
          experienceYears: 15,
          consultationFee: 150.0,
          departmentId: deptMap['ORTH']._id,
          bio: 'Renowned orthopedic surgeon specializing in robotic joint replacement, trauma reconstruction, and sports injuries.',
          roomNumber: 'Room 214, Surgical Wing',
          availableDays: 'Tuesday,Wednesday,Thursday,Saturday',
          timeSlots: '09:00 AM,10:00 AM,11:00 AM,02:00 PM,03:00 PM',
        },
      },
    ];

    const doctorsList: any[] = [];
    for (const item of doctorsData) {
      const u = await User.create(item.user);
      const d = await Doctor.create({
        userId: u._id,
        ...item.docInfo,
      });

      // Create weekly schedules
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (const day of days) {
        await DoctorSchedule.create({
          doctorId: d._id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          maxPatientsPerSlot: 1,
          isAvailable: true,
        });
      }

      doctorsList.push({ user: u, doctor: d });
    }

    // 6. Seed Patients
    console.log('🧑‍⚕️ Seeding Patients...');
    const patientsData = [
      {
        user: {
          name: 'John Doe',
          email: 'patient.john@hospital.com',
          password: patientPassword,
          phone: '+1 (555) 111-2233',
          role: 'PATIENT',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        },
        patInfo: {
          medicalRecordNumber: 'MRN-2026-1001',
          gender: 'MALE',
          dateOfBirth: '1985-06-15',
          bloodGroup: 'O+',
          address: '742 Evergreen Terrace, Springfield',
          emergencyContactName: 'Mary Doe',
          emergencyContactPhone: '+1 (555) 111-9988',
          allergies: 'Penicillin, Peanuts',
          chronicConditions: 'Mild Hypertension',
          insuranceProvider: 'BlueCross Health Premier',
          insurancePolicyNumber: 'BC-99201934',
        },
      },
      {
        user: {
          name: 'John Patient',
          email: 'john@patient.com',
          password: patientPassword,
          phone: '+1 (555) 111-2234',
          role: 'PATIENT',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        },
        patInfo: {
          medicalRecordNumber: 'MRN-2026-1000',
          gender: 'MALE',
          dateOfBirth: '1988-04-10',
          bloodGroup: 'O+',
          address: '100 Main Street, Springfield',
          emergencyContactName: 'Mary Patient',
          emergencyContactPhone: '+1 (555) 111-9999',
          allergies: 'None',
          chronicConditions: 'None',
          insuranceProvider: 'BlueCross Health',
          insurancePolicyNumber: 'BC-11223344',
        },
      },
      {
        user: {
          name: 'Emily Smith',
          email: 'patient.emily@hospital.com',
          password: patientPassword,
          phone: '+1 (555) 222-3344',
          role: 'PATIENT',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
        },
        patInfo: {
          medicalRecordNumber: 'MRN-2026-1002',
          gender: 'FEMALE',
          dateOfBirth: '1992-09-24',
          bloodGroup: 'A+',
          address: '124 Conch Street, Pacific City',
          emergencyContactName: 'David Smith',
          emergencyContactPhone: '+1 (555) 222-7788',
          allergies: 'None',
          chronicConditions: 'Asthma (controlled)',
          insuranceProvider: 'Aetna Global Life',
          insurancePolicyNumber: 'AET-4439201',
        },
      },
      {
        user: {
          name: 'Michael Johnson',
          email: 'patient.michael@hospital.com',
          password: patientPassword,
          phone: '+1 (555) 333-4455',
          role: 'PATIENT',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
        },
        patInfo: {
          medicalRecordNumber: 'MRN-2026-1003',
          gender: 'MALE',
          dateOfBirth: '1978-03-12',
          bloodGroup: 'B+',
          address: '42 Wallaby Way, Sydney',
          emergencyContactName: 'Karen Johnson',
          emergencyContactPhone: '+1 (555) 333-9900',
          allergies: 'Sulfa Drugs',
          chronicConditions: 'Type 2 Diabetes, Coronary Artery Disease',
          insuranceProvider: 'United Healthcare Elite',
          insurancePolicyNumber: 'UH-8891023',
        },
      },
      {
        user: {
          name: 'Sophia Williams',
          email: 'patient.sophia@hospital.com',
          password: patientPassword,
          phone: '+1 (555) 444-5566',
          role: 'PATIENT',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
        },
        patInfo: {
          medicalRecordNumber: 'MRN-2026-1004',
          gender: 'FEMALE',
          dateOfBirth: '1995-11-05',
          bloodGroup: 'AB+',
          address: '221B Baker Street, Metro',
          emergencyContactName: 'James Williams',
          emergencyContactPhone: '+1 (555) 444-1122',
          allergies: 'Aspirin',
          chronicConditions: 'Chronic Migraines',
          insuranceProvider: 'Cigna Health Plus',
          insurancePolicyNumber: 'CG-1029384',
        },
      },
      {
        user: {
          name: 'Robert Brown',
          email: 'patient.robert@hospital.com',
          password: patientPassword,
          phone: '+1 (555) 555-6677',
          role: 'PATIENT',
          avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
        },
        patInfo: {
          medicalRecordNumber: 'MRN-2026-1005',
          gender: 'MALE',
          dateOfBirth: '1965-01-20',
          bloodGroup: 'O-',
          address: '350 Fifth Avenue, Metropolis',
          emergencyContactName: 'Susan Brown',
          emergencyContactPhone: '+1 (555) 555-9988',
          allergies: 'Latex, Codeine',
          chronicConditions: 'Osteoarthritis, Hyperlipidemia',
          insuranceProvider: 'Medicare Advantage Plan',
          insurancePolicyNumber: 'MC-7766554',
        },
      },
    ];

    const patientsList: any[] = [];
    for (const item of patientsData) {
      const u = await User.create(item.user);
      const p = await Patient.create({
        userId: u._id,
        ...item.patInfo,
      });
      patientsList.push({ user: u, patient: p });
    }

    const drSarah = doctorsList[0].doctor;
    const drMarcus = doctorsList[1].doctor;
    const drEmily = doctorsList[2].doctor;
    const drDavid = doctorsList[3].doctor;

    const patJohn = patientsList[0].patient;
    const patEmily = patientsList[1].patient;
    const patMichael = patientsList[2].patient;
    const patSophia = patientsList[3].patient;
    const patRobert = patientsList[4].patient;

    // 7. Seed Admissions
    console.log('🏥 Seeding Admissions...');
    // Active Inpatient 1: Michael in ICU-201
    await Admission.create({
      admissionNumber: 'ADM-2026-1001',
      patientId: patMichael._id,
      bedId: bedMap['ICU-201']._id,
      admittingDoctorId: drSarah._id,
      admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reason: 'Acute Coronary Syndrome - Post Stent Monitoring',
      diagnosis: 'NSTEMI with successful drug-eluting stent placement in LAD. Continuous hemodynamic rhythm telemetry.',
      status: 'ACTIVE',
    });

    // Active Inpatient 2: Sophia in PRV-301
    await Admission.create({
      admissionNumber: 'ADM-2026-1002',
      patientId: patSophia._id,
      bedId: bedMap['PRV-301']._id,
      admittingDoctorId: drMarcus._id,
      admissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      reason: 'Severe Intractable Migraine with Visual Aura',
      diagnosis: 'Status migrainosus refractory to oral therapy. Receiving IV magnesium and dihydroergotamine infusion.',
      status: 'ACTIVE',
    });

    // Active Inpatient 3: EMG-02
    await Admission.create({
      admissionNumber: 'ADM-2026-1003',
      patientId: patRobert._id,
      bedId: bedMap['EMG-02']._id,
      admittingDoctorId: drDavid._id,
      admissionDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      reason: 'Right Tibial Fracture following Fall',
      diagnosis: 'Closed fracture of right tibial shaft. Cast immobilized, awaiting surgical fixation schedule.',
      status: 'ACTIVE',
    });

    // Past Discharged Admission: John Doe in GEN-102
    await Admission.create({
      admissionNumber: 'ADM-2026-0998',
      patientId: patJohn._id,
      bedId: bedMap['GEN-102']._id,
      admittingDoctorId: drSarah._id,
      admissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      dischargeDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      reason: 'Hypertensive Emergency & Severe Chest Discomfort',
      diagnosis: 'Essential Hypertension Grade III successfully managed and titrated with ACE inhibitors.',
      status: 'DISCHARGED',
      dischargeSummary: 'Patient responded well to Amlodipine and Lisinopril. Blood pressure stabilized at 122/78 mmHg. Discharged in stable condition with outpatient follow-up in 2 weeks.',
      totalBill: 375.0,
    });

    // 8. Seed Appointments
    console.log('📅 Seeding Appointments across lifecycle states...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Completed appointment with prescription for John Doe
    const apt1 = await Appointment.create({
      appointmentNumber: 'APT-2026-601',
      patientId: patJohn._id,
      doctorId: drSarah._id,
      departmentId: deptMap['CARD']._id,
      appointmentDate: pastDate,
      timeSlot: '09:00 AM',
      status: 'COMPLETED',
      reason: 'Routine cardiac follow-up and ECG review',
      symptoms: 'Mild shortness of breath upon brisk walking.',
      notes: 'Cardiovascular examination normal, S1/S2 distinct, no murmurs. ECG shows normal sinus rhythm.',
    });

    // Create prescription for apt1
    await Prescription.create({
      prescriptionNumber: 'RX-2026-8801',
      appointmentId: apt1._id,
      patientId: patJohn._id,
      doctorId: drSarah._id,
      diagnosis: 'Essential Hypertension Stage 1 & Mild Dyslipidemia',
      notes: 'Take medications with food. Avoid excess sodium. Monitor home BP twice weekly.',
      followUpDate: nextWeek,
      items: [
        {
          medicineName: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily (Morning)',
          duration: '30 days',
          route: 'Oral',
          instructions: 'Take in the morning with a full glass of water',
        },
        {
          medicineName: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'Once daily (Night)',
          duration: '30 days',
          route: 'Oral',
          instructions: 'Take before bedtime',
        },
        {
          medicineName: 'Low Dose Aspirin',
          dosage: '81mg',
          frequency: 'Once daily (Lunch)',
          duration: '30 days',
          route: 'Oral',
          instructions: 'Take immediately after food',
        },
      ],
    });

    // Medical Record for John Doe
    await MedicalRecord.create({
      recordNumber: 'REC-2026-101',
      patientId: patJohn._id,
      doctorId: drSarah._id,
      title: 'Comprehensive Cardiovascular Consultation & ECG',
      recordType: 'CONSULTATION',
      notes: 'Resting 12-lead ECG demonstrates normal sinus rhythm with no ST-T abnormalities. Lipid profile: Total Cholesterol 210 mg/dL, LDL 135 mg/dL, HDL 48 mg/dL. Commenced on statin therapy.',
      recordDate: pastDate,
    });

    // Today's Accepted appointment: John Doe with Dr. Marcus
    await Appointment.create({
      appointmentNumber: 'APT-2026-602',
      patientId: patJohn._id,
      doctorId: drMarcus._id,
      departmentId: deptMap['NEUR']._id,
      appointmentDate: today,
      timeSlot: '10:30 AM',
      status: 'ACCEPTED',
      reason: 'Frequent tension headaches and occasional dizziness',
      symptoms: 'Bilateral throbbing headache around temples after screen work.',
    });

    // Today's In-Progress appointment: Emily Smith with Dr. Sarah
    await Appointment.create({
      appointmentNumber: 'APT-2026-603',
      patientId: patEmily._id,
      doctorId: drSarah._id,
      departmentId: deptMap['CARD']._id,
      appointmentDate: today,
      timeSlot: '11:00 AM',
      status: 'IN_PROGRESS',
      reason: 'Palpitations during cardiovascular workouts',
      symptoms: 'Occasional skipped beats noted during high intensity running.',
      notes: 'In consultation room. Reviewing 24-hr Holter monitor results.',
    });

    // Pending appointment request: Emily with Dr. Emily (Pediatrics)
    await Appointment.create({
      appointmentNumber: 'APT-2026-604',
      patientId: patEmily._id,
      doctorId: drEmily._id,
      departmentId: deptMap['PEDI']._id,
      appointmentDate: tomorrow,
      timeSlot: '10:00 AM',
      status: 'PENDING',
      reason: 'Annual developmental wellness check for toddler',
      symptoms: 'Child is active and healthy. Needs 2-year vaccination booster.',
    });

    // Pending appointment request: Robert with Dr. David (Orthopedics)
    await Appointment.create({
      appointmentNumber: 'APT-2026-605',
      patientId: patRobert._id,
      doctorId: drDavid._id,
      departmentId: deptMap['ORTH']._id,
      appointmentDate: tomorrow,
      timeSlot: '02:00 PM',
      status: 'PENDING',
      reason: 'Severe chronic right knee stiffness and crepitus',
      symptoms: 'Pain worsening when climbing stairs. Decreased range of motion.',
    });

    // Rejected appointment request with reason
    await Appointment.create({
      appointmentNumber: 'APT-2026-606',
      patientId: patMichael._id,
      doctorId: drDavid._id,
      departmentId: deptMap['ORTH']._id,
      appointmentDate: pastDate,
      timeSlot: '03:00 PM',
      status: 'REJECTED',
      reason: 'General joint ache assessment',
      rejectionReason: 'Doctor was in emergency surgery duty. Please reschedule for upcoming Tuesday clinic.',
    });

    // 9. Seed System Notifications
    console.log('🔔 Seeding Notifications...');
    await Notification.create({
      userId: adminUser._id,
      title: 'Hospital System Initialized',
      message: 'MongoDB Atlas integration active. All clinical wards, beds, and staff profiles synchronized.',
      type: 'SYSTEM',
    });

    await Notification.create({
      userId: doctorsList[0].user._id,
      title: 'Today Schedule Reminder',
      message: 'You have 2 scheduled consultations and 1 critical ICU inpatient rounds today.',
      type: 'APPOINTMENT',
      link: '/doctor/appointments',
    });

    await Notification.create({
      userId: patientsList[0].user._id,
      title: 'Appointment Confirmed',
      message: 'Your appointment with Dr. Marcus Chen has been accepted for today at 10:30 AM.',
      type: 'APPOINTMENT',
      link: '/patient/appointments',
    });

    await Notification.create({
      userId: patientsList[0].user._id,
      title: 'Prescription Available',
      message: 'Dr. Sarah Jenkins has issued prescription RX-2026-8801. You can review instructions in your portal.',
      type: 'PRESCRIPTION',
      link: '/patient/prescriptions',
    });

    console.log('\n✨ Database seeding completed successfully!');
    console.log('====================================================');
    console.log('🔑 DEMO CREDENTIALS:');
    console.log('👤 Admin:   admin@hospital.com   / admin123');
    console.log('🩺 Doctor:  dr.sarah@hospital.com / doctor123');
    console.log('🩺 Doctor:  dr.marcus@hospital.com / doctor123');
    console.log('🧑 Patient: patient.john@hospital.com / patient123');
    console.log('🧑 Patient: patient.emily@hospital.com / patient123');
    console.log('====================================================\n');

    if (disconnectAfter) {
      await mongoose.disconnect();
      console.log('🍃 Disconnected from MongoDB cleanly.');
    }
  } catch (err: any) {
    console.error('❌ Seeder Error:', err);
    if (disconnectAfter) process.exit(1);
    throw err;
  }
}

// Run seeder if executed directly
if (require.main === module) {
  seedDatabase();
}
