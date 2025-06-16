/**
 * Types based on the Agent Protocol specification
 * ref: https://agentprotocol.ai/spec
 */

export interface Task {
  task_id: string
  input: string | null
  additional_input?: Record<string, any>
  artifacts: Artifact[]
  steps: Step[]
  status: TaskStatus
  created_at: string
}

export type TaskStatus = 'created' | 'running' | 'completed' | 'failed'

export interface Step {
  step_id: string
  task_id: string
  name: string | null
  input: string | null
  additional_input?: Record<string, any>
  output: string | null
  additional_output?: Record<string, any>
  artifacts: Artifact[]
  status: StepStatus
  is_last: boolean
  created_at: string
}

export type StepStatus = 'created' | 'running' | 'completed' | 'failed'

export interface Artifact {
  artifact_id: string
  file_name: string
  relative_path: string | null
  created_at: string
  // extension: binary content or URI
  content_type?: string
  uri?: string
}

export interface TaskInput {
  input: string
  additional_input?: Record<string, any>
}

export interface StepInput {
  input?: string
  additional_input?: Record<string, any>
}

// request/response types
export interface TaskListResponse {
  tasks: Task[]
  pagination: Pagination
}

export interface StepListResponse {
  steps: Step[]
  pagination: Pagination
}

export interface Pagination {
  total_items: number
  total_pages: number
  current_page: number
  page_size: number
}

// handler types - what implementors need to provide
export type TaskHandler = (taskInput: TaskInput) => Promise<TaskHandlerResponse>
export type StepHandler = (step: Step) => Promise<StepHandlerResponse>

export interface TaskHandlerResponse {
  output?: string
  artifacts?: Artifact[]
  additional_output?: Record<string, any>
}

export interface StepHandlerResponse {
  output: string
  artifacts?: Artifact[]
  is_last?: boolean
  additional_output?: Record<string, any>
}
