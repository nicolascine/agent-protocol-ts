import { TaskHandler, StepHandler, Task, Step, TaskInput, StepInput, TaskListResponse, StepListResponse, Pagination } from './types'
import { TaskManager } from './task'
import { StepManager } from './step'
import { ArtifactManager } from './artifact'
import { MiddlewareChain, MiddlewareFn } from './middleware'

export interface AgentServerConfig {
  taskHandler: TaskHandler
  stepHandler: StepHandler
  port?: number
}

/**
 * Agent Protocol server
 *
 * implements the spec endpoints:
 * POST /ap/v1/agent/tasks
 * GET  /ap/v1/agent/tasks
 * GET  /ap/v1/agent/tasks/:task_id
 * POST /ap/v1/agent/tasks/:task_id/steps
 * GET  /ap/v1/agent/tasks/:task_id/steps
 * GET  /ap/v1/agent/tasks/:task_id/steps/:step_id
 * GET  /ap/v1/agent/tasks/:task_id/artifacts
 *
 * note: this doesn't include the HTTP server itself
 * it's a handler-based implementation that can plug into
 * express, fastify, hono, etc.
 */
export class AgentServer {
  private taskManager = new TaskManager()
  private stepManager = new StepManager()
  private artifactManager = new ArtifactManager()
  private taskHandler: TaskHandler
  private stepHandler: StepHandler
  private middleware = new MiddlewareChain()

  constructor(config: AgentServerConfig) {
    this.taskHandler = config.taskHandler
    this.stepHandler = config.stepHandler
  }

  use(fn: MiddlewareFn): this {
    this.middleware.use(fn)
    return this
  }

  async createTask(input: TaskInput): Promise<Task> {
    const task = this.taskManager.create(input)
    this.taskManager.updateStatus(task.task_id, 'running')

    await this.middleware.execute({ task, input })

    try {
      const result = await this.taskHandler(input)
      if (result.output) {
        // store as first step
        const step = this.stepManager.create(task.task_id, { input: input.input })
        this.stepManager.update(step.step_id, {
          output: result.output,
          status: 'completed',
          is_last: true,
        })
        this.taskManager.addStep(task.task_id, step)
      }

      this.taskManager.updateStatus(task.task_id, 'completed')
    } catch (err) {
      this.taskManager.updateStatus(task.task_id, 'failed')
      throw err
    }

    return this.taskManager.get(task.task_id)!
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.taskManager.get(taskId)
  }

  async listTasks(page = 1, pageSize = 10): Promise<TaskListResponse> {
    const { tasks, total } = this.taskManager.list(page, pageSize)
    return {
      tasks,
      pagination: this.paginate(total, page, pageSize),
    }
  }

  async createStep(taskId: string, input?: StepInput): Promise<Step> {
    const task = this.taskManager.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)

    const step = this.stepManager.create(taskId, input)

    await this.middleware.execute({ task, step, input })

    try {
      const result = await this.stepHandler(step)
      this.stepManager.update(step.step_id, {
        output: result.output,
        status: 'completed',
        is_last: result.is_last || false,
        additional_output: result.additional_output,
      })

      this.taskManager.addStep(taskId, step)

      if (result.is_last) {
        this.taskManager.updateStatus(taskId, 'completed')
      }
    } catch (err) {
      this.stepManager.update(step.step_id, { status: 'failed' })
      throw err
    }

    return this.stepManager.get(step.step_id)!
  }

  async listSteps(taskId: string, page = 1, pageSize = 10): Promise<StepListResponse> {
    const { steps, total } = this.stepManager.listForTask(taskId, page, pageSize)
    return {
      steps,
      pagination: this.paginate(total, page, pageSize),
    }
  }

  private paginate(total: number, page: number, pageSize: number): Pagination {
    return {
      total_items: total,
      total_pages: Math.ceil(total / pageSize),
      current_page: page,
      page_size: pageSize,
    }
  }
}
