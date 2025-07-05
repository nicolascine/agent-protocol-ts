import { Task, Step, TaskInput, StepInput } from './types'

export type MiddlewareContext = {
  task?: Task
  step?: Step
  input?: TaskInput | StepInput
  [key: string]: any
}

export type NextFn = () => Promise<void>
export type MiddlewareFn = (ctx: MiddlewareContext, next: NextFn) => Promise<void>

/**
 * koa-style middleware chain
 * each middleware can modify context and call next() to continue
 */
export class MiddlewareChain {
  private middlewares: MiddlewareFn[] = []

  use(fn: MiddlewareFn): this {
    this.middlewares.push(fn)
    return this
  }

  async execute(ctx: MiddlewareContext): Promise<void> {
    let index = 0

    const next = async (): Promise<void> => {
      if (index >= this.middlewares.length) return
      const fn = this.middlewares[index++]
      await fn(ctx, next)
    }

    await next()
  }
}

// built-in middlewares

/**
 * logging middleware - logs task/step lifecycle
 */
export function loggingMiddleware(): MiddlewareFn {
  return async (ctx, next) => {
    const start = Date.now()
    const id = ctx.task?.task_id || ctx.step?.step_id || 'unknown'
    console.log(`[agent-protocol] start ${id}`)

    await next()

    const duration = Date.now() - start
    console.log(`[agent-protocol] done ${id} (${duration}ms)`)
  }
}

/**
 * timeout middleware - fails if execution takes too long
 */
export function timeoutMiddleware(ms: number): MiddlewareFn {
  return async (ctx, next) => {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    })

    await Promise.race([next(), timeout])
  }
}

/**
 * retry middleware - retries on failure
 */
export function retryMiddleware(maxRetries = 3, delay = 1000): MiddlewareFn {
  return async (ctx, next) => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await next()
        return // success
      } catch (err) {
        lastError = err as Error
        if (attempt < maxRetries) {
          console.warn(`[agent-protocol] retry ${attempt + 1}/${maxRetries}: ${lastError.message}`)
          await new Promise(r => setTimeout(r, delay * (attempt + 1)))
        }
      }
    }

    throw lastError
  }
}
