import express from 'express';
import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = express.Router();
const fileController = new FileController();

// All file routes require authentication
router.use(authMiddleware);

// File operations
router.post('/upload', uploadMiddleware, fileController.uploadFile);
router.get('/', fileController.listFiles);
router.get('/folders', fileController.listFolders);
router.get('/:fileId', fileController.getFileDetails);
router.get('/:fileId/download', fileController.downloadFile);
router.put('/:fileId', fileController.updateFile);
router.delete('/:fileId', fileController.deleteFile);

// Folder operations
router.post('/folder', fileController.createFolder);
router.put('/folder/:folderId', fileController.updateFolder);
router.delete('/folder/:folderId', fileController.deleteFolder);

// Sharing
router.post('/:fileId/share', fileController.shareFile);
router.delete('/:fileId/share/:shareId', fileController.removeFileShare);

export default router;