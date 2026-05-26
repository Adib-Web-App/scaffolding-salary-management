import * as projectModel from '../models/projectModel.js';

export async function listProjects(req, res, next) {
  try {
    const projects = await projectModel.findAllProjects(req.query.search || '');
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await projectModel.findProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const { project_name, erection_rate, dismantle_rate } = req.body;
    if (!project_name?.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }
    const project = await projectModel.createProject({
      project_name: project_name.trim(),
      erection_rate: Number(erection_rate) || 0,
      dismantle_rate: Number(dismantle_rate) || 0,
    });
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const existing = await projectModel.findProjectById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const { project_name, erection_rate, dismantle_rate } = req.body;
    const project = await projectModel.updateProject(req.params.id, {
      project_name: (project_name ?? existing.project_name).trim(),
      erection_rate: Number(erection_rate ?? existing.erection_rate),
      dismantle_rate: Number(dismantle_rate ?? existing.dismantle_rate),
    });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const deleted = await projectModel.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}
