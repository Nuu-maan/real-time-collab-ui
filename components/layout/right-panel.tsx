"use client"

import { useMemo, useCallback } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ConflictPanel } from "@/components/doc/conflict-panel"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Check, Trash2, RotateCcw } from "lucide-react"
import { eventBus } from "@/lib/collab/event-bus"

interface RightPanelProps {
  isLoading?: boolean
}

export function RightPanel({ isLoading }: RightPanelProps) {
  if (isLoading) {
    return (
      <aside className="w-64 border-l border-border bg-card flex-col shrink-0 hidden md:flex">
        <div className="p-4">
          <Skeleton className="h-4 w-20 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 border-l border-border bg-card flex-col shrink-0 hidden md:flex">
      <RightPanelContent />
    </aside>
  )
}

export function RightPanelContent() {
  const {
    activities,
    conflicts,
    users,
    comments,
    docBlocks,
    rightPanelTab,
    setRightPanelTab,
    selectedCommentId,
    setSelectedCommentId,
    resolveComment,
    deleteComment,
    localUser,
    addActivity,
  } = useCollabStore()

  const handleResolve = useCallback(
    (commentId: string, resolved: boolean) => {
      resolveComment(commentId, resolved)
      addActivity(`${localUser.name} ${resolved ? "resolved" : "reopened"} a comment`, localUser.id)
      eventBus.emit({
        type: "comment:resolve",
        payload: { commentId, resolved },
      })
    },
    [resolveComment, localUser, addActivity],
  )

  const handleDelete = useCallback(
    (commentId: string) => {
      deleteComment(commentId)
      addActivity(`${localUser.name} deleted a comment`, localUser.id)
      eventBus.emit({
        type: "comment:delete",
        payload: { commentId },
      })
      if (selectedCommentId === commentId) {
        setSelectedCommentId(null)
      }
    },
    [deleteComment, localUser, addActivity, selectedCommentId, setSelectedCommentId],
  )

  const handlePreviewClick = useCallback((blockId: string) => {
    const blockEl = document.getElementById(`block-${blockId}`)
    if (blockEl) {
      blockEl.scrollIntoView({ behavior: "smooth", block: "center" })
      blockEl.focus()
    }
  }, [])

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
      return b.createdAt - a.createdAt
    })
  }, [comments])

  const unresolvedCount = comments.filter((c) => !c.resolved).length

  return (
    <div className="flex flex-col h-full">
      {/* Conflicts section */}
      {conflicts.length > 0 && (
        <>
          <ConflictPanel />
          <Separator />
        </>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button
          className={cn(
            "flex-1 px-2 py-2.5 text-xs font-medium transition-colors min-h-[44px]",
            rightPanelTab === "activity"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setRightPanelTab("activity")}
        >
          Activity
        </button>
        <button
          className={cn(
            "flex-1 px-2 py-2.5 text-xs font-medium transition-colors relative min-h-[44px]",
            rightPanelTab === "comments"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setRightPanelTab("comments")}
        >
          Comments
          {unresolvedCount > 0 && (
            <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
              {unresolvedCount}
            </span>
          )}
        </button>
        <button
          className={cn(
            "flex-1 px-2 py-2.5 text-xs font-medium transition-colors min-h-[44px]",
            rightPanelTab === "preview"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setRightPanelTab("preview")}
        >
          Preview
        </button>
      </div>

      {/* Activity tab */}
      {rightPanelTab === "activity" && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet</p>
            ) : (
              activities.slice(0, 20).map((activity) => (
                <div key={activity.id} className="text-xs">
                  <p className="text-foreground leading-relaxed">{activity.message}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}

      {/* Comments tab */}
      {rightPanelTab === "comments" && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {sortedComments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet</p>
            ) : (
              sortedComments.map((comment) => {
                const author = users.find((u) => u.id === comment.authorId)
                const isSelected = selectedCommentId === comment.id

                return (
                  <div
                    key={comment.id}
                    className={cn(
                      "p-2 rounded-lg border transition-colors cursor-pointer",
                      comment.resolved ? "opacity-50 bg-muted/20" : "bg-card",
                      isSelected ? "border-foreground" : "border-border hover:border-muted-foreground",
                    )}
                    onClick={() => {
                      setSelectedCommentId(comment.id)
                      if (comment.blockId) {
                        handlePreviewClick(comment.blockId)
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={author?.avatar || "/placeholder.svg?height=20&width=20&query=avatar"}
                        alt=""
                        className="w-5 h-5 rounded-full shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs font-medium">{author?.name || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn("text-xs mt-0.5 leading-relaxed", comment.resolved && "line-through")}>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResolve(comment.id, !comment.resolved)
                        }}
                        aria-label={comment.resolved ? "Reopen" : "Resolve"}
                      >
                        {comment.resolved ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(comment.id)
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      )}

      {/* Preview tab */}
      {rightPanelTab === "preview" && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {docBlocks.map((block) => (
              <button
                key={block.id}
                className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px]"
                onClick={() => handlePreviewClick(block.id)}
              >
                {block.type === "heading" && (
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {block.content || <span className="text-muted-foreground italic">Empty heading</span>}
                  </p>
                )}
                {block.type === "paragraph" && (
                  <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                    {block.content || <span className="text-muted-foreground italic">Empty paragraph</span>}
                  </p>
                )}
                {block.type === "code" && (
                  <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-x-auto max-w-full">
                    {block.content || <span className="text-muted-foreground italic">Empty code</span>}
                  </pre>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
