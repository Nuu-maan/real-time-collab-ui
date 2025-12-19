"use client"

import { useMemo, memo } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export const BoardCommentPins = memo(function BoardCommentPins() {
  const { comments, users, selectedCommentId, setSelectedCommentId, setRightPanelTab } = useCollabStore()

  const boardComments = useMemo(() => {
    return comments.filter((c) => c.mode === "board" && c.x !== undefined && c.y !== undefined)
  }, [comments])

  if (boardComments.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {boardComments.map((comment) => {
        const author = users.find((u) => u.id === comment.authorId)
        const isSelected = selectedCommentId === comment.id

        return (
          <Popover key={comment.id}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "absolute pointer-events-auto w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white text-[10px] font-bold shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white",
                  comment.resolved && "opacity-50",
                  isSelected && "ring-2 ring-white scale-110",
                )}
                style={{
                  left: comment.x,
                  top: comment.y,
                  backgroundColor: author?.color || "#6b7280",
                }}
                onClick={() => {
                  setSelectedCommentId(comment.id)
                  setRightPanelTab("comments")
                }}
                aria-label={`Comment by ${author?.name || "Unknown"}`}
              >
                {author?.name?.charAt(0) || "?"}
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-52 p-2">
              <div className="flex items-start gap-2">
                <img
                  src={author?.avatar || "/placeholder.svg?height=20&width=20&query=avatar"}
                  alt=""
                  className="w-5 h-5 rounded-full shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{author?.name || "Unknown"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{comment.text}</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )
      })}
    </div>
  )
})
