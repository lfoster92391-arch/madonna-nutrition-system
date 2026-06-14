export interface VersionSnapshot {
  id: string
  label: string
  createdAt: string
  createdBy?: string
}

export interface VersionControlState {
  currentVersion: string
  history: VersionSnapshot[]
}

export function createVersionSnapshot(label: string, createdBy?: string): VersionSnapshot {
  return {
    id: `v-${Date.now()}`,
    label,
    createdAt: new Date().toISOString(),
    createdBy,
  }
}

export function getDefaultVersionState(): VersionControlState {
  return { currentVersion: "draft", history: [] }
}
