import { Router } from 'express';
import {
  getBeds,
  getBedById,
  createBed,
  updateBedStatus,
  updateBedDetails,
  deleteBed,
  getBedStats,
} from '../controllers/bed.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public/authenticated bed list & stats
router.get('/', getBeds);
router.get('/stats', getBedStats);
router.get('/:id', getBedById);

// Bed status update - Allowed for Admin & Doctor
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'DOCTOR']), updateBedStatus);

// Bed CRUD - Admin only
router.post('/', authenticate, authorize(['ADMIN']), createBed);
router.put('/:id', authenticate, authorize(['ADMIN']), updateBedDetails);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteBed);

export default router;
