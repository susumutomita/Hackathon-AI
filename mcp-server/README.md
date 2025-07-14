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
- `NOMIC_API_KEY`: Nomic API key for generating embeddings

### Building

From the mcp-server directory:

```bash
npm install
npm run build
```

### Running

The server runs on stdio and can be integrated with Claude or other MCP-compatible applications.

```bash
npm start
```

## Available Tools

### search_projects

Search for similar hackathon projects using semantic search.

**Parameters:**
- `query` (string, required): Search query for finding similar hackathon projects
- `limit` (number, optional): Maximum number of results to return (default: 10)

**Example:**
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

**Parameters:**
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
        "NOMIC_API_KEY": "${NOMIC_API_KEY}"
      }
    }
  }
}
```

## Development

For development with hot reloading:

```bash
npm run dev
```
