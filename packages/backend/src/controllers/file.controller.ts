import { Request, Response } from 'express';
import { FileService } from '../services/file.service';
import { StorageService } from '../services/storage.service';

export class FileController {
  private fileService: FileService;
  private storageService: StorageService;

  constructor() {
    // These services would be implemented and injected
    this.fileService = new FileService();
    this.storageService = new StorageService();
  }

  /**
   * Upload a new file
   */
  public uploadFile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'No file uploaded' 
        });
      }

      const { originalname, mimetype, size, buffer } = req.file;
      const { folderId } = req.body;

      // Check user storage quota
      const storageUsage = await this.storageService.getUserStorageUsage(userId);
      if (storageUsage.usedBytes + size > storageUsage.totalBytes) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Storage quota exceeded' 
        });
      }

      // Upload file to storage
      const fileKey = await this.storageService.uploadFile(buffer, {
        userId,
        filename: originalname,
        contentType: mimetype,
      });

      // Save file metadata to database
      const file = await this.fileService.createFile({
        userId,
        name: originalname,
        size,
        mimeType: mimetype,
        key: fileKey,
        folderId: folderId || null,
      });

      return res.status(201).json({
        status: 'success',
        data: {
          file,
        },
      });
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to upload file' 
      });
    }
  };

  /**
   * List user files
   */
  public listFiles = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { folderId, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const files = await this.fileService.listFiles({
        userId,
        folderId: folderId ? String(folderId) : null,
        page: parseInt(String(page), 10),
        limit: parseInt(String(limit), 10),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder) as 'asc' | 'desc',
      });

      return res.status(200).json({
        status: 'success',
        data: files,
      });
    } catch (error) {
      console.error('List files error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to list files' 
      });
    }
  };

  /**
   * List user folders
   */
  public listFolders = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { parentId } = req.query;

      const folders = await this.fileService.listFolders({
        userId,
        parentId: parentId ? String(parentId) : null,
      });

      return res.status(200).json({
        status: 'success',
        data: {
          folders,
        },
      });
    } catch (error) {
      console.error('List folders error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to list folders' 
      });
    }
  };

  /**
   * Get file details
   */
  public getFileDetails = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { fileId } = req.params;

      const file = await this.fileService.getFileById(fileId, userId);
      if (!file) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'File not found' 
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          file,
        },
      });
    } catch (error) {
      console.error('Get file details error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get file details' 
      });
    }
  };

  /**
   * Download file
   */
  public downloadFile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { fileId } = req.params;

      // Get file metadata
      const file = await this.fileService.getFileById(fileId, userId);
      if (!file) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'File not found' 
        });
      }

      // Get file from storage
      const fileData = await this.storageService.getFile(file.key);

      // Set headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

      // Send file
      return res.send(fileData);
    } catch (error) {
      console.error('Download file error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to download file' 
      });
    }
  };

  /**
   * Update file metadata
   */
  public updateFile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { fileId } = req.params;
      const { name, folderId } = req.body;

      // Check if file exists and belongs to user
      const existingFile = await this.fileService.getFileById(fileId, userId);
      if (!existingFile) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'File not found' 
        });
      }

      // Update file
      const updatedFile = await this.fileService.updateFile(fileId, {
        name,
        folderId,
      });

      return res.status(200).json({
        status: 'success',
        data: {
          file: updatedFile,
        },
      });
    } catch (error) {
      console.error('Update file error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update file' 
      });
    }
  };

  /**
   * Delete file
   */
  public deleteFile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { fileId } = req.params;

      // Check if file exists and belongs to user
      const file = await this.fileService.getFileById(fileId, userId);
      if (!file) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'File not found' 
        });
      }

      // Delete file from storage
      await this.storageService.deleteFile(file.key);

      // Delete file metadata from database
      await this.fileService.deleteFile(fileId);

      return res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
      });
    } catch (error) {
      console.error('Delete file error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to delete file' 
      });
    }
  };

  /**
   * Create folder
   */
  public createFolder = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { name, parentId } = req.body;

      if (!name) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Folder name is required' 
        });
      }

      const folder = await this.fileService.createFolder({
        userId,
        name,
        parentId: parentId || null,
      });

      return res.status(201).json({
        status: 'success',
        data: {
          folder,
        },
      });
    } catch (error) {
      console.error('Create folder error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to create folder' 
      });
    }
  };

  /**
   * Update folder
   */
  public updateFolder = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { folderId } = req.params;
      const { name, parentId } = req.body;

      // Check if folder exists and belongs to user
      const existingFolder = await this.fileService.getFolderById(folderId, userId);
      if (!existingFolder) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Folder not found' 
        });
      }

      // Update folder
      const updatedFolder = await this.fileService.updateFolder(folderId, {
        name,
        parentId,
      });

      return res.status(200).json({
        status: 'success',
        data: {
          folder: updatedFolder,
        },
      });
    } catch (error) {
      console.error('Update folder error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update folder' 
      });
    }
  };

  /**
   * Delete folder
   */
  public deleteFolder = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { folderId } = req.params;

      // Check if folder exists and belongs to user
      const folder = await this.fileService.getFolderById(folderId, userId);
      if (!folder) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Folder not found' 
        });
      }

      // Delete folder and all its contents
      await this.fileService.deleteFolder(folderId, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Folder deleted successfully',
      });
    } catch (error) {
      console.error('Delete folder error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to delete folder' 
      });
    }
  };

  /**
   * Share file
   */
  public shareFile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { fileId } = req.params;
      const { expiresAt, isPublic, allowedEmails } = req.body;

      // Check if file exists and belongs to user
      const file = await this.fileService.getFileById(fileId, userId);
      if (!file) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'File not found' 
        });
      }

      // Create share link
      const shareLink = await this.fileService.createShareLink({
        fileId,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isPublic: isPublic || false,
        allowedEmails: allowedEmails || [],
      });

      return res.status(201).json({
        status: 'success',
        data: {
          shareLink,
        },
      });
    } catch (error) {
      console.error('Share file error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to share file' 
      });
    }
  };

  /**
   * Remove file share
   */
  public removeFileShare = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { fileId, shareId } = req.params;

      // Check if file exists and belongs to user
      const file = await this.fileService.getFileById(fileId, userId);
      if (!file) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'File not found' 
        });
      }

      // Delete share link
      await this.fileService.deleteShareLink(shareId, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Share link removed successfully',
      });
    } catch (error) {
      console.error('Remove file share error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to remove share link' 
      });
    }
  };
}