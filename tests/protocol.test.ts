import { describe, it, expect } from 'vitest'
import { AgentServer } from '../src/server'
import { TaskManager } from '../src/task'
import { StepManager } from '../src/step'
import { MiddlewareChain } from '../src/middleware'

describe('AgentServer', () => {
  function createTestServer() {
    return new AgentServer({
      taskHandler: async (input) => ({
        output: `echo: ${input.input}`,
      }),
      stepHandler: async (step) => ({
        output: `step done`,
        is_last: true,
      }),
    })
  }

  it('should create a task', async () => {
    const server = createTestServer()
    const task = await server.createTask({ input: 'hello' })

    expect(task.task_id).toBeDefined()
    expect(task.status).toBe('completed')
    expect(task.steps).toHaveLength(1)
  })

  it('should list tasks', async () => {
    const server = createTestServer()
    await server.createTask({ input: 'task 1' })
    await server.createTask({ input: 'task 2' })

    const response = await server.listTasks()
    expect(response.tasks).toHaveLength(2)
    expect(response.pagination.total_items).toBe(2)
  })

  it('should get task by id', async () => {
    const server = createTestServer()
    const created = await server.createTask({ input: 'test' })

    const fetched = await server.getTask(created.task_id)
    expect(fetched?.task_id).toBe(created.task_id)
  })

  it('should create steps', async () => {
    const server = createTestServer()
    const task = await server.createTask({ input: 'test' })

    const step = await server.createStep(task.task_id)
    expect(step.step_id).toBeDefined()
    expect(step.status).toBe('completed')
  })
})

describe('TaskManager', () => {
  it('should create and retrieve tasks', () => {
    const manager = new TaskManager()
    const task = manager.create({ input: 'test' })

    expect(manager.get(task.task_id)).toBeDefined()
    expect(manager.get('nonexistent')).toBeUndefined()
  })

  it('should paginate correctly', () => {
    const manager = new TaskManager()
    for (let i = 0; i < 25; i++) {
      manager.create({ input: `task ${i}` })
    }

    const page1 = manager.list(1, 10)
    expect(page1.tasks).toHaveLength(10)
    expect(page1.total).toBe(25)

    const page3 = manager.list(3, 10)
    expect(page3.tasks).toHaveLength(5)
  })
})

describe('MiddlewareChain', () => {
  it('should execute in order', async () => {
    const chain = new MiddlewareChain()
    const order: number[] = []

    chain.use(async (ctx, next) => {
      order.push(1)
      await next()
      order.push(4)
    })

    chain.use(async (ctx, next) => {
      order.push(2)
      await next()
      order.push(3)
    })

    await chain.execute({})
    expect(order).toEqual([1, 2, 3, 4])
  })

  it('should allow context modification', async () => {
    const chain = new MiddlewareChain()
    const ctx: any = { value: 0 }

    chain.use(async (ctx, next) => {
      ctx.value = 1
      await next()
    })

    chain.use(async (ctx, next) => {
      ctx.value += 1
      await next()
    })

    await chain.execute(ctx)
    expect(ctx.value).toBe(2)
  })
})
