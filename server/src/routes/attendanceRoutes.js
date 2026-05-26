import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/monthly-summary', requirePermission('attendance:read'), attendanceController.monthlySummary);
router.get('/worker/:worker', requirePermission('attendance:read'), attendanceController.workerHistory);
router.get('/', requirePermission('attendance:read'), attendanceController.listAttendance);
router.get('/:id', requirePermission('attendance:read'), attendanceController.getAttendance);
router.post('/', requirePermission('attendance:write'), attendanceController.createAttendance);
router.put('/:id', requirePermission('attendance:write'), attendanceController.updateAttendance);
router.delete('/:id', requirePermission('attendance:write'), attendanceController.deleteAttendance);

export default router;
