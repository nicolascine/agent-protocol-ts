import { Task, Step, TaskInput, StepInput, TaskListResponse, StepListResponse, Artifact } from './types'

/**
 * Client for communicating with an Agent Protocol server
 */
export class AgentClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    // remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async createTask(input: TaskInput): Promise<Task> {
    const res = await this.request('/ap/v1/agent/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return res as Task
  }

  async getTask(taskId: string): Promise<Task> {
    return this.request(`/ap/v1/agent/tasks/${taskId}`) as Promise<Task>
  }

  async listTasks(page = 1, pageSize = 10): Promise<TaskListResponse> {
    return this.request(`/ap/v1/agent/tasks?page=${page}&page_size=${pageSize}`) as Promise<TaskListResponse>
  }

  async createStep(taskId: string, input?: StepInput): Promise<Step> {
    const res = await this.request(`/ap/v1/agent/tasks/${taskId}/steps`, {
      method: 'POST',
      body: JSON.stringify(input || {}),
    })
    return res as Step
  }

  async listSteps(taskId: string, page = 1, pageSize = 10): Promise<StepListResponse> {
    return this.request(`/ap/v1/agent/tasks/${taskId}/steps?page=${page}&page_size=${pageSize}`) as Promise<StepListResponse>
  }

  async getStep(taskId: string, stepId: string): Promise<Step> {
    return this.request(`/ap/v1/agent/tasks/${taskId}/steps/${stepId}`) as Promise<Step>
  }

  async listArtifacts(taskId: string): Promise<Artifact[]> {
    const task = await this.getTask(taskId)
    return task.artifacts
  }

  // convenience method: create task and run all steps until completion
  async runTask(input: TaskInput, maxSteps = 50): Promise<{ task: Task, steps: Step[] }> {
    const task = await this.createTask(input)
    const steps: Step[] = []

    for (let i = 0; i < maxSteps; i++) {
      const step = await this.createStep(task.task_id)
      steps.push(step)

      if (step.is_last) break

      // small delay between steps
      await new Promise(r => setTimeout(r, 100))
    }

    const finalTask = await this.getTask(task.task_id)
    return { task: finalTask, steps }
  }

  private async request(path: string, options?: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${path}`

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Agent Protocol error ${res.status}: ${body}`)
    }

    return res.json()
  }
}
