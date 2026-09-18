import { Router } from 'express';
import {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  dischargePatient,
  transferBed,
} from '../controllers/admission.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getAdmissions);
router.get('/:id', authenticate, getAdmissionById);
router.post('/', authenticate, authorize(['ADMIN', 'DOCTOR']), createAdmission);
router.post('/:id/discharge', authenticate, authorize(['ADMIN', 'DOCTOR']), dischargePatient);
router.post('/:id/transfer', authenticate, authorize(['ADMIN', 'DOCTOR']), transferBed);

export default router;
