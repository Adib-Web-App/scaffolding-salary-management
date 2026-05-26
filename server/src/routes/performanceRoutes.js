import { Router } from 'express';
import * as performanceController from '../controllers/performanceController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requirePermission('performance:read'), performanceController.getPerformance);

export default router;
