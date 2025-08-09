# agent-protocol-ts

TypeScript implementation of the [Agent Protocol](https://agentprotocol.ai) specification.

## What is the Agent Protocol?

It's an open standard for communicating with AI agents. Think of it as a REST API spec that any agent can implement, so tools and clients can work with any agent the same way.

The core idea: tasks have steps, steps produce artifacts. That's it.

## Why this implementation

Most agent frameworks are opinionated about everything - which LLM, which tools, how to plan. The Agent Protocol doesn't care about any of that. It just defines the communication interface.

This library gives you:
- **Server**: Handle incoming agent requests (plug into any HTTP framework)
- **Client**: Talk to any Agent Protocol-compatible server
- **Middleware**: Logging, timeouts, retries - compose them as needed
- **Types**: Full TypeScript types for the entire spec

## Install

```bash
npm install agent-protocol-ts
```

## Server example

```typescript
import { AgentServer, loggingMiddleware } from 'agent-protocol-ts'

const server = new AgentServer({
  taskHandler: async (input) => {
    const result = await myLLM.complete(input.input)
    return { output: result }
  },
  stepHandler: async (step) => {
    return { output: 'done', is_last: true }
  },
})

server.use(loggingMiddleware())

// wire up to your HTTP framework
// app.post('/ap/v1/agent/tasks', ...)
```

## Client example

```typescript
import { AgentClient } from 'agent-protocol-ts'

const client = new AgentClient('http://localhost:8000')

// create and run a task
const { task, steps } = await client.runTask({
  input: 'Write a function that sorts an array'
})

console.log(task.status) // 'completed'
console.log(steps.map(s => s.output))
```

## Middleware

Koa-style middleware chain. Each middleware wraps the next one.

```typescript
server.use(async (ctx, next) => {
  console.log('before:', ctx.task?.task_id)
  await next()
  console.log('after:', ctx.task?.task_id)
})
```

Built-in middlewares:
- `loggingMiddleware()` - Logs task/step lifecycle with timing
- `timeoutMiddleware(ms)` - Fails if execution exceeds timeout
- `retryMiddleware(retries, delay)` - Retries on failure with backoff

## Spec compliance

Implements the core Agent Protocol endpoints:
- `POST /agent/tasks` - Create task
- `GET /agent/tasks` - List tasks
- `GET /agent/tasks/:id` - Get task
- `POST /agent/tasks/:id/steps` - Create step
- `GET /agent/tasks/:id/steps` - List steps
- `GET /agent/tasks/:id/artifacts` - List artifacts

## Architecture

The server is framework-agnostic - it doesn't start an HTTP server itself. You wire the handlers into whatever framework you're using. This means it works with Express, Fastify, Hono, even Deno and Bun.

```
AgentServer
├── TaskManager
├── StepManager
├── ArtifactManager
└── MiddlewareChain
```

## License

MIT
