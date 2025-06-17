import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// This would be replaced with actual database models
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for demo purposes
// In a real application, this would use a database
const users: User[] = [];

export class UserService {
  /**
   * Find user by email
   */
  public async findByEmail(email: string): Promise<User | null> {
    const user = users.find(u => u.email === email);
    return user || null;
  }

  /**
   * Find user by ID
   */
  public async findById(id: string): Promise<User | null> {
    const user = users.find(u => u.id === id);
    return user || null;
  }

  /**
   * Create a new user
   */
  public async create(userData: { email: string; password: string; name: string }): Promise<User> {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const newUser: User = {
      id: uuidv4(),
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save user
    users.push(newUser);

    return newUser;
  }

  /**
   * Update user
   */
  public async update(
    userId: string,
    userData: { name?: string; password?: string }
  ): Promise<User> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const user = users[userIndex];
    const updatedUser = { ...user };

    // Update fields
    if (userData.name) {
      updatedUser.name = userData.name;
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      updatedUser.password = await bcrypt.hash(userData.password, salt);
    }

    updatedUser.updatedAt = new Date();

    // Save updated user
    users[userIndex] = updatedUser;

    return updatedUser;
  }

  /**
   * Delete user
   */
  public async delete(userId: string): Promise<void> {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Remove user
    users.splice(userIndex, 1);
  }
}