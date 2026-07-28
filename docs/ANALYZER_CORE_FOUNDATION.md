# Analyzer Core Foundation

This package is the first executable Seed-Loom signal-to-system vertical slice. It remains package-local so the existing root Vite application keeps its current installation and deployment behavior.

## Contract

```text
image -> source hash -> provider -> normalized JSON -> Zod validation
      -> local traceability verification -> append-only run events -> analyzer result
```

## Provider policy

- Ollama is the default provider and requires no cloud key.
- OpenAI is an optional adapter using the Responses API and `OPENAI_API_KEY`.
- Fixture mode is the only provider used by default tests and CI.
- Every provider response is untrusted until parsed, validated, and verified locally.

## Local commands

```bash
cd packages/analyzer-core
npm install
npm run typecheck
npm test
npm run build
```

## Live provider examples

Ollama:

```ts
await service.analyze(source, {
  engine: "ollama",
  modelName: "llama3.2-vision",
  ollamaBaseUrl: "http://localhost:11434",
});
```

OpenAI:

```ts
await service.analyze(source, {
  engine: "openai",
  modelName: "gpt-5",
});
```

The OpenAI adapter reads `OPENAI_API_KEY` unless a key is passed explicitly. Never commit API keys.
