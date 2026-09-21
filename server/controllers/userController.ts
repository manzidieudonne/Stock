import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { memoryStore } from '../db.ts';
import { UserModel } from '../models/User.ts';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const safeUsers = memoryStore.users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));
    res.json(safeUsers);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching users' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'User' } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and temporary password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    if (memoryStore.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: (role === 'Admin' ? 'Admin' : 'User') as 'Admin' | 'User',
      createdAt: new Date(),
    };

    memoryStore.users.push(newUser);

    try {
      await UserModel.create(newUser);
    } catch (e) {
      // fallback
    }

    res.status(201).json({
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      message: 'New user account created successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating user' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'Admin' && role !== 'User')) {
      res.status(400).json({ message: 'Role must be either "Admin" or "User".' });
      return;
    }

    const user = memoryStore.users.find(u => u._id === id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Safety: prevent demoting the only remaining Admin
    if (user.role === 'Admin' && role === 'User') {
      const adminCount = memoryStore.users.filter(u => u.role === 'Admin').length;
      if (adminCount <= 1) {
        res.status(400).json({ message: 'Cannot demote the last remaining Administrator.' });
        return;
      }
    }

    user.role = role;

    try {
      await UserModel.findByIdAndUpdate(id, { role });
    } catch (e) {
      // fallback
    }

    res.json({
      message: `User role updated to ${role}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating user role' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user && req.user.id === id) {
      res.status(400).json({ message: 'You cannot delete your own active account.' });
      return;
    }

    const index = memoryStore.users.findIndex(u => u._id === id);
    if (index === -1) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const user = memoryStore.users[index];
    if (user.role === 'Admin') {
      const adminCount = memoryStore.users.filter(u => u.role === 'Admin').length;
      if (adminCount <= 1) {
        res.status(400).json({ message: 'Cannot delete the only remaining Administrator.' });
        return;
      }
    }

    memoryStore.users.splice(index, 1);

    try {
      await UserModel.findByIdAndDelete(id);
    } catch (e) {
      // fallback
    }

    res.json({ message: `User "${user.name}" has been removed.` });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting user' });
  }
};
