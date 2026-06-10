import * as summaryModel from '../models/summaryModel.js';
import * as projectModel from '../models/projectModel.js';
import { pickDateQueryFilters } from '../utils/dateUtils.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const filters = {
      ...pickDateQueryFilters(req.query),
      worker: req.query.worker || '',
      projectId: req.query.projectId || '',
    };

    const [totals, byWorker, byProject, workers, projects, dailySalarySummary, advanceSummary] =
      await Promise.all([
        summaryModel.getSummary(filters),
        summaryModel.getSummaryByWorker({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          projectId: filters.projectId,
        }),
        summaryModel.getSummaryByProject({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          worker: filters.worker,
        }),
        summaryModel.getAllWorkers(),
        projectModel.findAllProjects(),
        summaryModel.getDailySalarySummary(filters),
        summaryModel.getAdvanceSummary(filters),
      ]);

    res.json({
      success: true,
      data: {
        totals,
        byWorker,
        byProject,
        workers,
        projects,
        dailySalarySummary,
        advanceSummary,
      },
    });
  } catch (err) {
    next(err);
  }
}
