import * as userModel from '../models/userModel.js';
import { signToken } from '../middleware/auth.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await userModel.findByUsername(username.trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const valid = await userModel.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({
    success: true,
    data: { id: req.user.id, username: req.user.username, role: req.user.role },
  });
}
