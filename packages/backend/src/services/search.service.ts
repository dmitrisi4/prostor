import { MeiliSearch } from 'meilisearch';
import { Client as TypesenseClient } from 'typesense';
import { config } from '../config';

// Search options
interface SearchOptions {
  userId: string;
  query: string;
  page: number;
  limit: number;
  filters?: {
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

// Suggestion options
interface SuggestionOptions {
  userId: string;
  query: string;
  limit: number;
}

// Search result
interface SearchResult {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  path: string;
  isFolder: boolean;
}

export class SearchService {
  private meilisearchClient: MeiliSearch | null = null;
  private typesenseClient: TypesenseClient | null = null;

  constructor() {
    // Initialize search client based on configuration
    if (config.searchConfig.type === 'meilisearch') {
      this.meilisearchClient = new MeiliSearch({
        host: config.searchConfig.host,
        apiKey: config.searchConfig.apiKey,
      });
    } else if (config.searchConfig.type === 'typesense') {
      this.typesenseClient = new TypesenseClient({
        nodes: [{ host: config.searchConfig.host, port: 8108, protocol: 'http' }],
        apiKey: config.searchConfig.apiKey,
      });
    }
  }

  /**
   * Search files and folders
   */
  public async search(options: SearchOptions): Promise<{
    hits: SearchResult[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { userId, query, page, limit, filters } = options;

    // Build filter string
    let filterStr = `userId = ${userId}`;

    if (filters?.type) {
      filterStr += ` AND type = ${filters.type}`;
    }

    if (filters?.dateFrom) {
      filterStr += ` AND createdAt >= ${filters.dateFrom.toISOString()}`;
    }

    if (filters?.dateTo) {
      filterStr += ` AND createdAt <= ${filters.dateTo.toISOString()}`;
    }

    // Search using appropriate client
    if (config.searchConfig.type === 'meilisearch' && this.meilisearchClient) {
      return this.searchWithMeilisearch(query, filterStr, page, limit);
    } else if (config.searchConfig.type === 'typesense' && this.typesenseClient) {
      return this.searchWithTypesense(query, filterStr, page, limit);
    } else {
      // Fallback to empty results
      return {
        hits: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  /**
   * Get search suggestions
   */
  public async getSuggestions(options: SuggestionOptions): Promise<string[]> {
    const { userId, query, limit } = options;

    // Get suggestions using appropriate client
    if (config.searchConfig.type === 'meilisearch' && this.meilisearchClient) {
      return this.getSuggestionsWithMeilisearch(query, userId, limit);
    } else if (config.searchConfig.type === 'typesense' && this.typesenseClient) {
      return this.getSuggestionsWithTypesense(query, userId, limit);
    } else {
      // Fallback to empty results
      return [];
    }
  }

  /**
   * Search with Meilisearch
   */
  private async searchWithMeilisearch(
    query: string,
    filter: string,
    page: number,
    limit: number
  ): Promise<{ hits: SearchResult[]; total: number; page: number; limit: number }> {
    if (!this.meilisearchClient) {
      throw new Error('Meilisearch client not initialized');
    }

    try {
      const offset = (page - 1) * limit;

      const searchResults = await this.meilisearchClient.index('files').search(query, {
        filter,
        offset,
        limit,
      });

      return {
        hits: searchResults.hits as SearchResult[],
        total: searchResults.estimatedTotalHits || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Meilisearch search error:', error);
      return {
        hits: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  /**
   * Search with Typesense
   */
  private async searchWithTypesense(
    query: string,
    filter: string,
    page: number,
    limit: number
  ): Promise<{ hits: SearchResult[]; total: number; page: number; limit: number }> {
    if (!this.typesenseClient) {
      throw new Error('Typesense client not initialized');
    }

    try {
      const offset = (page - 1) * limit;

      const searchResults = await this.typesenseClient
        .collections('files')
        .documents()
        .search({
          q: query,
          filter_by: filter,
          page,
          per_page: limit,
        });

      return {
        hits: searchResults.hits.map(hit => hit.document) as SearchResult[],
        total: searchResults.found,
        page,
        limit,
      };
    } catch (error) {
      console.error('Typesense search error:', error);
      return {
        hits: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  /**
   * Get suggestions with Meilisearch
   */
  private async getSuggestionsWithMeilisearch(
    query: string,
    userId: string,
    limit: number
  ): Promise<string[]> {
    if (!this.meilisearchClient) {
      throw new Error('Meilisearch client not initialized');
    }

    try {
      // For Meilisearch, we can use the search endpoint with a small limit
      // and extract the names as suggestions
      const searchResults = await this.meilisearchClient.index('files').search(query, {
        filter: `userId = ${userId}`,
        limit,
        attributesToRetrieve: ['name'],
      });

      return searchResults.hits.map((hit: any) => hit.name);
    } catch (error) {
      console.error('Meilisearch suggestions error:', error);
      return [];
    }
  }

  /**
   * Get suggestions with Typesense
   */
  private async getSuggestionsWithTypesense(
    query: string,
    userId: string,
    limit: number
  ): Promise<string[]> {
    if (!this.typesenseClient) {
      throw new Error('Typesense client not initialized');
    }

    try {
      const searchResults = await this.typesenseClient
        .collections('files')
        .documents()
        .search({
          q: query,
          filter_by: `userId:=${userId}`,
          per_page: limit,
        });

      return searchResults.hits.map(hit => hit.document.name);
    } catch (error) {
      console.error('Typesense suggestions error:', error);
      return [];
    }
  }

  /**
   * Index a file or folder for search
   */
  public async indexItem(item: {
    id: string;
    userId: string;
    name: string;
    type?: string;
    size?: number;
    createdAt: Date;
    updatedAt: Date;
    path?: string;
    isFolder: boolean;
  }): Promise<void> {
    // Index using appropriate client
    if (config.searchConfig.type === 'meilisearch' && this.meilisearchClient) {
      await this.indexWithMeilisearch(item);
    } else if (config.searchConfig.type === 'typesense' && this.typesenseClient) {
      await this.indexWithTypesense(item);
    }
  }

  /**
   * Remove an item from the search index
   */
  public async removeFromIndex(itemId: string): Promise<void> {
    // Remove using appropriate client
    if (config.searchConfig.type === 'meilisearch' && this.meilisearchClient) {
      await this.removeFromMeilisearch(itemId);
    } else if (config.searchConfig.type === 'typesense' && this.typesenseClient) {
      await this.removeFromTypesense(itemId);
    }
  }

  /**
   * Index with Meilisearch
   */
  private async indexWithMeilisearch(item: any): Promise<void> {
    if (!this.meilisearchClient) {
      throw new Error('Meilisearch client not initialized');
    }

    try {
      await this.meilisearchClient.index('files').addDocuments([item]);
    } catch (error) {
      console.error('Meilisearch indexing error:', error);
    }
  }

  /**
   * Index with Typesense
   */
  private async indexWithTypesense(item: any): Promise<void> {
    if (!this.typesenseClient) {
      throw new Error('Typesense client not initialized');
    }

    try {
      await this.typesenseClient.collections('files').documents().upsert(item);
    } catch (error) {
      console.error('Typesense indexing error:', error);
    }
  }

  /**
   * Remove from Meilisearch
   */
  private async removeFromMeilisearch(itemId: string): Promise<void> {
    if (!this.meilisearchClient) {
      throw new Error('Meilisearch client not initialized');
    }

    try {
      await this.meilisearchClient.index('files').deleteDocument(itemId);
    } catch (error) {
      console.error('Meilisearch delete error:', error);
    }
  }

  /**
   * Remove from Typesense
   */
  private async removeFromTypesense(itemId: string): Promise<void> {
    if (!this.typesenseClient) {
      throw new Error('Typesense client not initialized');
    }

    try {
      await this.typesenseClient.collections('files').documents(itemId).delete();
    } catch (error) {
      console.error('Typesense delete error:', error);
    }
  }
}