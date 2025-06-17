import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

// Storage options
interface StorageOptions {
  userId: string;
  filename: string;
  contentType: string;
}

// Storage usage
interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
  usedPercentage: number;
}

// In-memory storage for demo purposes
// In a real application, this would use a database
const userStorageUsage: Record<string, number> = {};

export class StorageService {
  private s3Client: S3Client | null = null;
  private localStoragePath: string;

  constructor() {
    // Initialize storage based on configuration
    if (config.storageType === 's3' || config.storageType === 'r2') {
      this.s3Client = new S3Client({
        region: config.storageConfig.region || 'auto',
        endpoint: config.storageConfig.endpoint,
        credentials: {
          accessKeyId: config.storageConfig.accessKeyId || '',
          secretAccessKey: config.storageConfig.secretAccessKey || '',
        },
      });
    }

    // Set up local storage path
    this.localStoragePath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  /**
   * Upload file to storage
   */
  public async uploadFile(fileBuffer: Buffer, options: StorageOptions): Promise<string> {
    const { userId, filename, contentType } = options;
    const fileKey = `${userId}/${uuidv4()}-${filename}`;

    // Update user storage usage
    this.updateUserStorageUsage(userId, fileBuffer.length);

    // Upload to appropriate storage
    if (config.storageType === 's3' || config.storageType === 'r2') {
      return this.uploadToS3(fileBuffer, fileKey, contentType);
    } else {
      return this.uploadToLocalStorage(fileBuffer, fileKey);
    }
  }

  /**
   * Get file from storage
   */
  public async getFile(fileKey: string): Promise<Buffer> {
    // Get from appropriate storage
    if (config.storageType === 's3' || config.storageType === 'r2') {
      return this.getFromS3(fileKey);
    } else {
      return this.getFromLocalStorage(fileKey);
    }
  }

  /**
   * Delete file from storage
   */
  public async deleteFile(fileKey: string): Promise<void> {
    // Extract user ID and update storage usage
    const userId = fileKey.split('/')[0];
    const fileSize = await this.getFileSize(fileKey);
    this.updateUserStorageUsage(userId, -fileSize);

    // Delete from appropriate storage
    if (config.storageType === 's3' || config.storageType === 'r2') {
      await this.deleteFromS3(fileKey);
    } else {
      await this.deleteFromLocalStorage(fileKey);
    }
  }

  /**
   * Get user storage usage
   */
  public async getUserStorageUsage(userId: string): Promise<StorageUsage> {
    // Get user storage usage
    const usedBytes = userStorageUsage[userId] || 0;
    const totalBytes = 10 * 1024 * 1024 * 1024; // 10GB default quota

    return {
      usedBytes,
      totalBytes,
      usedPercentage: (usedBytes / totalBytes) * 100,
    };
  }

  /**
   * Update user storage usage
   */
  private updateUserStorageUsage(userId: string, sizeChange: number): void {
    if (!userStorageUsage[userId]) {
      userStorageUsage[userId] = 0;
    }

    userStorageUsage[userId] += sizeChange;

    // Ensure usage doesn't go below zero
    if (userStorageUsage[userId] < 0) {
      userStorageUsage[userId] = 0;
    }
  }

  /**
   * Get file size
   */
  private async getFileSize(fileKey: string): Promise<number> {
    if (config.storageType === 'local') {
      const filePath = path.join(this.localStoragePath, fileKey);
      try {
        const stats = await fs.promises.stat(filePath);
        return stats.size;
      } catch (error) {
        return 0;
      }
    } else {
      // For S3/R2, we would need to use HeadObject
      // For simplicity, we'll return 0 here
      return 0;
    }
  }

  /**
   * Upload file to S3/R2
   */
  private async uploadToS3(fileBuffer: Buffer, fileKey: string, contentType: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const params = {
      Bucket: config.storageConfig.bucket || '',
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
    };

    await this.s3Client.send(new PutObjectCommand(params));
    return fileKey;
  }

  /**
   * Get file from S3/R2
   */
  private async getFromS3(fileKey: string): Promise<Buffer> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const params = {
      Bucket: config.storageConfig.bucket || '',
      Key: fileKey,
    };

    const response = await this.s3Client.send(new GetObjectCommand(params));
    const chunks: Uint8Array[] = [];

    if (response.Body) {
      // @ts-ignore - TypeScript doesn't know about the stream method
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
    }

    return Buffer.concat(chunks);
  }

  /**
   * Delete file from S3/R2
   */
  private async deleteFromS3(fileKey: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const params = {
      Bucket: config.storageConfig.bucket || '',
      Key: fileKey,
    };

    await this.s3Client.send(new DeleteObjectCommand(params));
  }

  /**
   * Upload file to local storage
   */
  private async uploadToLocalStorage(fileBuffer: Buffer, fileKey: string): Promise<string> {
    const filePath = path.join(this.localStoragePath, fileKey);
    const dirPath = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file
    await fs.promises.writeFile(filePath, fileBuffer);
    return fileKey;
  }

  /**
   * Get file from local storage
   */
  private async getFromLocalStorage(fileKey: string): Promise<Buffer> {
    const filePath = path.join(this.localStoragePath, fileKey);
    return fs.promises.readFile(filePath);
  }

  /**
   * Delete file from local storage
   */
  private async deleteFromLocalStorage(fileKey: string): Promise<void> {
    const filePath = path.join(this.localStoragePath, fileKey);
    await fs.promises.unlink(filePath);
  }
}