"use client"

import type React from "react"
import { useRef, useEffect, useCallback, useState } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { eventBus } from "@/lib/collab/event-bus"
import { WhiteboardToolbar } from "@/components/board/whiteboard-toolbar"
import { WhiteboardCursors } from "@/components/board/whiteboard-cursors"
import { BoardCommentPins } from "@/components/comments/board-comment-pins"
import { CommentDialog } from "@/components/comments/comment-dialog"
import type { Stroke } from "@/lib/collab/types"

type Tool = "pen" | "eraser" | "comment"

export function WhiteboardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    strokes,
    addStroke,
    addPointToStroke,
    localUser,
    setLocalCursor,
    setLaserPointer,
    addActivity,
    addComment,
    setRightPanelTab,
  } = useCollabStore()

  const [tool, setTool] = useState<Tool>("pen")
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null)
  const [isLaserActive, setIsLaserActive] = useState(false)

  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      redrawCanvas()
    }

    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  useEffect(() => {
    redrawCanvas()
  }, [strokes])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = stroke.tool === "eraser" ? "#f5f5f5" : stroke.color
      ctx.lineWidth = stroke.tool === "eraser" ? 20 : 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })
  }, [strokes])

  const getCanvasPoint = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isLaserActive) return

      const point = getCanvasPoint(e)
      if (!point) return

      if (tool === "comment") {
        setCommentPosition(point)
        setCommentDialogOpen(true)
        return
      }

      setIsDrawing(true)

      const strokeId = `stroke-${Date.now()}-${Math.random()}`
      const newStroke: Stroke = {
        id: strokeId,
        userId: localUser.id,
        color: localUser.color,
        points: [point],
        tool: tool as "pen" | "eraser",
      }

      addStroke(newStroke)
      setCurrentStrokeId(strokeId)

      eventBus.emit({
        type: "board:stroke",
        payload: newStroke,
      })
    },
    [tool, localUser, addStroke, getCanvasPoint, isLaserActive],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const cursor = {
        x: e.clientX,
        y: e.clientY,
        mode: "board" as const,
      }

      setLocalCursor(cursor)

      eventBus.emit({
        type: "cursor:update",
        payload: { userId: localUser.id, cursor },
      })

      if (isLaserActive) {
        setLaserPointer({
          x: e.clientX,
          y: e.clientY,
          visible: true,
        })
        return
      }

      if (!isDrawing || !currentStrokeId || tool === "comment") return

      const point = getCanvasPoint(e)
      if (!point) return

      addPointToStroke(currentStrokeId, point)

      eventBus.emit({
        type: "board:stroke:point",
        payload: { strokeId: currentStrokeId, point },
      })
    },
    [
      isDrawing,
      currentStrokeId,
      localUser,
      setLocalCursor,
      addPointToStroke,
      getCanvasPoint,
      isLaserActive,
      setLaserPointer,
      tool,
    ],
  )

  const handlePointerUp = useCallback(() => {
    if (isDrawing && currentStrokeId) {
      addActivity(tool === "eraser" ? "You erased" : "You drew a stroke", localUser.id)
    }
    setIsDrawing(false)
    setCurrentStrokeId(null)
  }, [isDrawing, currentStrokeId, tool, localUser.id, addActivity])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        setIsLaserActive(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsLaserActive(false)
        setLaserPointer({ x: 0, y: 0, visible: false })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [setLaserPointer])

  const handleCommentSubmit = useCallback(
    (text: string) => {
      if (!commentPosition || !text.trim()) return

      const comment = {
        id: `comment-${Date.now()}-${Math.random()}`,
        authorId: localUser.id,
        mode: "board" as const,
        createdAt: Date.now(),
        text: text.trim(),
        resolved: false,
        x: commentPosition.x,
        y: commentPosition.y,
      }

      addComment(comment)
      addActivity(`${localUser.name} added a comment`, localUser.id)
      setRightPanelTab("comments")

      eventBus.emit({
        type: "comment:add",
        payload: comment,
      })

      setCommentDialogOpen(false)
      setCommentPosition(null)
      setTool("pen")
    },
    [commentPosition, localUser, addComment, addActivity, setRightPanelTab],
  )

  return (
    <div ref={containerRef} className="h-full w-full relative bg-muted/20 touch-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{
          cursor: isLaserActive
            ? "crosshair"
            : tool === "eraser"
              ? "cell"
              : tool === "comment"
                ? "crosshair"
                : "crosshair",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      <BoardCommentPins />
      <WhiteboardCursors />
      <WhiteboardToolbar tool={tool} onToolChange={setTool} isLaserActive={isLaserActive} />

      {/* Laser hint - hidden on mobile */}
      {!isLaserActive && (
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded border border-border hidden md:block">
          Hold <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">Space</kbd> for laser
        </div>
      )}

      <CommentDialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen} onSubmit={handleCommentSubmit} />
    </div>
  )
}
