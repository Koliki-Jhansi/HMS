import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  updatePatientMedicalInfo,
} from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize(['ADMIN', 'DOCTOR']), getPatients);
router.get('/:id', authenticate, getPatientById);
router.put('/:id', authenticate, updatePatientMedicalInfo);

export default router;
