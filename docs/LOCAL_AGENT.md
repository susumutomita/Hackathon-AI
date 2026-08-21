# Local Agent Workflow

Hackathon-AI can run the idea generation and review loop entirely from the terminal with local data and Ollama.

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

## 1. Export the existing project corpus once

If the current Qdrant collection already contains the ETHGlobal project corpus, export it once:

```bash
pnpm data:export
```

This writes `data/projects.json`. Review the diff and commit the file. This export step is only needed when refreshing the corpus; normal evaluations do not crawl the web or query Qdrant.

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

This writes `data/project-embeddings.json`. The indexer checkpoints after each project and resumes from the existing cache, so interrupted runs do not restart from zero. Commit the resulting file if you want evaluations to require only one query embedding at runtime.

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

During `agent:local` execution, Hackathon-AI uses:

- Ollama on the local machine for generation, criticism, judging, and query embeddings.
- `data/projects.json` for historical project data.
- `data/project-embeddings.json` for the local vector index.

It does not need the crawler, Qdrant, Nomic, Groq, Claude, or other cloud LLM APIs.

Ollama itself should point to a local host. Do not set `OLLAMA_HOST` to a remote server if the requirement is strict local-only execution.
