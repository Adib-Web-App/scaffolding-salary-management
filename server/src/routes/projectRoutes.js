import { Router } from 'express';
import * as projectController from '../controllers/projectController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requirePermission('projects:read'), projectController.listProjects);
router.get('/:id', requirePermission('projects:read'), projectController.getProject);
router.post('/', requirePermission('projects:write'), projectController.createProject);
router.put('/:id', requirePermission('projects:write'), projectController.updateProject);
router.delete('/:id', requirePermission('projects:write'), projectController.deleteProject);

export default router;
