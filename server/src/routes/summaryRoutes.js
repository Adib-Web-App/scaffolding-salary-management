import { Router } from 'express';
import * as summaryController from '../controllers/summaryController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requirePermission('summary:read'), summaryController.getDashboardSummary);

export default router;
