# 🏥 MedPulse | Full-Stack Hospital Management System (MERN Stack)

A complete, production-grade **Hospital Management & Inpatient Care Portal** built with **MongoDB Atlas**, **Mongoose ODM**, **Express.js**, **React 18 + Tailwind CSS**, **Node.js**, and **JWT Authentication**.

---

## 🌟 Key Features & Portals

### 🔐 1. Authentication & Role-Based Access Control (RBAC)
- Secure registration and login using JWT session tokens & bcrypt password hashing.
- Role-based authorization for **Admin**, **Doctor**, and **Patient** with protected routes and auto-redirects.
- **1-Click Quick Demo Login Chips** on the login page for instant testing as Admin, Doctor, or Patient.

### 🧑‍⚕️ 2. Patient Portal
- **Dashboard Overview**: Inpatient admission badge & details, upcoming appointments counter, prescriptions count, and medical records summary.
- **Find Specialists & Real-Time Booking**: Filter doctors by clinical department, experience, and fee with conflict prevention.
- **Appointment Progress Tracker**: Live status workflow:
  $$\text{PENDING} \longrightarrow \text{ACCEPTED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{COMPLETED}$$
  *(with full Cancellation and Rejection reason tracking)*.
- **Digital Prescriptions (Rx)**: Medication lists with dosage, schedule, frequency, duration, route, and printable format.
- **Electronic Health Records (EHR)**: Diagnostic lab results, consultation notes, ECG/MRI findings, and discharge summaries.
- **Live Bed Availability Visualizer**: Real-time bed occupancy across **General**, **ICU**, **Emergency**, **Private**, and **Semi-Private** wards.

### 🩺 3. Doctor Consultation Hub
- **Daily Workspace**: Today's scheduled appointments, pending consultation requests, and inpatient rounds.
- **Appointment Queue Manager**: Accept or reject requests with clinical reasoning, and initiate active consultation sessions.
- **Clinical Consultation Room**:
  - Record primary diagnosis, clinical findings, and treatment plan.
  - Multi-item medication builder (Drug name, Dosage, Frequency, Duration, Route, Instructions).
  - Schedule recommended follow-up date.
  - 1-click consultation completion that automatically generates the digital prescription and appends to patient EHR records.
- **Patient Directory**: Review assigned patient history, allergies, chronic conditions, and previous prescriptions.
- **Schedule Management**: Configure working days, daily time slots, room location, and consultation fees.

### 🛡️ 4. Admin Hospital Command Center
- **Hospital Analytics**: Total patients, doctors, departments, admissions, beds, bed occupancy rate %, and live activity feeds.
- **Bed Management System**:
  - Manage **General**, **ICU**, **Emergency**, **Private**, and **Semi-Private** beds.
  - 5 Bed Statuses: `AVAILABLE` | `OCCUPIED` | `RESERVED` | `CLEANING` | `MAINTENANCE`.
  - Filter by ward, status, and bed search.
- **Inpatient Admissions & Discharges**:
  - **Patient Admission**: Assign available bed $\rightarrow$ automatically transitions bed status to `OCCUPIED` and sends notifications.
  - **Patient Discharge**: Calculates hospital stay duration and billing $\rightarrow$ marks bed as `CLEANING` or `AVAILABLE` and attaches discharge summary to patient EHR.
  - **Bed Transfer**: Seamlessly move inpatient to another available bed with automatic status updates.
- **Staff & Resource Management**: Complete CRUD for Doctors, Patients, Departments, Wards, Beds, Appointments, and User accounts.

---

## 🗄️ MongoDB Atlas ODM Models (Mongoose)

| Model | Description |
|---|---|
| `User` | Authentication credentials, role (`ADMIN`, `DOCTOR`, `PATIENT`), avatar, contact info, status |
| `Patient` | Medical record number (MRN), DOB, gender, blood group, allergies, chronic conditions, insurance |
| `Doctor` | Department relation, specialization, license number, qualifications, experience, fees, room |
| `DoctorSchedule` | Weekly consultation schedules, time slots, slot duration, and availability flags |
| `Department` | Clinical departments (Cardiology, Neurology, Orthopedics, Pediatrics, Emergency, etc.) |
| `Ward` | Hospital wards (General, ICU, Emergency, Private, Semi-Private) with floor and capacity |
| `Bed` | Bed numbers, ward relation, daily rates, and statuses (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `CLEANING`, `MAINTENANCE`) |
| `Admission` | Inpatient admission records, patient, bed, admitting doctor, admission/discharge dates, diagnosis, and billing |
| `Appointment` | Booking records, patient, doctor, date/time slot, symptoms, notes, rejection reasons, status |
| `Prescription` | Prescription slip with multi-medicine subdocuments (dosage, frequency, duration, route, instructions) |
| `MedicalRecord` | EHR health records, consultation reports, lab results, and discharge summaries |
| `Notification` | In-app user notifications for appointments, admissions, bed transfers, and prescriptions |

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance running on port 27017

### 1. Backend Setup

```bash
cd server
npm install

# Configure environment variables in server/.env:
# PORT=5000
# JWT_SECRET=super_secret_hospital_jwt_token_key_2026
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hospital_management?retryWrites=true&w=majority

# Seed database with sample hospital departments, wards, beds, doctors, and patients:
npm run seed

# Start server development mode:
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install

# Start Vite React development server:
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@hospital.com` | `admin123` | Full Hospital Operations Access |
| **Doctor** | `dr.sarah@hospital.com` | `doctor123` | Cardiologist |
| **Doctor** | `dr.marcus@hospital.com` | `doctor123` | Neurologist |
| **Patient** | `patient.john@hospital.com` | `patient123` | Inpatient / Outpatient Records |
| **Patient** | `patient.emily@hospital.com` | `patient123` | Outpatient Profile |

*(You can also click the 1-Click Demo Login buttons directly on the Login screen!)*

---

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, Axios, React Router v6.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose ODM, JSON Web Tokens (JWT), bcryptjs, Morgan, Zod.
- **Database**: MongoDB Atlas / MongoDB 7.0+.
