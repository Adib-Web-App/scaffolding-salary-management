import * as housekeepingModel from '../models/housekeepingModel.js';
import { pickDateQueryFilters } from '../utils/dateUtils.js';

export async function listHousekeeping(req, res, next) {
  try {
    const records = await housekeepingModel.findAllHousekeeping({
      search: req.query.search || '',
      ...pickDateQueryFilters(req.query),
      worker: req.query.worker || '',
      projectId: req.query.projectId || '',
    });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}

export async function getHousekeeping(req, res, next) {
  try {
    const record = await housekeepingModel.findHousekeepingById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Housekeeping record not found' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

export async function createHousekeeping(req, res, next) {
  try {
    const { worker_name, housekeeping_date, amount, remarks, project_id } = req.body;
    if (!worker_name?.trim() || !housekeeping_date) {
      return res.status(400).json({ success: false, message: 'Worker name and date are required' });
    }
    const record = await housekeepingModel.createHousekeeping({
      worker_name: worker_name.trim(),
      housekeeping_date,
      amount: Number(amount) || 0,
      remarks: remarks?.trim() || '',
      project_id: project_id ? Number(project_id) : null,
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

export async function updateHousekeeping(req, res, next) {
  try {
    const existing = await housekeepingModel.findHousekeepingById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Housekeeping record not found' });
    }
    const { worker_name, housekeeping_date, amount, remarks, project_id } = req.body;
    const record = await housekeepingModel.updateHousekeeping(req.params.id, {
      worker_name: (worker_name ?? existing.worker_name).trim(),
      housekeeping_date: housekeeping_date ?? existing.housekeeping_date,
      amount: Number(amount ?? existing.amount),
      remarks: remarks ?? existing.remarks,
      project_id:
        project_id !== undefined
          ? project_id
            ? Number(project_id)
            : null
          : existing.project_id,
    });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

export async function deleteHousekeeping(req, res, next) {
  try {
    const deleted = await housekeepingModel.deleteHousekeeping(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Housekeeping record not found' });
    }
    res.json({ success: true, message: 'Housekeeping record deleted' });
  } catch (err) {
    next(err);
  }
}
