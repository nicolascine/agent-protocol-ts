import { Artifact } from './types'
import { randomId } from './utils'

export class ArtifactManager {
  private artifacts = new Map<string, { meta: Artifact, data: Buffer | string }>()

  create(fileName: string, data: Buffer | string, options?: { contentType?: string, relativePath?: string }): Artifact {
    const artifact: Artifact = {
      artifact_id: randomId(),
      file_name: fileName,
      relative_path: options?.relativePath || null,
      created_at: new Date().toISOString(),
      content_type: options?.contentType || guessContentType(fileName),
    }

    this.artifacts.set(artifact.artifact_id, { meta: artifact, data })
    return artifact
  }

  get(artifactId: string): { meta: Artifact, data: Buffer | string } | undefined {
    return this.artifacts.get(artifactId)
  }

  listForTask(taskId: string, artifacts: Artifact[]): Artifact[] {
    // artifacts are stored on the task, this just returns them
    // kept as a method for consistency with the rest of the API
    return artifacts
  }

  delete(artifactId: string): boolean {
    return this.artifacts.delete(artifactId)
  }
}

function guessContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    'json': 'application/json',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'pdf': 'application/pdf',
    'csv': 'text/csv',
    'md': 'text/markdown',
  }
  return types[ext || ''] || 'application/octet-stream'
}
