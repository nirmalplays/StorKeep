import { EventEmitter } from 'events'

export interface AgentEvent {
  type:      string
  timestamp: number
  agentId?:  string
  from?:     string
  to?:       string
  cid?:      string
  bytes?:    number
  amount?:   number
  reason?:   string
  finalBalance?: number
  success?:  boolean
  remaining?: number
  total?:    number
  // Deal renewal fields
  dealId?:        string
  costUsdc?:      string
  paymentTxHash?: string | null
  filecoinTxHash?: string | null
  basescanUrl?:   string | null
  filfoxUrl?:     string | null
  status?:        string
}

class AgentEventBus extends EventEmitter {
  private history: AgentEvent[] = []

  emit(event: string, payload: AgentEvent): boolean {
    this.history.unshift(payload)
    if (this.history.length > 200) this.history.pop()
    return super.emit(event, payload)
  }

  getHistory(limit = 50): AgentEvent[] {
    return this.history.slice(0, limit)
  }
}

// Singleton — persists across hot reloads in dev
const globalForBus = globalThis as unknown as { agentEventBus: AgentEventBus | undefined }
export const eventBus: AgentEventBus =
  globalForBus.agentEventBus ?? new AgentEventBus()
if (process.env.NODE_ENV !== 'production') globalForBus.agentEventBus = eventBus
