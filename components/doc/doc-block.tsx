"use client"

import type React from "react"
import { useRef, useCallback, useEffect, useState, useMemo, memo } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"
import type { DocBlock as DocBlockType, BlockType } from "@/lib/collab/types"
import { eventBus } from "@/lib/collab/event-bus"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MessageSquarePlus, Type, Heading1, Code } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DocBlockProps {
  block: DocBlockType
  index: number
  onChange: (blockId: string, content: string) => void
  onFocus: (blockId: string) => void
  onBlur: () => void
  onAddComment: (blockId: string) => void
}

export const DocBlock = memo(function DocBlock({
  block,
  index,
  onChange,
  onFocus,
  onBlur,
  onAddComment,
}: DocBlockProps) {
  const {
    users,
    remoteCursors,
    presences,
    localTypingBlockId,
    selections,
    comments,
    localUser,
    updateBlockType,
    setSelectedCommentId,
    setRightPanelTab,
  } = useCollabStore()
  const contentRef = useRef<HTMLDivElement>(null)
  const [localContent, setLocalContent] = useState(block.content)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent === "") {
      contentRef.current.textContent = block.content
    }
  }, [])

  useEffect(() => {
    if (localTypingBlockId !== block.id) {
      setLocalContent(block.content)
      if (contentRef.current && contentRef.current.textContent !== block.content) {
        contentRef.current.textContent = block.content
      }
    }
  }, [block.content, block.id, localTypingBlockId])

  const remoteUsersInBlock = useMemo(() => {
    return Array.from(remoteCursors.entries())
      .filter(([userId, cursor]) => {
        return cursor.mode === "doc" && cursor.blockId === block.id
      })
      .map(([userId]) => users.find((u) => u.id === userId))
      .filter(Boolean)
  }, [remoteCursors, block.id, users])

  const typingUsers = useMemo(() => {
    return remoteUsersInBlock.filter((user) => {
      if (!user) return false
      const presence = presences.get(user.id)
      return presence?.isTyping
    })
  }, [remoteUsersInBlock, presences])

  const selectingUsers = useMemo(() => {
    return Array.from(selections.entries())
      .filter(([userId, sel]) => sel.blockId === block.id && userId !== localUser.id)
      .map(([userId]) => users.find((u) => u.id === userId))
      .filter(Boolean)
  }, [selections, block.id, users, localUser.id])

  const blockComments = useMemo(() => {
    return comments.filter((c) => c.mode === "doc" && c.blockId === block.id && !c.resolved)
  }, [comments, block.id])

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const content = e.currentTarget.textContent || ""
      setLocalContent(content)
      onChange(block.id, content)
    },
    [block.id, onChange],
  )

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    onFocus(block.id)
  }, [block.id, onFocus])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    onBlur()
  }, [onBlur])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
    }
  }, [])

  const handleTypeChange = useCallback(
    (type: BlockType) => {
      updateBlockType(block.id, type)
      eventBus.emit({
        type: "doc:block-type",
        payload: { blockId: block.id, type, userId: localUser.id },
      })
    },
    [block.id, updateBlockType, localUser.id],
  )

  const handleCommentClick = useCallback(() => {
    if (blockComments.length > 0) {
      setSelectedCommentId(blockComments[0].id)
      setRightPanelTab("comments")
    }
  }, [blockComments, setSelectedCommentId, setRightPanelTab])

  const isBeingEditedRemotely = typingUsers.length > 0
  const primaryRemoteUser = typingUsers[0]
  const primarySelectingUser = selectingUsers[0]

  const firstComment = blockComments[0]
  const firstCommentAuthor = firstComment ? users.find((u) => u.id === firstComment.authorId) : null

  return (
    <div id={`block-${block.id}`} className="relative group">
      {/* Block number indicator - hidden on mobile */}
      <div className="absolute -left-8 top-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono hidden md:block">
        {index + 1}
      </div>

      {/* Remote user indicators */}
      {remoteUsersInBlock.length > 0 && (
        <div
          className="absolute -left-1.5 md:-left-2 top-0 bottom-0 w-0.5 rounded-full"
          style={{ backgroundColor: remoteUsersInBlock[0]?.color }}
        />
      )}

      {selectingUsers.length > 0 && (
        <>
          <div
            className="absolute inset-0 rounded pointer-events-none opacity-10"
            style={{ backgroundColor: primarySelectingUser?.color }}
          />
          <div
            className="absolute -top-5 right-0 text-[10px] px-1.5 py-0.5 rounded font-medium text-white z-10"
            style={{ backgroundColor: primarySelectingUser?.color }}
          >
            {primarySelectingUser?.name}
          </div>
        </>
      )}

      {/* Content editable block */}
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "py-2 px-2 rounded text-foreground leading-relaxed outline-none transition-colors min-h-[44px] flex items-center",
          "focus:bg-muted/50",
          "hover:bg-muted/30",
          isBeingEditedRemotely && "ring-1 ring-offset-1",
          block.type === "heading" && "text-lg md:text-xl font-semibold",
          block.type === "code" && "font-mono text-sm bg-muted/50 px-3 py-2 overflow-x-auto",
          selectingUsers.length > 0 && "ring-1 ring-opacity-30",
        )}
        style={{
          ringColor: primaryRemoteUser?.color || primarySelectingUser?.color,
        }}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder="Type something..."
        aria-label={`${block.type === "heading" ? "Heading" : block.type === "code" ? "Code" : "Paragraph"} ${index + 1}`}
      />

      {/* Type toggle buttons - hidden on mobile, shown on hover on desktop */}
      {(isFocused || false) && (
        <div className="absolute -left-24 top-1/2 -translate-y-1/2 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex">
          <Button
            variant={block.type === "paragraph" ? "secondary" : "ghost"}
            size="icon"
            className="h-6 w-6"
            onClick={() => handleTypeChange("paragraph")}
            aria-label="Paragraph"
          >
            <Type className="h-3 w-3" />
          </Button>
          <Button
            variant={block.type === "heading" ? "secondary" : "ghost"}
            size="icon"
            className="h-6 w-6"
            onClick={() => handleTypeChange("heading")}
            aria-label="Heading"
          >
            <Heading1 className="h-3 w-3" />
          </Button>
          <Button
            variant={block.type === "code" ? "secondary" : "ghost"}
            size="icon"
            className="h-6 w-6"
            onClick={() => handleTypeChange("code")}
            aria-label="Code"
          >
            <Code className="h-3 w-3" />
          </Button>
        </div>
      )}

      {blockComments.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={handleCommentClick}
              className="absolute -right-1 md:-right-2 top-1 translate-x-full w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-medium flex items-center justify-center hover:bg-amber-600 transition-colors"
              aria-label={`${blockComments.length} comment${blockComments.length > 1 ? "s" : ""}`}
            >
              {blockComments.length}
            </button>
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="w-56 p-2">
            <div className="flex items-start gap-2">
              <img
                src={firstCommentAuthor?.avatar || "/placeholder.svg?height=20&width=20&query=avatar"}
                alt=""
                className="w-5 h-5 rounded-full shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">{firstCommentAuthor?.name || "Unknown"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(firstComment.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{firstComment.text}</p>
                {blockComments.length > 1 && (
                  <p className="text-[10px] text-muted-foreground mt-1">+{blockComments.length - 1} more</p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {blockComments.length === 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-1 md:-right-2 top-1 translate-x-full h-7 w-7 md:h-6 md:w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={() => onAddComment(block.id)}
          aria-label="Add comment"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Typing indicator - simplified, less cluttered */}
      {isBeingEditedRemotely && (
        <div
          className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full ml-6 md:ml-8 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
          style={{ backgroundColor: primaryRemoteUser?.color }}
        >
          <span className="hidden md:inline">{primaryRemoteUser?.name} is typing...</span>
          <span className="md:hidden">typing...</span>
        </div>
      )}
    </div>
  )
})
