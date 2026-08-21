[![ci](https://github.com/susumutomita/Hackathon-AI/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/susumutomita/Hackathon-AI/actions/workflows/ci.yml)
![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/susumutomita/Hackathon-AI)
![GitHub top language](https://img.shields.io/github/languages/top/susumutomita/Hackathon-AI)
![GitHub pull requests](https://img.shields.io/github/issues-pr/susumutomita/Hackathon-AI)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/susumutomita/Hackathon-AI)
![GitHub repo size](https://img.shields.io/github/repo-size/susumutomita/Hackathon-AI)

# Hackathon AI - Hackathon Success Support Tool

## Overview

**Hackathon AI** is an AI-driven tool designed to help participants maximize their chances of success in hackathons by leveraging data from past events. Developed using TypeScript and Next.js, this application analyzes historical hackathon projects and uses local LLM workflows to generate and review project ideas.

## Key Features

- Analysis of Past Hackathon Data: Analyze trends from finalist projects and requirements from prize-winning projects to identify key success factors.
- Search for Similar Projects: Check the novelty of ideas and estimate the likelihood of success.
- Idea Refinement Using LLM: Refine and improve ideas based on similar past projects.
- Agentic Review Loop: Independently evaluate prize fit, novelty, and feasibility before a final judge step.
- Local Execution: Run normal evaluation with committed JSON data and Ollama without cloud LLM APIs.

## Local Agent Workflow

Historical project data is committed to the repository as JSON. Qdrant is not required by the local agent workflow.

Refresh the corpus only when needed:

```bash
pnpm data:crawl
pnpm data:index-local
```

Then run an evaluation entirely from the terminal:

```bash
pnpm agent:local examples/local-prize.json
```

For the full workflow, see [Local Agent Workflow](docs/LOCAL_AGENT.md).

## Installation and Setup

### Prerequisites

- Node.js 18 or later
- pnpm
- Ollama

### Installation Steps

1. Clone the repository:

    ```bash
    git clone https://github.com/susumutomita/Hackathon-AI
    ```

2. Install dependencies:

    ```bash
    make install
    ```

3. Start the application in development mode:

    ```bash
    make dev
    ```

4. Create a production build:

    ```bash
    make build
    ```

## Development Environment

- TypeScript
- Next.js
- React
- Ollama
- Repository-managed JSON corpus and local embedding cache for the agentic workflow

## Documentation

- **[Local Agent Workflow](docs/LOCAL_AGENT.md)** - Fully local generation and review workflow
- **[API Documentation](docs/API.md)** - Remaining web API endpoints
- **[Architecture](docs/ARCHITECTURE.md)** - System design and architecture
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Development setup and coding conventions
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Component Catalog](docs/COMPONENTS.md)** - UI component usage
- **[UX Spec](docs/UX_SPEC.md)** - User experience design
- **[MCP Setup](docs/mcp-setup.md)** - MCP server setup

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
