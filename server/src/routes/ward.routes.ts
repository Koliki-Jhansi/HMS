import { Router } from 'express';
import {
  getWards,
  createWard,
  updateWard,
  deleteWard,
} from '../controllers/ward.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getWards);
router.post('/', authenticate, authorize(['ADMIN']), createWard);
router.put('/:id', authenticate, authorize(['ADMIN']), updateWard);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteWard);

export default router;
