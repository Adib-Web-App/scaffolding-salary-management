import { Router } from 'express';
import * as housekeepingController from '../controllers/housekeepingController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requirePermission('housekeeping:read'), housekeepingController.listHousekeeping);
router.get('/:id', requirePermission('housekeeping:read'), housekeepingController.getHousekeeping);
router.post('/', requirePermission('housekeeping:write'), housekeepingController.createHousekeeping);
router.put('/:id', requirePermission('housekeeping:write'), housekeepingController.updateHousekeeping);
router.delete('/:id', requirePermission('housekeeping:write'), housekeepingController.deleteHousekeeping);

export default router;
