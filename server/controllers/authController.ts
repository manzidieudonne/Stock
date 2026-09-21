import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { memoryStore } from '../db.ts';
import { UserModel } from '../models/User.ts';
import { JWT_SECRET } from '../middleware/auth.ts';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let user: any = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Also check MongoDB if running
      try {
        user = await UserModel.findOne({ email: cleanEmail });
      } catch (err) {
        // ignore
      }
    }

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error during login' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(400).json({ message: 'A user with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role === 'Admin' ? 'Admin' as const : 'User' as const,
      createdAt: new Date(),
    };

    memoryStore.users.push(newUser);

    // Also persist to MongoDB model if available
    try {
      await UserModel.create(newUser);
    } catch (e) {
      // fallback in memory
    }

    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error during registration' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = memoryStore.users.find(u => u._id === req.user?.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching user profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { name, currentPassword, newPassword } = req.body;
    const userIndex = memoryStore.users.findIndex(u => u._id === req.user?.id);

    if (userIndex === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const user = memoryStore.users[userIndex];

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ message: 'Current password is required to change password.' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Incorrect current password.' });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating profile' });
  }
};
