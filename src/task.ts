import { Task, TaskStatus, TaskInput, Step } from './types'
import { randomId } from './utils'

export class TaskManager {
  private tasks = new Map<string, Task>()

  create(input: TaskInput): Task {
    const task: Task = {
      task_id: randomId(),
      input: input.input,
      additional_input: input.additional_input,
      artifacts: [],
      steps: [],
      status: 'created',
      created_at: new Date().toISOString(),
    }

    this.tasks.set(task.task_id, task)
    return task
  }

  get(taskId: string): Task | undefined {
    return this.tasks.get(taskId)
  }

  list(page = 1, pageSize = 10): { tasks: Task[], total: number } {
    const all = Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const start = Math.max(0, (page - 1) * pageSize)
    const end = Math.min(all.length, start + pageSize)
    return {
      tasks: all.slice(start, end),
      total: all.length,
    }
  }

  updateStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    task.status = status
  }

  addStep(taskId: string, step: Step): void {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    task.steps.push(step)
  }
}
