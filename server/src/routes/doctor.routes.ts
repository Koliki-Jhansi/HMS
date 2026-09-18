import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  updateDoctorSchedule,
  getDoctorPatients,
  getDoctorSchedules,
} from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDoctors);
router.get('/patients', authenticate, authorize(['DOCTOR', 'ADMIN']), getDoctorPatients);
router.get('/:id', getDoctorById);
router.get('/:id/schedules', getDoctorSchedules);
router.put('/:id/schedule', authenticate, authorize(['DOCTOR', 'ADMIN']), updateDoctorSchedule);

export default router;
