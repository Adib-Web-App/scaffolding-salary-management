import * as workJobModel from '../models/workJobModel.js';
import * as projectModel from '../models/projectModel.js';
import * as salaryService from '../services/salaryService.js';

async function buildJobPayload(body) {
  const { entry_date, project_id, work_type, workers } = body;

  if (!entry_date || !project_id || !work_type) {
    const err = new Error('Date, project, and work type are required');
    err.status = 400;
    throw err;
  }

  if (!['Erection', 'Dismantle'].includes(work_type)) {
    const err = new Error('Work type must be Erection or Dismantle');
    err.status = 400;
    throw err;
  }

  const workerList = Array.isArray(workers) ? workers : body.worker_name ? [body.worker_name] : [];
  if (workerList.length === 0) {
    const err = new Error('At least one worker is required');
    err.status = 400;
    throw err;
  }

  const project = await projectModel.findProjectById(project_id);
  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }

  const dimensionsInput =
    Array.isArray(body.dimensions) && body.dimensions.length > 0
      ? body.dimensions
      : [
          {
            length: body.length,
            width: body.width,
            height: body.height,
          },
        ];

  const calc = salaryService.buildJobCalculations(project, work_type, dimensionsInput, workerList);
  const firstDimension = calc.dimensions[0] || { length: 0, width: 0, height: 0 };

  return {
    entry_date,
    project_id: Number(project_id),
    location: body.location?.trim() || '',
    work_type,
    length: firstDimension.length,
    width: firstDimension.width,
    height: firstDimension.height,
    volume: calc.volume,
    rate: calc.rate,
    total_salary: calc.total_salary,
    remarks: body.remarks?.trim() || '',
    dimensions: calc.dimensions,
    workers: calc.workers,
  };
}

export async function listWorkEntries(req, res, next) {
  try {
    const jobs = await workJobModel.findAllWorkJobs({
      search: req.query.search || '',
      dateFrom: req.query.dateFrom || '',
      dateTo: req.query.dateTo || '',
      worker: req.query.worker || '',
      projectId: req.query.projectId || '',
    });
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
}

export async function getWorkEntry(req, res, next) {
  try {
    const job = await workJobModel.findWorkJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Work job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

export async function createWorkEntry(req, res, next) {
  try {
    const payload = await buildJobPayload(req.body);
    const { workers, dimensions, ...jobData } = payload;
    const job = await workJobModel.createWorkJob(jobData, workers, dimensions);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

export async function updateWorkEntry(req, res, next) {
  try {
    const existing = await workJobModel.findWorkJobById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Work job not found' });
    }
    const merged = {
      ...existing,
      ...req.body,
      workers: req.body.workers ?? existing.workers?.map((w) => w.worker_name),
      dimensions:
        req.body.dimensions ??
        existing.dimensions ??
        [
          {
            length: existing.length,
            width: existing.width,
            height: existing.height,
          },
        ],
    };
    const payload = await buildJobPayload(merged);
    const { workers, dimensions, ...jobData } = payload;
    const job = await workJobModel.updateWorkJob(req.params.id, jobData, workers, dimensions);
    res.json({ success: true, data: job });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

export async function deleteWorkEntry(req, res, next) {
  try {
    const deleted = await workJobModel.deleteWorkJob(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Work job not found' });
    }
    res.json({ success: true, message: 'Work job deleted' });
  } catch (err) {
    next(err);
  }
}

export async function previewCalculation(req, res, next) {
  try {
    const { project_id, work_type, workers, dimensions, length, width, height } = req.body;
    const project = await projectModel.findProjectById(project_id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const workerList = Array.isArray(workers) ? workers : ['Worker'];
    const dimensionsInput =
      Array.isArray(dimensions) && dimensions.length > 0
        ? dimensions
        : [{ length, width, height }];
    const calc = salaryService.buildJobCalculations(project, work_type, dimensionsInput, workerList);
    res.json({
      success: true,
      data: {
        volume: calc.volume,
        total_volume: calc.volume,
        rate: calc.rate,
        total_salary: calc.total_salary,
        individual_salary: calc.workers[0]?.individual_salary || 0,
        volume_share: calc.workers[0]?.volume_share || 0,
        worker_count: calc.workers.length,
      },
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

export async function listWorkers(req, res, next) {
  try {
    const workers = await workJobModel.getDistinctWorkers();
    res.json({ success: true, data: workers });
  } catch (err) {
    next(err);
  }
}
