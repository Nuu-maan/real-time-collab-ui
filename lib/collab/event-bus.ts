// Typed event emitter for simulating realtime communication

import type { CollabEvent } from "./types"

type EventHandler = (event: CollabEvent) => void

class EventBus {
  private handlers: Set<EventHandler> = new Set()
  private latency = 0
  private packetLoss = 0

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  emit(event: CollabEvent): void {
    // Simulate packet loss
    if (Math.random() < this.packetLoss) {
      return
    }

    // Simulate latency
    if (this.latency > 0) {
      setTimeout(() => this.broadcast(event), this.latency)
    } else {
      this.broadcast(event)
    }
  }

  private broadcast(event: CollabEvent): void {
    this.handlers.forEach((handler) => handler(event))
  }

  setLatency(ms: number): void {
    this.latency = ms
  }

  setPacketLoss(rate: number): void {
    this.packetLoss = Math.max(0, Math.min(1, rate))
  }
}

export const eventBus = new EventBus()
