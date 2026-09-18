import { Router } from 'express';
import {
  getMedicalRecords,
  createMedicalRecord,
} from '../controllers/medicalRecord.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMedicalRecords);
router.post('/', authenticate, authorize(['DOCTOR', 'ADMIN']), createMedicalRecord);

export default router;
