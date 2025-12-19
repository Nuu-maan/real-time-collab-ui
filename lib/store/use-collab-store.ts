import { create } from "zustand"
import type {
  User,
  Presence,
  DocBlock,
  Conflict,
  Stroke,
  ActivityEntry,
  ConnectionStatus,
  Mode,
  CursorPosition,
  DevSettings,
  Comment,
  Selection,
  BlockType,
} from "@/lib/collab/types"
import { botUsers, localUser } from "@/lib/collab/bot-users"

interface CollabState {
  // Connection
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void

  // Mode
  activeMode: Mode
  setActiveMode: (mode: Mode) => void

  // Users
  users: User[]
  localUser: User

  // Presence
  presences: Map<string, Presence>
  updatePresence: (userId: string, presence: Partial<Presence>) => void

  // Cursors (interpolated positions for smooth rendering)
  remoteCursors: Map<string, CursorPosition & { targetX: number; targetY: number }>
  updateRemoteCursor: (userId: string, cursor: CursorPosition) => void

  // Local cursor
  localCursor: CursorPosition | null
  setLocalCursor: (cursor: CursorPosition | null) => void

  selections: Map<string, Selection>
  updateSelection: (userId: string, selection: Selection | null) => void
  localSelection: string | null
  setLocalSelection: (blockId: string | null) => void

  // Doc blocks
  docBlocks: DocBlock[]
  updateBlock: (blockId: string, content: string) => void
  updateBlockType: (blockId: string, type: BlockType) => void
  addBlock: (afterId?: string) => void

  comments: Comment[]
  addComment: (comment: Comment) => void
  resolveComment: (commentId: string, resolved: boolean) => void
  deleteComment: (commentId: string) => void
  selectedCommentId: string | null
  setSelectedCommentId: (id: string | null) => void

  // Conflicts
  conflicts: Conflict[]
  addConflict: (conflict: Conflict) => void
  resolveConflict: (conflictId: string, resolution: "mine" | "theirs" | "merge", mergedContent?: string) => void

  // Board strokes
  strokes: Stroke[]
  addStroke: (stroke: Stroke) => void
  addPointToStroke: (strokeId: string, point: { x: number; y: number }) => void

  // Activity feed
  activities: ActivityEntry[]
  addActivity: (message: string, userId?: string) => void

  // Follow mode
  followingUserId: string | null
  setFollowingUserId: (userId: string | null) => void

  // Laser pointer
  laserPointer: { x: number; y: number; visible: boolean }
  setLaserPointer: (pointer: { x: number; y: number; visible: boolean }) => void

  // Dev settings
  devSettings: DevSettings
  setDevSettings: (settings: Partial<DevSettings>) => void

  // Typing state
  localTypingBlockId: string | null
  setLocalTypingBlockId: (blockId: string | null) => void

  rightPanelTab: "activity" | "comments" | "preview"
  setRightPanelTab: (tab: "activity" | "comments" | "preview") => void
}

const initialBlocks: DocBlock[] = [
  { id: "block-1", content: "Welcome to the collaborative document editor.", version: 1, type: "heading" },
  { id: "block-2", content: "Start typing to see realtime collaboration in action.", version: 1, type: "paragraph" },
  { id: "block-3", content: "Watch as other users join and make changes.", version: 1, type: "paragraph" },
  { id: "block-4", content: "const greeting = 'Hello World!'", version: 1, type: "code" },
]

export const useCollabStore = create<CollabState>((set, get) => ({
  // Connection
  connectionStatus: "connecting",
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Mode
  activeMode: "doc",
  setActiveMode: (mode) => set({ activeMode: mode }),

  // Users
  users: [localUser, ...botUsers],
  localUser,

  // Presence
  presences: new Map(
    [localUser, ...botUsers].map((u) => [
      u.id,
      { userId: u.id, cursor: null, isTyping: false, activeMode: "doc" as Mode, lastSeen: Date.now() },
    ]),
  ),
  updatePresence: (userId, presence) =>
    set((state) => {
      const newPresences = new Map(state.presences)
      const existing = newPresences.get(userId) || {
        userId,
        cursor: null,
        isTyping: false,
        activeMode: "doc" as Mode,
        lastSeen: Date.now(),
      }
      newPresences.set(userId, { ...existing, ...presence, lastSeen: Date.now() })
      return { presences: newPresences }
    }),

  // Cursors
  remoteCursors: new Map(),
  updateRemoteCursor: (userId, cursor) =>
    set((state) => {
      const newCursors = new Map(state.remoteCursors)
      const existing = newCursors.get(userId)
      newCursors.set(userId, {
        ...cursor,
        targetX: cursor.x,
        targetY: cursor.y,
        x: existing?.x ?? cursor.x,
        y: existing?.y ?? cursor.y,
      })
      return { remoteCursors: newCursors }
    }),

  // Local cursor
  localCursor: null,
  setLocalCursor: (cursor) => set({ localCursor: cursor }),

  selections: new Map(),
  updateSelection: (userId, selection) =>
    set((state) => {
      const newSelections = new Map(state.selections)
      if (selection) {
        newSelections.set(userId, selection)
      } else {
        newSelections.delete(userId)
      }
      return { selections: newSelections }
    }),
  localSelection: null,
  setLocalSelection: (blockId) => set({ localSelection: blockId }),

  // Doc blocks
  docBlocks: initialBlocks,
  updateBlock: (blockId, content) =>
    set((state) => ({
      docBlocks: state.docBlocks.map((b) => (b.id === blockId ? { ...b, content, version: b.version + 1 } : b)),
    })),
  updateBlockType: (blockId, type) =>
    set((state) => ({
      docBlocks: state.docBlocks.map((b) => (b.id === blockId ? { ...b, type } : b)),
    })),
  addBlock: (afterId) =>
    set((state) => {
      const newBlock: DocBlock = { id: `block-${Date.now()}`, content: "", version: 1, type: "paragraph" }
      if (!afterId) return { docBlocks: [...state.docBlocks, newBlock] }
      const index = state.docBlocks.findIndex((b) => b.id === afterId)
      const newBlocks = [...state.docBlocks]
      newBlocks.splice(index + 1, 0, newBlock)
      return { docBlocks: newBlocks }
    }),

  comments: [],
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
  resolveComment: (commentId, resolved) =>
    set((state) => ({
      comments: state.comments.map((c) => (c.id === commentId ? { ...c, resolved } : c)),
    })),
  deleteComment: (commentId) =>
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== commentId),
    })),
  selectedCommentId: null,
  setSelectedCommentId: (id) => set({ selectedCommentId: id }),

  // Conflicts
  conflicts: [],
  addConflict: (conflict) => set((state) => ({ conflicts: [...state.conflicts, conflict] })),
  resolveConflict: (conflictId, resolution, mergedContent) =>
    set((state) => {
      const conflict = state.conflicts.find((c) => c.id === conflictId)
      if (!conflict) return state

      let finalContent = ""
      if (resolution === "mine") finalContent = conflict.localContent
      else if (resolution === "theirs") finalContent = conflict.remoteContent
      else if (resolution === "merge" && mergedContent) finalContent = mergedContent

      return {
        conflicts: state.conflicts.filter((c) => c.id !== conflictId),
        docBlocks: state.docBlocks.map((b) =>
          b.id === conflict.blockId ? { ...b, content: finalContent, version: b.version + 1 } : b,
        ),
      }
    }),

  // Board strokes
  strokes: [],
  addStroke: (stroke) => set((state) => ({ strokes: [...state.strokes, stroke] })),
  addPointToStroke: (strokeId, point) =>
    set((state) => ({
      strokes: state.strokes.map((s) => (s.id === strokeId ? { ...s, points: [...s.points, point] } : s)),
    })),

  // Activity feed
  activities: [],
  addActivity: (message, userId) =>
    set((state) => ({
      activities: [
        { id: `activity-${Date.now()}-${Math.random()}`, message, timestamp: Date.now(), userId },
        ...state.activities,
      ].slice(0, 50),
    })),

  // Follow mode
  followingUserId: null,
  setFollowingUserId: (userId) => set({ followingUserId: userId }),

  // Laser pointer
  laserPointer: { x: 0, y: 0, visible: false },
  setLaserPointer: (pointer) => set({ laserPointer: pointer }),

  // Dev settings
  devSettings: { latency: 0, packetLoss: 0, forceConflict: false },
  setDevSettings: (settings) => set((state) => ({ devSettings: { ...state.devSettings, ...settings } })),

  // Typing state
  localTypingBlockId: null,
  setLocalTypingBlockId: (blockId) => set({ localTypingBlockId: blockId }),

  rightPanelTab: "activity",
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
}))
