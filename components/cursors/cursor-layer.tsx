"use client"

import { useEffect, useRef } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"

export function CursorLayer() {
  const { users, remoteCursors, activeMode, laserPointer, localUser } = useCollabStore()
  const frameRef = useRef<number | null>(null)
  const cursorsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

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

  // Filter cursors for current mode
  const visibleCursors = Array.from(remoteCursors.entries()).filter(([userId, cursor]) => {
    if (userId === localUser.id) return false
    return cursor.mode === activeMode
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {visibleCursors.map(([userId, cursor]) => {
        const user = users.find((u) => u.id === userId)
        if (!user) return null

        const lerpedPos = cursorsRef.current.get(userId) || { x: cursor.x, y: cursor.y }

        return (
          <div
            key={userId}
            className="absolute cursor-smooth"
            style={{
              transform: `translate(${lerpedPos.x}px, ${lerpedPos.y}px)`,
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              className="drop-shadow-sm"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
            >
              <path d="M0.5 0.5L15.5 11.5L8 13L5 19.5L0.5 0.5Z" fill={user.color} stroke="white" strokeWidth="1" />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        )
      })}

      {/* Laser pointer */}
      {laserPointer.visible && (
        <div
          className="laser-pointer absolute w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: laserPointer.x,
            top: laserPointer.y,
            backgroundColor: localUser.color,
            opacity: 0.6,
          }}
        />
      )}
    </div>
  )
}
