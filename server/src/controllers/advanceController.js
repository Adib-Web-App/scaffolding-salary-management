import * as advanceModel from '../models/advanceModel.js';

export async function listAdvances(req, res, next) {
  try {
    const advances = await advanceModel.findAllAdvances({
      search: req.query.search || '',
      dateFrom: req.query.dateFrom || '',
      dateTo: req.query.dateTo || '',
      worker: req.query.worker || '',
      projectId: req.query.projectId || '',
    });
    res.json({ success: true, data: advances });
  } catch (err) {
    next(err);
  }
}

export async function getAdvance(req, res, next) {
  try {
    const advance = await advanceModel.findAdvanceById(req.params.id);
    if (!advance) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }
    res.json({ success: true, data: advance });
  } catch (err) {
    next(err);
  }
}

export async function createAdvance(req, res, next) {
  try {
    const { worker_name, advance_date, amount, remarks, project_id } = req.body;
    if (!worker_name?.trim() || !advance_date) {
      return res.status(400).json({ success: false, message: 'Worker name and date are required' });
    }
    const advance = await advanceModel.createAdvance({
      worker_name: worker_name.trim(),
      advance_date,
      amount: Number(amount) || 0,
      remarks: remarks?.trim() || '',
      project_id: project_id ? Number(project_id) : null,
    });
    res.status(201).json({ success: true, data: advance });
  } catch (err) {
    next(err);
  }
}

export async function updateAdvance(req, res, next) {
  try {
    const existing = await advanceModel.findAdvanceById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }
    const { worker_name, advance_date, amount, remarks, project_id } = req.body;
    const advance = await advanceModel.updateAdvance(req.params.id, {
      worker_name: (worker_name ?? existing.worker_name).trim(),
      advance_date: advance_date ?? existing.advance_date,
      amount: Number(amount ?? existing.amount),
      remarks: remarks ?? existing.remarks,
      project_id:
        project_id !== undefined
          ? project_id
            ? Number(project_id)
            : null
          : existing.project_id,
    });
    res.json({ success: true, data: advance });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdvance(req, res, next) {
  try {
    const deleted = await advanceModel.deleteAdvance(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }
    res.json({ success: true, message: 'Advance deleted' });
  } catch (err) {
    next(err);
  }
}
