import { createMocks } from 'node-mocks-http';
import handler from '../search-ideas';
import { QdrantHandler } from '@/lib/qdrantHandler';

// Mock the QdrantHandler module
jest.mock('@/lib/qdrantHandler', () => ({
  QdrantHandler: jest.fn().mockImplementation(() => ({
    createEmbedding: jest.fn(),
    searchSimilarProjects: jest.fn(),
  })),
}));

const MockedQdrantHandler = QdrantHandler as jest.MockedClass<typeof QdrantHandler>;

describe('/api/search-ideas', () => {
  let mockCreateEmbedding: jest.MockedFunction<any>;
  let mockSearchSimilarProjects: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEmbedding = jest.fn();
    mockSearchSimilarProjects = jest.fn();
    
    MockedQdrantHandler.mockImplementation(() => ({
      createEmbedding: mockCreateEmbedding,
      searchSimilarProjects: mockSearchSimilarProjects,
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 405 for non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  it('should return 400 when idea is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Idea is required',
    });
  });

  it('should successfully search for similar projects', async () => {
    const idea = 'NFT marketplace for digital art';
    const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
    const mockSimilarProjects = [
      { id: 1, title: 'OpenSea', description: 'NFT marketplace', score: 0.9 },
      { id: 2, title: 'SuperRare', description: 'Digital art platform', score: 0.8 },
    ];

    mockCreateEmbedding.mockResolvedValue(mockEmbedding);
    mockSearchSimilarProjects.mockResolvedValue(mockSimilarProjects);

    const { req, res } = createMocks({
      method: 'POST',
      body: { idea },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Search completed successfully',
      projects: mockSimilarProjects,
    });

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).toHaveBeenCalledWith(mockEmbedding);
  });

  it('should handle authentication errors (403)', async () => {
    const idea = 'My blockchain idea';
    const authError = new Error('403: authentication failed');
    mockCreateEmbedding.mockRejectedValue(authError);

    const { req, res } = createMocks({
      method: 'POST',
      body: { idea },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    const responseData = JSON.parse(res._getData());
    expect(responseData.message).toBe('Authentication failed');
    expect(responseData.error).toBe('403: authentication failed');
    expect(responseData.suggestion).toContain('NOMIC_API_KEY');
  });

  it('should handle generic authentication errors', async () => {
    const idea = 'My DeFi idea';
    const authError = new Error('Authentication failed - invalid key');
    mockCreateEmbedding.mockRejectedValue(authError);

    const { req, res } = createMocks({
      method: 'POST',
      body: { idea },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    const responseData = JSON.parse(res._getData());
    expect(responseData.message).toBe('Authentication failed');
    expect(responseData.error).toBe('Authentication failed - invalid key');
  });

  it('should handle general errors and return 500', async () => {
    const idea = 'My Web3 idea';
    const genericError = new Error('Network timeout');
    mockCreateEmbedding.mockRejectedValue(genericError);

    const { req, res } = createMocks({
      method: 'POST',
      body: { idea },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Search failed',
      error: 'Network timeout',
    });
  });

  it('should handle unknown errors', async () => {
    const idea = 'My idea';
    mockCreateEmbedding.mockRejectedValue('Unknown error');

    const { req, res } = createMocks({
      method: 'POST',
      body: { idea },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Search failed',
      error: 'An unknown error occurred',
    });
  });

  it('should handle errors during embedding search', async () => {
    const idea = 'My GameFi idea';
    const mockEmbedding = [0.1, 0.2, 0.3];
    const searchError = new Error('Vector search failed');
    
    mockCreateEmbedding.mockResolvedValue(mockEmbedding);
    mockSearchSimilarProjects.mockRejectedValue(searchError);

    const { req, res } = createMocks({
      method: 'POST',
      body: { idea },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Search failed',
      error: 'Vector search failed',
    });

    expect(mockCreateEmbedding).toHaveBeenCalledWith(idea);
    expect(mockSearchSimilarProjects).toHaveBeenCalledWith(mockEmbedding);
  });

  it('should handle empty idea string', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { idea: '' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Idea is required',
    });
  });

  it('should work with complex idea descriptions', async () => {
    const complexIdea = 'A decentralized autonomous organization (DAO) that manages cross-chain liquidity pools using automated market makers (AMMs) with dynamic fee structures based on volatility and liquidity depth metrics.';
    const mockEmbedding = Array.from({ length: 384 }, (_, i) => Math.random());
    const mockResults = [
      { id: 1, title: 'Balancer', description: 'Multi-token AMM', score: 0.85 },
      { id: 2, title: 'Curve', description: 'Stable coin AMM', score: 0.82 },
      { id: 3, title: 'Aragon', description: 'DAO infrastructure', score: 0.79 },
    ];

    mockCreateEmbedding.mockResolvedValue(mockEmbedding);
    mockSearchSimilarProjects.mockResolvedValue(mockResults);

    const { req, res } = createMocks({
      method: 'POST',
      body: { idea: complexIdea },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Search completed successfully',
      projects: mockResults,
    });
  });
});