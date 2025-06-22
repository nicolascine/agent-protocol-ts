import { Step, StepStatus, StepInput } from './types'
import { randomId } from './utils'

export class StepManager {
  private steps = new Map<string, Step>()

  create(taskId: string, input?: StepInput): Step {
    const step: Step = {
      step_id: randomId(),
      task_id: taskId,
      name: null,
      input: input?.input || null,
      additional_input: input?.additional_input,
      output: null,
      artifacts: [],
      status: 'created',
      is_last: false,
      created_at: new Date().toISOString(),
    }

    this.steps.set(step.step_id, step)
    return step
  }

  get(stepId: string): Step | undefined {
    return this.steps.get(stepId)
  }

  listForTask(taskId: string, page = 1, pageSize = 10): { steps: Step[], total: number } {
    const taskSteps = Array.from(this.steps.values())
      .filter(s => s.task_id === taskId)
    const start = (page - 1) * pageSize
    return {
      steps: taskSteps.slice(start, start + pageSize),
      total: taskSteps.length,
    }
  }

  update(stepId: string, updates: Partial<Pick<Step, 'output' | 'status' | 'is_last' | 'additional_output'>>): Step {
    const step = this.steps.get(stepId)
    if (!step) throw new Error(`Step ${stepId} not found`)
    Object.assign(step, updates)
    return step
  }
}
