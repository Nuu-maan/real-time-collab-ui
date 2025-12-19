"use client"

import type React from "react"
import { useRef, useCallback, useEffect, useState } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { eventBus } from "@/lib/collab/event-bus"
import { DocBlock } from "@/components/doc/doc-block"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CommentDialog } from "@/components/comments/comment-dialog"
import { throttle } from "@/lib/utils"

export function DocEditor() {
  const {
    docBlocks,
    localUser,
    setLocalCursor,
    followingUserId,
    remoteCursors,
    addActivity,
    setLocalTypingBlockId,
    setLocalSelection,
    addComment,
    setRightPanelTab,
  } = useCollabStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [commentBlockId, setCommentBlockId] = useState<string | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const cursor = {
        x: e.clientX,
        y: e.clientY,
        mode: "doc" as const,
      }

      setLocalCursor(cursor)

      eventBus.emit({
        type: "cursor:update",
        payload: { userId: localUser.id, cursor },
      })
    },
    [localUser.id, setLocalCursor],
  )

  useEffect(() => {
    if (!followingUserId || !scrollRef.current) return

    const cursor = remoteCursors.get(followingUserId)
    if (!cursor || cursor.mode !== "doc" || !cursor.blockId) return

    const blockElement = document.getElementById(`block-${cursor.blockId}`)
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [followingUserId, remoteCursors])

  const handleBlockChange = useCallback(
    (blockId: string, content: string) => {
      const store = useCollabStore.getState()
      const block = store.docBlocks.find((b) => b.id === blockId)
      if (!block) return

      store.updateBlock(blockId, content)

      eventBus.emit({
        type: "doc:op",
        payload: {
          blockId,
          content,
          version: block.version + 1,
          userId: localUser.id,
        },
      })
    },
    [localUser.id],
  )

  const broadcastSelection = useCallback(
    throttle((blockId: string) => {
      eventBus.emit({
        type: "selection:update",
        payload: {
          userId: localUser.id,
          blockId,
          mode: "doc",
        },
      })
    }, 200),
    [localUser.id],
  )

  const handleBlockFocus = useCallback(
    (blockId: string) => {
      setLocalTypingBlockId(blockId)
      setLocalSelection(blockId)
      addActivity("You started editing", localUser.id)

      broadcastSelection(blockId)

      eventBus.emit({
        type: "presence:update",
        payload: {
          userId: localUser.id,
          presence: { isTyping: true },
        },
      })
    },
    [localUser.id, setLocalTypingBlockId, setLocalSelection, addActivity, broadcastSelection],
  )

  const handleBlockBlur = useCallback(() => {
    setLocalTypingBlockId(null)
    setLocalSelection(null)

    eventBus.emit({
      type: "presence:update",
      payload: {
        userId: localUser.id,
        presence: { isTyping: false },
      },
    })
  }, [localUser.id, setLocalTypingBlockId, setLocalSelection])

  const handleAddComment = useCallback((blockId: string) => {
    setCommentBlockId(blockId)
    setCommentDialogOpen(true)
  }, [])

  const handleCommentSubmit = useCallback(
    (text: string) => {
      if (!commentBlockId || !text.trim()) return

      const comment = {
        id: `comment-${Date.now()}-${Math.random()}`,
        authorId: localUser.id,
        mode: "doc" as const,
        createdAt: Date.now(),
        text: text.trim(),
        resolved: false,
        blockId: commentBlockId,
      }

      addComment(comment)
      addActivity(`${localUser.name} added a comment`, localUser.id)
      setRightPanelTab("comments")

      eventBus.emit({
        type: "comment:add",
        payload: comment,
      })

      setCommentDialogOpen(false)
      setCommentBlockId(null)
    },
    [commentBlockId, localUser, addComment, addActivity, setRightPanelTab],
  )

  return (
    <div ref={containerRef} className="h-full w-full" onMouseMove={handleMouseMove}>
      <ScrollArea className="h-full" ref={scrollRef}>
        <div className="max-w-2xl mx-auto py-6 md:py-12 px-4 md:px-8">
          <div className="space-y-1">
            {docBlocks.map((block, index) => (
              <DocBlock
                key={block.id}
                block={block}
                index={index}
                onChange={handleBlockChange}
                onFocus={handleBlockFocus}
                onBlur={handleBlockBlur}
                onAddComment={handleAddComment}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <CommentDialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen} onSubmit={handleCommentSubmit} />
    </div>
  )
}
