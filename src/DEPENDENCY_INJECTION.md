# Dependency Injection Pattern Implementation

## Overview

This implementation introduces a dependency injection pattern to improve testability and maintainability of the codebase, particularly for the QdrantHandler and its external dependencies.

## Architecture

### 1. Interfaces Layer (`src/interfaces/`)

#### `embedding.interface.ts`
- EmbeddingProvider: Core interface for embedding providers
- EmbeddingProviderConfig: Configuration interface
- EmbeddingError: Specialized error class
- EmbeddingProviderType: Enum for provider types

#### `vectordb.interface.ts`
- VectorDBClient: Interface for vector database operations
- VectorSearchQuery: Search parameters
- VectorSearchResult: Search results structure
- VectorPoint: Vector insertion structure
- VectorDBError: Specialized error class

#### `http.interface.ts`
- HttpClient: Interface for HTTP operations
- HttpRequestConfig: Request configuration
- HttpResponse: Response structure
- HttpError: HTTP-specific error class

### 2. Adapters Layer (`src/adapters/`)

#### `ollama.adapter.ts`
- Implements `EmbeddingProvider` interface
- Handles Ollama-specific embedding creation
- Provides detailed error messages for common issues

#### `nomic.adapter.ts`
- Implements `EmbeddingProvider` interface
- Requires `HttpClient` dependency (dependency injection)
- Handles Nomic API authentication and errors

#### `qdrant.adapter.ts`
- Implements `VectorDBClient` interface
- Wraps QdrantClient with our interface
- Provides consistent error handling

#### `axios.adapter.ts`
- Implements `HttpClient` interface
- Wraps axios library
- Maps axios-specific types to our interfaces

### 3. Factory Layer (`src/factories/`)

#### `embedding.factory.ts`
- Creates embedding providers based on configuration
- Supports environment variable configuration
- Extensible for custom providers

## Usage Examples

### Creating an Embedding Provider

```typescript
import { EmbeddingFactory } from '@/factories/embedding.factory';

// Using environment variables (default)
const provider = EmbeddingFactory.create();

// Using specific provider
const ollamaProvider = EmbeddingFactory.create({
  provider: 'ollama',
  config: {
    model: 'custom-model',
    baseUrl: 'http://localhost:11434'
  }
});

// With custom HTTP client
const customHttpClient = new MyCustomHttpClient();
const nomicProvider = EmbeddingFactory.create({
  provider: 'nomic',
  httpClient: customHttpClient,
  config: {
    apiKey: 'my-api-key'
  }
});
```

### Testing with Mocks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { MyService } from './my-service';
import { EmbeddingProvider } from '@/interfaces/embedding.interface';

describe('MyService', () => {
  it('should create embeddings', async () => {
    // Create mock provider
    const mockProvider: EmbeddingProvider = {
      createEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
    };

    // Inject mock into service
    const service = new MyService(mockProvider);

    // Test the service
    const result = await service.processText('test');

    expect(mockProvider.createEmbedding).toHaveBeenCalledWith('test');
    expect(result).toBeDefined();
  });
});
```

## Next Steps

### Phase 4: QdrantHandler Refactoring

The QdrantHandler needs to be refactored to:

1. Accept dependencies through constructor:
```typescript
class QdrantHandler {
  constructor(
    private embeddingProvider: EmbeddingProvider,
    private vectorDB: VectorDBClient
  ) {}
}
```

2. Use injected dependencies instead of direct imports:
```typescript
// Before
const response = await ollama.embed({ model, input });

// After
const embedding = await this.embeddingProvider.createEmbedding(input);
```

3. Create a factory for QdrantHandler:
```typescript
export class QdrantHandlerFactory {
  static create(): QdrantHandler {
    const embeddingProvider = EmbeddingFactory.create();
    const vectorDB = new QdrantAdapter();
    return new QdrantHandler(embeddingProvider, vectorDB);
  }
}
```

## Benefits

1. Improved Testability: Services can be tested with mock dependencies
2. Flexibility: Easy to switch between providers
3. Maintainability: Clear separation of concerns
4. Type Safety: Full TypeScript support with interfaces
5. Error Handling: Consistent error handling across providers

## Migration Guide

For existing code using QdrantHandler:

```typescript
// Old way
const handler = new QdrantHandler();

// New way (after Phase 4)
const handler = QdrantHandlerFactory.create();

// Or with custom configuration
const handler = QdrantHandlerFactory.create({
  embeddingProvider: 'ollama',
  vectorDBConfig: {
    url: 'http://custom-qdrant:6333'
  }
});
```
