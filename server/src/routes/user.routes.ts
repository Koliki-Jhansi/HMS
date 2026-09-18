import { Router } from 'express';
import {
  getUsers,
  updateUserStatus,
  createStaffUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All user management routes are Admin only
router.use(authenticate, authorize(['ADMIN']));

router.get('/', getUsers);
router.post('/', createStaffUser);
router.patch('/:id/status', updateUserStatus);
router.delete('/:id', deleteUser);

export default router;
