import * as performanceModel from '../models/performanceModel.js';

export async function getPerformance(req, res, next) {
  try {
    const data = await performanceModel.getWorkerPerformance({
      dateFrom: req.query.dateFrom || '',
      dateTo: req.query.dateTo || '',
      projectId: req.query.projectId || '',
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
