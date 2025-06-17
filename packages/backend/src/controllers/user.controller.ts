import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage.service';

export class UserController {
  private userService: UserService;
  private storageService: StorageService;

  constructor() {
    // These services would be implemented and injected
    this.userService = new UserService();
    this.storageService = new StorageService();
  }

  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password || !name) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Email, password and name are required' 
        });
      }

      // Check if user already exists
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          status: 'error', 
          message: 'User with this email already exists' 
        });
      }

      // Create user
      const user = await this.userService.create({
        email,
        password, // Will be hashed in the service
        name,
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to register user' 
      });
    }
  };

  /**
   * Login user
   */
  public login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Email and password are required' 
        });
      }

      // Find user
      const user = await this.userService.findByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Invalid credentials' 
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Invalid credentials' 
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to login' 
      });
    }
  };

  /**
   * Get user profile
   */
  public getProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const user = await this.userService.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'User not found' 
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get user profile' 
      });
    }
  };

  /**
   * Update user profile
   */
  public updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { name, currentPassword, newPassword } = req.body;

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ 
            status: 'error', 
            message: 'Current password is required to set a new password' 
          });
        }

        const user = await this.userService.findById(userId);
        if (!user) {
          return res.status(404).json({ 
            status: 'error', 
            message: 'User not found' 
          });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ 
            status: 'error', 
            message: 'Current password is incorrect' 
          });
        }
      }

      // Update user
      const updatedUser = await this.userService.update(userId, {
        name,
        password: newPassword, // Will be hashed in the service if provided
      });

      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update user profile' 
      });
    }
  };

  /**
   * Get user storage usage
   */
  public getStorageUsage = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const storageUsage = await this.storageService.getUserStorageUsage(userId);

      return res.status(200).json({
        status: 'success',
        data: storageUsage,
      });
    } catch (error) {
      console.error('Get storage usage error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get storage usage' 
      });
    }
  };
}