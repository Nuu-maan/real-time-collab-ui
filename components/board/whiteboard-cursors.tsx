"use client"

import { useEffect, useRef } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"

export function WhiteboardCursors() {
  const { users, remoteCursors, localUser } = useCollabStore()
  const cursorsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const frameRef = useRef<number | null>(null)

  // Lerp animation for smooth cursor movement
  useEffect(() => {
    const animate = () => {
      const store = useCollabStore.getState()
      const cursors = store.remoteCursors

      cursors.forEach((cursor, userId) => {
        const current = cursorsRef.current.get(userId) || { x: cursor.x, y: cursor.y }
        const lerped = {
          x: current.x + (cursor.targetX - current.x) * 0.15,
          y: current.y + (cursor.targetY - current.y) * 0.15,
        }
        cursorsRef.current.set(userId, lerped)
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  // Filter cursors for whiteboard mode only
  const visibleCursors = Array.from(remoteCursors.entries()).filter(([userId, cursor]) => {
    if (userId === localUser.id) return false
    return cursor.mode === "board"
  })

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {visibleCursors.map(([userId, cursor]) => {
        const user = users.find((u) => u.id === userId)
        if (!user) return null

        const lerpedPos = cursorsRef.current.get(userId) || { x: cursor.x, y: cursor.y }

        // Convert screen coordinates to canvas-relative
        const containerRect = document.querySelector(".bg-muted\\/20")?.getBoundingClientRect()
        if (!containerRect) return null

        const relX = lerpedPos.x - containerRect.left
        const relY = lerpedPos.y - containerRect.top

        return (
          <div
            key={userId}
            className="absolute cursor-smooth"
            style={{
              transform: `translate(${relX}px, ${relY}px)`,
            }}
          >
            {/* Cursor dot */}
            <div
              className="w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ backgroundColor: user.color }}
            />
            {/* Name label */}
            <div
              className="absolute left-2 top-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
