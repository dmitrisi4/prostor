import { v4 as uuidv4 } from 'uuid';

// These would be replaced with actual database models
interface File {
  id: string;
  userId: string;
  name: string;
  size: number;
  mimeType: string;
  key: string;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ShareLink {
  id: string;
  fileId: string;
  userId: string;
  token: string;
  expiresAt: Date | null;
  isPublic: boolean;
  allowedEmails: string[];
  createdAt: Date;
}

// In-memory storage for demo purposes
// In a real application, this would use a database
const files: File[] = [];
const folders: Folder[] = [];
const shareLinks: ShareLink[] = [];

export class FileService {
  /**
   * Create a new file
   */
  public async createFile(fileData: {
    userId: string;
    name: string;
    size: number;
    mimeType: string;
    key: string;
    folderId: string | null;
  }): Promise<File> {
    const newFile: File = {
      id: uuidv4(),
      userId: fileData.userId,
      name: fileData.name,
      size: fileData.size,
      mimeType: fileData.mimeType,
      key: fileData.key,
      folderId: fileData.folderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save file
    files.push(newFile);

    return newFile;
  }

  /**
   * Get file by ID
   */
  public async getFileById(fileId: string, userId: string): Promise<File | null> {
    const file = files.find(f => f.id === fileId && f.userId === userId);
    return file || null;
  }

  /**
   * List files
   */
  public async listFiles(options: {
    userId: string;
    folderId: string | null;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ files: File[]; total: number; page: number; limit: number }> {
    const { userId, folderId, page, limit, sortBy, sortOrder } = options;

    // Filter files by user and folder
    let filteredFiles = files.filter(f => f.userId === userId);
    if (folderId !== null) {
      filteredFiles = filteredFiles.filter(f => f.folderId === folderId);
    } else {
      filteredFiles = filteredFiles.filter(f => f.folderId === null);
    }

    // Sort files
    filteredFiles.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginate files
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    return {
      files: paginatedFiles,
      total: filteredFiles.length,
      page,
      limit,
    };
  }

  /**
   * Update file
   */
  public async updateFile(
    fileId: string,
    fileData: { name?: string; folderId?: string | null }
  ): Promise<File> {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      throw new Error('File not found');
    }

    const file = files[fileIndex];
    const updatedFile = { ...file };

    // Update fields
    if (fileData.name) {
      updatedFile.name = fileData.name;
    }

    if (fileData.folderId !== undefined) {
      updatedFile.folderId = fileData.folderId;
    }

    updatedFile.updatedAt = new Date();

    // Save updated file
    files[fileIndex] = updatedFile;

    return updatedFile;
  }

  /**
   * Delete file
   */
  public async deleteFile(fileId: string): Promise<void> {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      throw new Error('File not found');
    }

    // Remove file
    files.splice(fileIndex, 1);

    // Remove associated share links
    const shareLinkIndices = shareLinks
      .map((link, index) => (link.fileId === fileId ? index : -1))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort in descending order to remove from end first

    for (const index of shareLinkIndices) {
      shareLinks.splice(index, 1);
    }
  }

  /**
   * Create a new folder
   */
  public async createFolder(folderData: {
    userId: string;
    name: string;
    parentId: string | null;
  }): Promise<Folder> {
    const newFolder: Folder = {
      id: uuidv4(),
      userId: folderData.userId,
      name: folderData.name,
      parentId: folderData.parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save folder
    folders.push(newFolder);

    return newFolder;
  }

  /**
   * Get folder by ID
   */
  public async getFolderById(folderId: string, userId: string): Promise<Folder | null> {
    const folder = folders.find(f => f.id === folderId && f.userId === userId);
    return folder || null;
  }

  /**
   * List folders
   */
  public async listFolders(options: {
    userId: string;
    parentId: string | null;
  }): Promise<Folder[]> {
    const { userId, parentId } = options;

    // Filter folders by user and parent
    let filteredFolders = folders.filter(f => f.userId === userId);
    if (parentId !== null) {
      filteredFolders = filteredFolders.filter(f => f.parentId === parentId);
    } else {
      filteredFolders = filteredFolders.filter(f => f.parentId === null);
    }

    return filteredFolders;
  }

  /**
   * Update folder
   */
  public async updateFolder(
    folderId: string,
    folderData: { name?: string; parentId?: string | null }
  ): Promise<Folder> {
    const folderIndex = folders.findIndex(f => f.id === folderId);
    if (folderIndex === -1) {
      throw new Error('Folder not found');
    }

    const folder = folders[folderIndex];
    const updatedFolder = { ...folder };

    // Update fields
    if (folderData.name) {
      updatedFolder.name = folderData.name;
    }

    if (folderData.parentId !== undefined) {
      updatedFolder.parentId = folderData.parentId;
    }

    updatedFolder.updatedAt = new Date();

    // Save updated folder
    folders[folderIndex] = updatedFolder;

    return updatedFolder;
  }

  /**
   * Delete folder and all its contents
   */
  public async deleteFolder(folderId: string, userId: string): Promise<void> {
    // Check if folder exists
    const folderIndex = folders.findIndex(f => f.id === folderId && f.userId === userId);
    if (folderIndex === -1) {
      throw new Error('Folder not found');
    }

    // Get all subfolders recursively
    const allFolderIds = this.getAllSubfolderIds(folderId);
    allFolderIds.push(folderId);

    // Delete all files in these folders
    const fileIndices = files
      .map((file, index) => (allFolderIds.includes(file.folderId || '') ? index : -1))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort in descending order to remove from end first

    for (const index of fileIndices) {
      files.splice(index, 1);
    }

    // Delete all folders
    const folderIndices = folders
      .map((folder, index) => (allFolderIds.includes(folder.id) ? index : -1))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort in descending order to remove from end first

    for (const index of folderIndices) {
      folders.splice(index, 1);
    }
  }

  /**
   * Get all subfolder IDs recursively
   */
  private getAllSubfolderIds(folderId: string): string[] {
    const subfolderIds: string[] = [];
    const directSubfolders = folders.filter(f => f.parentId === folderId);

    for (const subfolder of directSubfolders) {
      subfolderIds.push(subfolder.id);
      const childIds = this.getAllSubfolderIds(subfolder.id);
      subfolderIds.push(...childIds);
    }

    return subfolderIds;
  }

  /**
   * Create a share link for a file
   */
  public async createShareLink(shareData: {
    fileId: string;
    userId: string;
    expiresAt?: Date;
    isPublic: boolean;
    allowedEmails: string[];
  }): Promise<ShareLink> {
    const newShareLink: ShareLink = {
      id: uuidv4(),
      fileId: shareData.fileId,
      userId: shareData.userId,
      token: uuidv4(),
      expiresAt: shareData.expiresAt || null,
      isPublic: shareData.isPublic,
      allowedEmails: shareData.allowedEmails,
      createdAt: new Date(),
    };

    // Save share link
    shareLinks.push(newShareLink);

    return newShareLink;
  }

  /**
   * Get share link by token
   */
  public async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    const shareLink = shareLinks.find(s => s.token === token);
    if (!shareLink) {
      return null;
    }

    // Check if expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return null;
    }

    return shareLink;
  }

  /**
   * Delete share link
   */
  public async deleteShareLink(shareLinkId: string, userId: string): Promise<void> {
    const shareLinkIndex = shareLinks.findIndex(
      s => s.id === shareLinkId && s.userId === userId
    );
    if (shareLinkIndex === -1) {
      throw new Error('Share link not found');
    }

    // Remove share link
    shareLinks.splice(shareLinkIndex, 1);
  }
}