import * as attendanceModel from '../models/attendanceModel.js';

export async function listAttendance(req, res, next) {
  try {
    const data = await attendanceModel.findAllAttendance({
      search: req.query.search || '',
      dateFrom: req.query.dateFrom || '',
      dateTo: req.query.dateTo || '',
      worker: req.query.worker || '',
      projectId: req.query.projectId || '',
      month: req.query.month || '',
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getAttendance(req, res, next) {
  try {
    const row = await attendanceModel.findAttendanceById(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function createAttendance(req, res, next) {
  try {
    const { attendance_date, worker_name, status, project_id } = req.body;
    if (!attendance_date || !worker_name?.trim() || !status) {
      return res.status(400).json({ success: false, message: 'Date, worker, and status are required' });
    }
    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be present or absent' });
    }
    const row = await attendanceModel.createAttendance({
      attendance_date,
      worker_name: worker_name.trim(),
      status,
      project_id: project_id ? Number(project_id) : null,
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function updateAttendance(req, res, next) {
  try {
    const existing = await attendanceModel.findAttendanceById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    const { attendance_date, worker_name, status, project_id } = req.body;
    const row = await attendanceModel.updateAttendance(req.params.id, {
      attendance_date: attendance_date ?? existing.attendance_date,
      worker_name: (worker_name ?? existing.worker_name).trim(),
      status: status ?? existing.status,
      project_id: project_id !== undefined ? (project_id ? Number(project_id) : null) : existing.project_id,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function deleteAttendance(req, res, next) {
  try {
    const deleted = await attendanceModel.deleteAttendance(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    res.json({ success: true, message: 'Attendance deleted' });
  } catch (err) {
    next(err);
  }
}

export async function workerHistory(req, res, next) {
  try {
    const worker = req.params.worker;
    const data = await attendanceModel.getWorkerHistory(worker, {
      dateFrom: req.query.dateFrom || '',
      dateTo: req.query.dateTo || '',
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function monthlySummary(req, res, next) {
  try {
    const month = req.query.month;
    if (!month) {
      return res.status(400).json({ success: false, message: 'month query (YYYY-MM) is required' });
    }
    const data = await attendanceModel.getMonthlySummary(month);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
