# Local Agent Workflow

Hackathon-AI can run the idea generation and review loop entirely from the terminal with repository data and Ollama.

## Runtime architecture

```text
prize JSON
  -> local prize analysis (Ollama)
  -> local project retrieval (committed JSON + committed embedding cache)
  -> idea generation (Ollama)
  -> Prize Fit / Novelty / Feasibility critics (Ollama, parallel)
  -> optional one-shot revision (Ollama)
  -> final Judge (Ollama)
  -> JSON report
```

The `agent:local` command forces `LOCAL_ONLY_LLM=true` and `EMBEDDING_PROVIDER=ollama`. In this mode, LLM failures do not fall back to Groq or another cloud provider.

## 1. Build or refresh the project corpus

The repository JSON is the source of truth. Crawling writes directly to `data/projects.json`; Qdrant is not involved.

```bash
pnpm data:crawl
```

The crawler:

- reads enabled event filters from `crawledEvents.json`
- crawls ETHGlobal finalist projects
- fetches each project detail page
- merges new data into the existing corpus
- deduplicates primarily by project link
- checkpoints `data/projects.json` after every page

To rebuild the corpus from scratch:

```bash
pnpm data:crawl -- --reset
```

Review and commit `data/projects.json` after refreshing it. Normal agent runs never crawl the web.

## 2. Build the local embedding cache

Install and start Ollama, then pull the local models:

```bash
ollama pull llama3.1
ollama pull nomic-embed-text
```

Create embeddings for committed project data:

```bash
pnpm data:index-local
```

This writes `data/project-embeddings.json`. The indexer checkpoints after each project and resumes from the existing cache, so interrupted runs do not restart from zero. Commit the resulting file so normal evaluations only need a query embedding at runtime.

Optional model overrides:

```bash
OLLAMA_MODEL=<chat-model> OLLAMA_EMBED_MODEL=<embedding-model> pnpm data:index-local
```

Use the same embedding model when creating and querying the cache.

## 3. Run the agentic evaluation loop

An example input is available at `examples/local-prize.json`.

```bash
pnpm agent:local examples/local-prize.json
```

To choose the report path:

```bash
pnpm agent:local examples/local-prize.json ./reports/example.json
```

The command prints the final Judge result and writes the complete generated idea, critic findings, revision status, and final judgment to JSON.

## Network boundary

`data:crawl` is the only workflow in this design that intentionally accesses the public web.

During `agent:local` execution, Hackathon-AI uses only:

- Ollama on the local machine for generation, criticism, judging, and query embeddings
- `data/projects.json` for historical project data
- `data/project-embeddings.json` for the local vector index

Normal evaluation does not require crawling, Qdrant, Nomic, Groq, Claude, or another cloud LLM API.

Ollama itself should point to a local host. Do not set `OLLAMA_HOST` to a remote server if strict local-only execution is required.
