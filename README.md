# agent-protocol-ts

TypeScript implementation of the [Agent Protocol](https://agentprotocol.ai) — an open standard for communicating with AI agents.

## Overview

The Agent Protocol defines a minimal REST API that any agent can implement. This library provides both a **server** (to build agents) and a **client** (to talk to them), plus a middleware system for cross-cutting concerns.

Framework-agnostic. Bring your own HTTP server.

## Install

```bash
npm install agent-protocol-ts
```

## Server

```typescript
import { AgentServer, loggingMiddleware } from 'agent-protocol-ts'

const server = new AgentServer({
  taskHandler: async (input) => {
    const response = await myLLM.generate(input.input)
    return { output: response }
  },
  stepHandler: async (step) => {
    // multi-step execution logic
    return { output: 'step completed', is_last: true }
  },
})

server.use(loggingMiddleware())

// wire into your HTTP framework:
// app.post('/ap/v1/agent/tasks', (req, res) => ...)
```

## Client

```typescript
import { AgentClient } from 'agent-protocol-ts'

const client = new AgentClient('http://localhost:8000')
const { task, steps } = await client.runTask({ input: 'analyze this code' })
```

## Endpoint coverage

| Endpoint | Method | Status |
|----------|--------|--------|
| `/ap/v1/agent/tasks` | POST | ✅ |
| `/ap/v1/agent/tasks` | GET | ✅ |
| `/ap/v1/agent/tasks/:id` | GET | ✅ |
| `/ap/v1/agent/tasks/:id/steps` | POST | ✅ |
| `/ap/v1/agent/tasks/:id/steps` | GET | ✅ |
| `/ap/v1/agent/tasks/:id/steps/:id` | GET | ✅ |
| `/ap/v1/agent/tasks/:id/artifacts` | GET | ✅ |
| `/ap/v1/agent/tasks/:id/artifacts` | POST | ⬜ |
| `/ap/v1/agent/tasks/:id/artifacts/:id` | GET | ⬜ |

## Middleware

Koa-style middleware. Each function wraps the next.

```typescript
server.use(loggingMiddleware())      // logs task/step lifecycle
server.use(timeoutMiddleware(30000)) // 30s timeout
server.use(retryMiddleware(3, 1000)) // 3 retries with 1s backoff
```

Write your own:

```typescript
server.use(async (ctx, next) => {
  // before
  await next()
  // after
})
```

## Architecture

The server doesn't start an HTTP listener. It exposes handler methods (`createTask`, `listTasks`, `createStep`, etc.) that you map to your framework's routes. Works with Express, Fastify, Hono, Bun, Deno.

Internally: `TaskManager`, `StepManager`, and `ArtifactManager` handle state. The `MiddlewareChain` wraps execution.

## Spec

Full specification: [agentprotocol.ai](https://agentprotocol.ai)

## License

MIT
