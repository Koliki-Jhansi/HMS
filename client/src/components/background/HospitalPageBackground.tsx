import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

const ROUTE_BACKGROUND_MAP: Record<string, string> = {
  // Dashboards (Role-Specific Full-Screen Environments)
  '/admin': '/images/hiro/lobby.jpg',
  '/doctor': '/images/hiro/corridor.jpg',
  '/patient': '/images/hiro/lobby.jpg',

  // Patients Areas
  '/admin/patients': '/images/hiro/ward.jpg',
  '/doctor/patients': '/images/hiro/ward.jpg',

  // Doctors & Clinical Consultations
  '/admin/doctors': '/images/hiro/corridor.jpg',
  '/doctor/appointments': '/images/hiro/corridor.jpg',
  '/doctor/consultation': '/images/hiro/corridor.jpg',
  '/doctor/schedule': '/images/hiro/corridor.jpg',

  // Appointments & Reception Areas
  '/admin/appointments': '/images/hiro/entrance.jpg',
  '/patient/book': '/images/hiro/entrance.jpg',
  '/patient/appointments': '/images/hiro/entrance.jpg',

  // Wards, Rooms & Inpatient Bed Matrix
  '/admin/beds': '/images/hiro/room.jpg',
  '/admin/admissions': '/images/hiro/ward.jpg',
  '/patient/bed-admission': '/images/hiro/room.jpg',

  // Diagnostics, Medical Records & Pharmacy
  '/patient/medical-records': '/images/hiro/lab.jpg',
  '/patient/prescriptions': '/images/hiro/pharmacy.jpg',

  // Administrative Operations
  '/admin/departments': '/images/hiro/lobby.jpg',
  '/admin/users': '/images/hiro/lobby.jpg',
};

export const HospitalPageBackground: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const currentPath = location.pathname;
  let bgImage = '/images/hiro/lobby.jpg';

  for (const [route, img] of Object.entries(ROUTE_BACKGROUND_MAP)) {
    if (currentPath === route || currentPath.startsWith(`${route}/`)) {
      bgImage = img;
      break;
    }
  }

  const isDoctor = currentPath.startsWith('/doctor');
  const isAdmin = currentPath.startsWith('/admin');

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* 3D Moving Hospital Visual with Slow Continuous Automatic Drift */}
      <motion.div
        key={bgImage}
        className="absolute -inset-[5%] w-[110%] h-[110%] bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImage})`,
          willChange: 'transform, opacity',
        }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, scale: 1.0 }
            : {
                opacity: 1,
                scale: [1.0, 1.03, 1.0],
                x: isDoctor ? [0, -8, 6, 0] : isAdmin ? [0, 8, -6, 0] : [-5, 5, -3, -5],
                y: [0, -5, 4, 0],
                transition: {
                  opacity: { duration: 0.5, ease: 'easeOut' },
                  scale: { duration: 24, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                  x: { duration: 28, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                  y: { duration: 22, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                },
              }
        }
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
      />

      {/* Local Gradient Readability Scrim (Leaves 75%+ of the hospital clearly visible) */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/75 z-[2]" />

      {/* Role-Specific Subtle Mood Highlight */}
      <div
        className={`absolute inset-0 z-[3] ${
          isAdmin
            ? 'bg-radial-at-tl from-blue-600/15 via-transparent to-transparent'
            : isDoctor
            ? 'bg-radial-at-tl from-cyan-500/15 via-transparent to-transparent'
            : 'bg-radial-at-tl from-teal-500/15 via-transparent to-transparent'
        }`}
      />
    </div>
  );
};

export default HospitalPageBackground;
