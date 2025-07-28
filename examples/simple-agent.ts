import { AgentServer } from '../src/server'
import { loggingMiddleware, timeoutMiddleware } from '../src/middleware'

/**
 * example: a simple agent that echoes input with some processing
 *
 * in a real agent you'd call an LLM, use tools, etc.
 * this just demonstrates the protocol structure
 */

const server = new AgentServer({
  taskHandler: async (input) => {
    // simple echo agent
    return {
      output: `Received task: ${input.input}`,
    }
  },

  stepHandler: async (step) => {
    // simulate multi-step processing
    const input = step.input || ''

    // step 1: analyze
    if (step.name === null) {
      return {
        output: `Analyzing: ${input}`,
        is_last: false,
      }
    }

    // step 2: done
    return {
      output: `Completed analysis of: ${input}`,
      is_last: true,
    }
  },
})

// add middleware
server.use(loggingMiddleware())
server.use(timeoutMiddleware(30000))

// create and run a task
async function main() {
  const task = await server.createTask({
    input: 'Write a haiku about programming',
  })

  console.log('Task created:', task.task_id)
  console.log('Status:', task.status)
  console.log('Steps:', task.steps.length)

  // you'd typically expose this via HTTP
  // using express/fastify/hono:
  //
  // app.post('/ap/v1/agent/tasks', async (req, res) => {
  //   const task = await server.createTask(req.body)
  //   res.json(task)
  // })
}

main().catch(console.error)
