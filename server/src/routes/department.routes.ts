import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authenticate, authorize(['ADMIN']), createDepartment);
router.put('/:id', authenticate, authorize(['ADMIN']), updateDepartment);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteDepartment);

export default router;
