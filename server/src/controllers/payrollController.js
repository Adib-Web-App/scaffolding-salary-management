import * as payrollModel from '../models/payrollModel.js';
import { generatePayslipPdf } from '../services/payslipService.js';

export async function getPayrollPreview(req, res, next) {
  try {
    const { worker, year, month } = req.query;
    if (!worker || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'worker, year, and month query parameters are required',
      });
    }
    const data = await payrollModel.getWorkerPayroll(worker, year, month);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function downloadPayslip(req, res, next) {
  try {
    const { worker, year, month } = req.query;
    if (!worker || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'worker, year, and month query parameters are required',
      });
    }
    const payroll = await payrollModel.getWorkerPayroll(worker, year, month);
    const pdfBuffer = await generatePayslipPdf(payroll);
    const filename = `payslip-${worker.replace(/\s+/g, '-')}-${year}-${String(month).padStart(2, '0')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
