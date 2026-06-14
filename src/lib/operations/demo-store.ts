import { createInitialDemoStore, type DemoOperationsStore } from "@/lib/operations/demo-data"

let store: DemoOperationsStore = createInitialDemoStore()

export function getDemoOperationsStore(): DemoOperationsStore {
  return store
}

export function resetDemoOperationsStore() {
  store = createInitialDemoStore()
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
