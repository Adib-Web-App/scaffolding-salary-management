import * as userModel from '../models/userModel.js';
import { ROLES } from '../config/permissions.js';

const VALID_ROLES = Object.values(ROLES);

export async function listUsers(_req, res, next) {
  try {
    const users = await userModel.listUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existing = await userModel.findByUsername(username.trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const user = await userModel.createUser({
      username: username.trim(),
      password,
      role,
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { username, password, role } = req.body;

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (Number(req.user.id) === id && role && role !== req.user.role) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    if (username) {
      const existing = await userModel.findByUsername(username.trim());
      if (existing && existing.id !== id) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }
    }

    const user = await userModel.updateUser(id, {
      username: username?.trim(),
      role,
      password: password || undefined,
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number(req.user.id) === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const count = await userModel.countUsers();
    if (count <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the last user' });
    }

    const deleted = await userModel.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}
