import { Router } from 'express';
import * as advanceController from '../controllers/advanceController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requirePermission('advances:read'), advanceController.listAdvances);
router.get('/:id', requirePermission('advances:read'), advanceController.getAdvance);
router.post('/', requirePermission('advances:write'), advanceController.createAdvance);
router.put('/:id', requirePermission('advances:write'), advanceController.updateAdvance);
router.delete('/:id', requirePermission('advances:write'), advanceController.deleteAdvance);

export default router;
