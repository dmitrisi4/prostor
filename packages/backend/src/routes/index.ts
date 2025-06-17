import express from 'express';
import userRoutes from './user.routes';
import fileRoutes from './file.routes';
import searchRoutes from './search.routes';

const router = express.Router();

// API routes
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/search', searchRoutes);

export default router;