import { createMocks } from 'node-mocks-http';
import handler from '../improve-idea';
import { parseHtmlWithLLM } from '@/lib/llmParser';

// Mock the LLM parser module
jest.mock('@/lib/llmParser', () => ({
  parseHtmlWithLLM: jest.fn(),
}));

const mockParseHtmlWithLLM = parseHtmlWithLLM as jest.MockedFunction<typeof parseHtmlWithLLM>;

describe('/api/improve-idea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 when idea is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        similarProjects: [{ title: 'Test Project', description: 'Test description' }],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing idea or similar projects data',
    });
  });

  it('should return 400 when similarProjects is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        idea: 'My brilliant idea',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing idea or similar projects data',
    });
  });

  it('should successfully process idea improvement request', async () => {
    const mockResponse = 'Improved idea with detailed feedback';
    const idea = 'My blockchain project idea';
    const similarProjects = [
      { title: 'Project A', description: 'Similar blockchain project' },
      { title: 'Project B', description: 'Another similar project' },
    ];

    mockParseHtmlWithLLM.mockResolvedValue(mockResponse);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        idea,
        similarProjects,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      improvedIdea: mockResponse,
    });

    // Verify the LLM parser was called with correct parameters
    expect(mockParseHtmlWithLLM).toHaveBeenCalledTimes(1);
    expect(mockParseHtmlWithLLM).toHaveBeenCalledWith(
      idea,
      expect.stringContaining('あなたは、ハッカソンで何度も勝利を収めた伝説のスーパーエンジニア')
    );
  });

  it('should handle LLM parser errors and return 500', async () => {
    const errorMessage = 'LLM service is unavailable';
    mockParseHtmlWithLLM.mockRejectedValue(new Error(errorMessage));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        idea: 'My idea',
        similarProjects: [{ title: 'Test', description: 'Test' }],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to generate improved idea',
      details: errorMessage,
    });
  });

  it('should handle unknown errors', async () => {
    mockParseHtmlWithLLM.mockRejectedValue('Unknown error');

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        idea: 'My idea',
        similarProjects: [{ title: 'Test', description: 'Test' }],
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to generate improved idea',
      details: 'An unknown error occurred',
    });
  });

  it('should work with multiple similar projects', async () => {
    const mockResponse = 'Comprehensive improvement feedback';
    const idea = 'DeFi lending platform';
    const similarProjects = [
      { title: 'Aave', description: 'Decentralized lending protocol' },
      { title: 'Compound', description: 'Algorithmic money markets' },
      { title: 'MakerDAO', description: 'Decentralized autonomous organization' },
    ];

    mockParseHtmlWithLLM.mockResolvedValue(mockResponse);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        idea,
        similarProjects,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      improvedIdea: mockResponse,
    });

    // Verify the prompt includes all similar projects
    const promptCall = mockParseHtmlWithLLM.mock.calls[0][1];
    expect(promptCall).toContain('Aave: Decentralized lending protocol');
    expect(promptCall).toContain('Compound: Algorithmic money markets');
    expect(promptCall).toContain('MakerDAO: Decentralized autonomous organization');
  });
});