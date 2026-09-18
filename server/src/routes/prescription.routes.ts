import { Router } from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
} from '../controllers/prescription.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getPrescriptions);
router.get('/:id', authenticate, getPrescriptionById);
router.post('/', authenticate, authorize(['DOCTOR', 'ADMIN']), createPrescription);

export default router;
