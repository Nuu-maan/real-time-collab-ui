// Core types for the collaboration system

export type Mode = "doc" | "board"

export type ConnectionStatus = "connecting" | "synced" | "reconnecting"

export type BlockType = "paragraph" | "heading" | "code"

export interface User {
  id: string
  name: string
  avatar: string
  color: string
  isBot: boolean
}

export interface CursorPosition {
  x: number
  y: number
  mode: Mode
  blockId?: string // for doc mode
}

export interface Presence {
  userId: string
  cursor: CursorPosition | null
  isTyping: boolean
  activeMode: Mode
  lastSeen: number
}

export interface Selection {
  userId: string
  blockId: string
  mode: Mode
}

export interface DocBlock {
  id: string
  content: string
  version: number
  type: BlockType // Added block type
}

export interface DocOp {
  blockId: string
  content: string
  version: number
  userId: string
}

export interface Comment {
  id: string
  authorId: string
  mode: Mode
  createdAt: number
  text: string
  resolved: boolean
  // Doc anchor
  blockId?: string
  // Board anchor
  x?: number
  y?: number
}

export interface Conflict {
  id: string
  blockId: string
  localContent: string
  remoteContent: string
  remoteUserId: string
  timestamp: number
}

export interface Stroke {
  id: string
  userId: string
  color: string
  points: Array<{ x: number; y: number }>
  tool: "pen" | "eraser"
}

export interface ActivityEntry {
  id: string
  message: string
  timestamp: number
  userId?: string
}

// Event types - Added comment and selection events
export type CollabEvent =
  | { type: "presence:update"; payload: { userId: string; presence: Partial<Presence> } }
  | { type: "cursor:update"; payload: { userId: string; cursor: CursorPosition } }
  | { type: "selection:update"; payload: Selection }
  | { type: "doc:op"; payload: DocOp }
  | { type: "doc:block-type"; payload: { blockId: string; type: BlockType; userId: string } }
  | { type: "board:stroke"; payload: Stroke }
  | { type: "board:stroke:point"; payload: { strokeId: string; point: { x: number; y: number } } }
  | { type: "conflict:detected"; payload: Conflict }
  | { type: "conflict:resolved"; payload: { conflictId: string } }
  | { type: "connection:status"; payload: ConnectionStatus }
  | { type: "comment:add"; payload: Comment }
  | { type: "comment:resolve"; payload: { commentId: string; resolved: boolean } }
  | { type: "comment:delete"; payload: { commentId: string } }

export interface DevSettings {
  latency: number // ms
  packetLoss: number // 0-1
  forceConflict: boolean
}
