import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept all file types for now
  // In a production environment, you might want to restrict file types
  cb(null, true);
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

// Middleware to handle file upload
export const uploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: 'error',
          message: 'File too large. Maximum size is 100MB',
        });
      }
      return res.status(400).json({
        status: 'error',
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({
        status: 'error',
        message: `Server error: ${err.message}`,
      });
    }

    // Everything went fine
    next();
  });
};