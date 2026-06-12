import * as summaryModel from '../models/summaryModel.js';
import * as projectModel from '../models/projectModel.js';
import { pickDateQueryFilters } from '../utils/dateUtils.js';
import { parseWorkersQuery } from '../utils/queryUtils.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const workers = parseWorkersQuery(req.query);
    const filters = {
      ...pickDateQueryFilters(req.query),
      workers,
      projectId: req.query.projectId || '',
    };

    const [totals, byWorker, byProject, allWorkers, projects, dailySalarySummary, advanceSummary] =
      await Promise.all([
        summaryModel.getSummary(filters),
        summaryModel.getSummaryByWorker(filters),
        summaryModel.getSummaryByProject(filters),
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
        workers: allWorkers,
        projects,
        dailySalarySummary,
        advanceSummary,
      },
    });
  } catch (err) {
    next(err);
  }
}
