import { Router } from 'express';
import * as workEntryController from '../controllers/workEntryController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/workers', requirePermission('work-entries:read'), workEntryController.listWorkers);
router.post('/preview', requirePermission('work-entries:read'), workEntryController.previewCalculation);
router.get('/', requirePermission('work-entries:read'), workEntryController.listWorkEntries);
router.get('/:id', requirePermission('work-entries:read'), workEntryController.getWorkEntry);
router.post('/', requirePermission('work-entries:write'), workEntryController.createWorkEntry);
router.put('/:id', requirePermission('work-entries:write'), workEntryController.updateWorkEntry);
router.delete('/:id', requirePermission('work-entries:write'), workEntryController.deleteWorkEntry);

export default router;
