import { agentStore, type Agent } from '@/lib/agent-state'
import { eventBus } from '@/lib/event-bus'
import { runProducer } from './producer'
import { runConsumer } from './consumer'
import { runGuardian } from './guardian'

const CYCLE_MS          = parseInt(process.env.CYCLE_MS          ?? '8000')
const GUARDIAN_CYCLE_MS = parseInt(process.env.GUARDIAN_CYCLE_MS ?? '15000')

export interface SpawnConfig {
  producers:  number
  consumers:  { budget: number }[]
  guardians:  number
  preKill:    number    // how many agents to pre-kill for demo
}

export const DEFAULT_SPAWN: SpawnConfig = {
  producers: 3,
  consumers: [
    { budget: 3 },    // low — dies fastest
    { budget: 7 },    // medium
    { budget: 15 },   // high
  ],
  guardians: 1,
  preKill: 2,
}

let stopSignal = false
const agentLoops: (() => void)[] = []

export async function spawnEconomy(config: SpawnConfig = DEFAULT_SPAWN) {
  if (agentStore.running) return
  stopSignal = false
  agentStore.reset()
  agentStore.running = true

  const agents: Agent[] = []

  // Spawn producers
  for (let i = 0; i < config.producers; i++) {
    const id = `producer-${i + 1}`
    const a: Agent = {
      id,
      type:        'producer',
      state:       'alive',
      budget:      20,
      budgetTotal: 20,
      storedBytes: 0,
      txCount:     0,
      earned:      0,
      bornAt:      Date.now(),
      activeCIDs:  [],
    }
    agentStore.addAgent(a)
    agents.push(a)
  }

  // Spawn consumers
  config.consumers.forEach((c, i) => {
    const id = `consumer-${i + 1}`
    const a: Agent = {
      id,
      type:        'consumer',
      state:       'alive',
      budget:      c.budget,
      budgetTotal: c.budget,
      storedBytes: 0,
      txCount:     0,
      earned:      0,
      bornAt:      Date.now(),
      activeCIDs:  [],
    }
    agentStore.addAgent(a)
    agents.push(a)
  })

  // Spawn guardians
  for (let i = 0; i < config.guardians; i++) {
    const id = `guardian-${i + 1}`
    const a: Agent = {
      id,
      type:        'guardian',
      state:       'alive',
      budget:      8,
      budgetTotal: 8,
      storedBytes: 0,
      txCount:     0,
      earned:      0,
      bornAt:      Date.now(),
      activeCIDs:  [],
    }
    agentStore.addAgent(a)
    agents.push(a)
  }

  // Pre-kill some agents (grey ghosts from frame 1)
  for (let i = 0; i < Math.min(config.preKill, agents.length); i++) {
    const victim = agents[agents.length - 1 - i]
    victim.state  = 'dead'
    victim.budget = 0
    victim.diedAt = Date.now() - Math.random() * 3_600_000  // died 0-1h ago
    eventBus.emit('agent:died', {
      type: 'agent:died', agentId: victim.id, finalBalance: 0, timestamp: victim.diedAt!,
    })
  }

  // Start agent loops
  const aliveAgents = agents.filter(a => a.state !== 'dead')

  for (const a of aliveAgents) {
    if (a.type === 'producer') {
      agentLoops.push(runProducer(a, CYCLE_MS, () => stopSignal))
    } else if (a.type === 'consumer') {
      agentLoops.push(runConsumer(a, CYCLE_MS, () => stopSignal))
    } else if (a.type === 'guardian') {
      agentLoops.push(runGuardian(a, GUARDIAN_CYCLE_MS, () => stopSignal))
    }
  }
}

export function stopEconomy() {
  stopSignal = true
  agentStore.running = false
}
