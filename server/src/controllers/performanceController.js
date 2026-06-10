import * as performanceModel from '../models/performanceModel.js';
import { pickDateQueryFilters } from '../utils/dateUtils.js';

export async function getPerformance(req, res, next) {
  try {
    const data = await performanceModel.getWorkerPerformance({
      ...pickDateQueryFilters(req.query),
      projectId: req.query.projectId || '',
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
