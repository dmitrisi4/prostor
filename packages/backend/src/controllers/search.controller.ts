import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    // This service would be implemented and injected
    this.searchService = new SearchService();
  }

  /**
   * Search files
   */
  public search = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { query, page = '1', limit = '20', type, dateFrom, dateTo } = req.query;

      if (!query) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Search query is required' 
        });
      }

      const searchResults = await this.searchService.search({
        userId,
        query: String(query),
        page: parseInt(String(page), 10),
        limit: parseInt(String(limit), 10),
        filters: {
          type: type ? String(type) : undefined,
          dateFrom: dateFrom ? new Date(String(dateFrom)) : undefined,
          dateTo: dateTo ? new Date(String(dateTo)) : undefined,
        },
      });

      return res.status(200).json({
        status: 'success',
        data: searchResults,
      });
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to search files' 
      });
    }
  };

  /**
   * Get search suggestions
   */
  public getSuggestions = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          status: 'error', 
          message: 'Unauthorized' 
        });
      }

      const { query, limit = '5' } = req.query;

      if (!query) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Search query is required' 
        });
      }

      const suggestions = await this.searchService.getSuggestions({
        userId,
        query: String(query),
        limit: parseInt(String(limit), 10),
      });

      return res.status(200).json({
        status: 'success',
        data: {
          suggestions,
        },
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get search suggestions' 
      });
    }
  };
}