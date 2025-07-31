# Hackathon Database MCP Server

This MCP (Model Context Protocol) server provides access to the hackathon projects database powered by Qdrant vector database.

## Features

- Semantic Search: Search for similar hackathon projects using natural language queries
- Project Retrieval: Get specific project details (coming soon)
- Vector Database: Powered by Qdrant for efficient similarity search

## Setup

### Environment Variables

The following environment variables must be set:

- `QD_URL`: Qdrant server URL
- `QD_API_KEY`: Qdrant API key for authentication
- `EMBEDDING_PROVIDER`: Embedding provider to use (`ollama` or `nomic`, default: `nomic`)
- `NOMIC_API_KEY`: Nomic API key for generating embeddings (required when EMBEDDING_PROVIDER=`nomic`)
- `OLLAMA_MODEL`: Ollama model name for embeddings (default: `nomic-embed-text`)
- `OLLAMA_URL`: Ollama server URL (default: `http://localhost:11434`)

### Embedding Models

The server supports two embedding providers:

#### 1. Ollama (Local LLM)

- Set `EMBEDDING_PROVIDER=ollama`
- Make sure Ollama is running: `ollama serve`
- Pull the model if needed: `ollama pull nomic-embed-text` (or your preferred model)
- Configure with:
  - `OLLAMA_MODEL`: Model name (default: `nomic-embed-text`)
  - `OLLAMA_URL`: Server URL (default: `http://localhost:11434`)

#### 2. Nomic API (Cloud)

- Set `EMBEDDING_PROVIDER=nomic` (default)
- Requires `NOMIC_API_KEY` environment variable

### Building

From the mcp-server directory:

```bash
pnpm install
pnpm run build
```

### Running

The server runs on stdio and can be integrated with Claude or other MCP-compatible applications.

```bash
pnpm start
```

## Available Tools

### search_projects

Search for similar hackathon projects using semantic search.

Parameters.

- `query` (string, required): Search query for finding similar hackathon projects
- `limit` (number, optional): Maximum number of results to return (default: 10)

Example.
```json
{
  "name": "search_projects",
  "arguments": {
    "query": "NFT marketplace for digital art",
    "limit": 5
  }
}
```

### get_project

Get a specific hackathon project by ID (coming soon).

Parameters.

- `projectId` (string, required): The ID of the project to retrieve

## Resources

The server provides the following resources:

- `hackathon://database/info`: Information about the hackathon projects database

## Integration

To use this MCP server with Claude Code or other MCP-compatible applications, add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "hackathon-database": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "QD_URL": "${QD_URL}",
        "QD_API_KEY": "${QD_API_KEY}",
        "EMBEDDING_PROVIDER": "nomic",
        "NOMIC_API_KEY": "${NOMIC_API_KEY}"
      }
    }
  }
}
```

For using Ollama (local LLM):

```json
{
  "mcpServers": {
    "hackathon-database": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "QD_URL": "${QD_URL}",
        "QD_API_KEY": "${QD_API_KEY}",
        "EMBEDDING_PROVIDER": "ollama",
        "OLLAMA_MODEL": "nomic-embed-text",
        "OLLAMA_URL": "http://localhost:11434"
      }
    }
  }
}
```

## Development

### Running the MCP Server

For development with hot reloading:

```bash
pnpm run dev
```

### Testing Search Functionality

Test the search functionality with custom queries:

```bash
# Search with default limit (5 results)
pnpm run test:search "NFT marketplace"

# Search with custom limit
pnpm run test:search "DeFi lending platform" 10

# Search in Japanese
pnpm run test:search "分散型金融" 3
```

The test script:

- Accepts search query as the first argument
- Optionally accepts result limit as the second argument
- Shows embedding creation and search results
- Provides detailed error messages for troubleshooting
