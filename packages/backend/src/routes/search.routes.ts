import express from 'express';
import { SearchController } from '../controllers/search.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();
const searchController = new SearchController();

// All search routes require authentication
router.use(authMiddleware);

// Search operations
router.get('/', searchController.search);
router.get('/suggestions', searchController.getSuggestions);

export default router;