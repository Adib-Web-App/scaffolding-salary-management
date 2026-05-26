import { Router } from 'express';
import * as payrollController from '../controllers/payrollController.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/preview', requirePermission('payroll:read'), payrollController.getPayrollPreview);
router.get('/payslip', requirePermission('payroll:export'), payrollController.downloadPayslip);

export default router;
