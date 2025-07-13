import { createMocks } from 'node-mocks-http';
import handler from '../crawl';
import { crawlEthGlobalShowcase } from '@/lib/crawler';

// Mock the crawler module
jest.mock('@/lib/crawler', () => ({
  crawlEthGlobalShowcase: jest.fn(),
}));

const mockCrawlEthGlobalShowcase = crawlEthGlobalShowcase as jest.MockedFunction<typeof crawlEthGlobalShowcase>;

describe('/api/crawl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variable
    delete process.env.NEXT_PUBLIC_ENVIRONMENT;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 403 when environment is production', async () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
    
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'This API is disabled in the production environment.',
    });
  });

  it('should successfully crawl and return projects when environment is not production', async () => {
    const mockProjects = [
      { id: 1, title: 'Test Project 1', description: 'Test description 1' },
      { id: 2, title: 'Test Project 2', description: 'Test description 2' },
    ];

    mockCrawlEthGlobalShowcase.mockResolvedValue(mockProjects);

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Crawling completed successfully',
      projects: mockProjects,
    });
    expect(mockCrawlEthGlobalShowcase).toHaveBeenCalledTimes(1);
  });

  it('should handle crawler errors and return 500', async () => {
    const errorMessage = 'Crawling failed due to network error';
    mockCrawlEthGlobalShowcase.mockRejectedValue(new Error(errorMessage));

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Crawling failed',
      details: errorMessage,
    });
  });

  it('should handle unknown errors', async () => {
    mockCrawlEthGlobalShowcase.mockRejectedValue('Unknown error');

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Crawling failed',
      details: 'An unknown error occurred',
    });
  });
});