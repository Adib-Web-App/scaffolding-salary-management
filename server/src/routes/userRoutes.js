import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requirePermission('users:read'), userController.listUsers);
router.post('/', requirePermission('users:write'), userController.createUser);
router.put('/:id', requirePermission('users:write'), userController.updateUser);
router.delete('/:id', requirePermission('users:write'), userController.deleteUser);

export default router;
