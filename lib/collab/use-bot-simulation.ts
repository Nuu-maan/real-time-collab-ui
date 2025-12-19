"use client"

import { useEffect, useRef } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { eventBus } from "@/lib/collab/event-bus"
import { botUsers } from "@/lib/collab/bot-users"
import type { Mode, Stroke, CursorPosition, Comment } from "@/lib/collab/types"

// Random text snippets for bot typing
const textSnippets = [
  "Great idea!",
  "What do you think about this approach?",
  "Let me add some details here.",
  "I'll update this section.",
  "This needs more work.",
  "Perfect, let's continue.",
  "Adding my thoughts...",
  "Consider this alternative.",
]

const commentSnippets = [
  "Nice work here!",
  "Can we discuss this?",
  "I have a question about this.",
  "Love this idea!",
  "Should we revise this?",
  "Let's circle back on this.",
  "Looks good to me.",
  "Can you clarify this point?",
]

// Lerp helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function useBotSimulation() {
  const {
    connectionStatus,
    activeMode,
    docBlocks,
    updatePresence,
    updateRemoteCursor,
    updateBlock,
    addConflict,
    addStroke,
    addPointToStroke,
    addActivity,
    devSettings,
    localTypingBlockId,
    addComment,
    updateSelection,
  } = useCollabStore()

  const botsRef = useRef<
    Map<
      string,
      {
        targetX: number
        targetY: number
        currentX: number
        currentY: number
        mode: Mode
        isActive: boolean
        currentStrokeId: string | null
      }
    >
  >(new Map())

  const animationRef = useRef<number | null>(null)

  // Initialize bots
  useEffect(() => {
    botUsers.forEach((bot) => {
      botsRef.current.set(bot.id, {
        targetX: 300 + Math.random() * 400,
        targetY: 200 + Math.random() * 300,
        currentX: 300 + Math.random() * 400,
        currentY: 200 + Math.random() * 300,
        mode: "doc",
        isActive: true,
        currentStrokeId: null,
      })

      updatePresence(bot.id, {
        activeMode: "doc",
        isTyping: false,
      })
    })
  }, [updatePresence])

  // Cursor animation loop
  useEffect(() => {
    if (connectionStatus !== "synced") return

    const animate = () => {
      botsRef.current.forEach((botState, botId) => {
        // Lerp cursor position
        botState.currentX = lerp(botState.currentX, botState.targetX, 0.08)
        botState.currentY = lerp(botState.currentY, botState.targetY, 0.08)

        const cursor: CursorPosition = {
          x: botState.currentX,
          y: botState.currentY,
          mode: botState.mode,
        }

        updateRemoteCursor(botId, cursor)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [connectionStatus, updateRemoteCursor])

  // Bot behavior simulation
  useEffect(() => {
    if (connectionStatus !== "synced") return

    const intervals: NodeJS.Timeout[] = []

    botUsers.forEach((bot, index) => {
      // Move cursor randomly
      const cursorInterval = setInterval(
        () => {
          const botState = botsRef.current.get(bot.id)
          if (!botState) return

          // Random new target position
          botState.targetX = 100 + Math.random() * 700
          botState.targetY = 100 + Math.random() * 400

          // Update block focus for doc mode
          if (botState.mode === "doc") {
            const blocks = useCollabStore.getState().docBlocks
            const randomBlock = blocks[Math.floor(Math.random() * blocks.length)]
            const cursor: CursorPosition = {
              x: botState.targetX,
              y: botState.targetY,
              mode: "doc",
              blockId: randomBlock.id,
            }
            updateRemoteCursor(bot.id, cursor)

            updateSelection(bot.id, {
              userId: bot.id,
              blockId: randomBlock.id,
              mode: "doc",
            })
            eventBus.emit({
              type: "selection:update",
              payload: {
                userId: bot.id,
                blockId: randomBlock.id,
                mode: "doc",
              },
            })
          }
        },
        2000 + index * 500,
      )
      intervals.push(cursorInterval)

      // Occasionally switch modes
      const modeInterval = setInterval(
        () => {
          const botState = botsRef.current.get(bot.id)
          if (!botState) return

          // 20% chance to switch modes
          if (Math.random() < 0.2) {
            const newMode: Mode = botState.mode === "doc" ? "board" : "doc"
            botState.mode = newMode
            updatePresence(bot.id, { activeMode: newMode })
            addActivity(`${bot.name} switched to ${newMode === "doc" ? "Doc" : "Whiteboard"}`)
          }
        },
        8000 + index * 2000,
      )
      intervals.push(modeInterval)

      // Doc mode: typing simulation
      const typingInterval = setInterval(
        () => {
          const botState = botsRef.current.get(bot.id)
          if (!botState || botState.mode !== "doc") return

          // 30% chance to type
          if (Math.random() < 0.3) {
            const blocks = useCollabStore.getState().docBlocks
            const randomBlock = blocks[Math.floor(Math.random() * blocks.length)]
            const { devSettings, localTypingBlockId } = useCollabStore.getState()

            // Start typing
            updatePresence(bot.id, { isTyping: true })
            addActivity(`${bot.name} is typing`)

            setTimeout(
              () => {
                // Check for conflict condition
                const shouldConflict =
                  devSettings.forceConflict || (localTypingBlockId === randomBlock.id && Math.random() < 0.3)

                if (shouldConflict && localTypingBlockId === randomBlock.id) {
                  // Create a conflict
                  const newContent = textSnippets[Math.floor(Math.random() * textSnippets.length)]
                  addConflict({
                    id: `conflict-${Date.now()}`,
                    blockId: randomBlock.id,
                    localContent: randomBlock.content,
                    remoteContent: newContent,
                    remoteUserId: bot.id,
                    timestamp: Date.now(),
                  })
                  addActivity(`Conflict detected in Paragraph ${blocks.findIndex((b) => b.id === randomBlock.id) + 1}`)
                } else {
                  // Normal edit
                  const newContent = textSnippets[Math.floor(Math.random() * textSnippets.length)]
                  updateBlock(randomBlock.id, newContent)
                }

                updatePresence(bot.id, { isTyping: false })
              },
              1500 + Math.random() * 1000,
            )
          }
        },
        5000 + index * 1500,
      )
      intervals.push(typingInterval)

      const commentInterval = setInterval(
        () => {
          const botState = botsRef.current.get(bot.id)
          if (!botState) return

          // 15% chance to add a comment
          if (Math.random() < 0.15) {
            const commentText = commentSnippets[Math.floor(Math.random() * commentSnippets.length)]

            let comment: Comment

            if (botState.mode === "doc") {
              const blocks = useCollabStore.getState().docBlocks
              const randomBlock = blocks[Math.floor(Math.random() * blocks.length)]
              comment = {
                id: `comment-${Date.now()}-${Math.random()}`,
                authorId: bot.id,
                mode: "doc",
                createdAt: Date.now(),
                text: commentText,
                resolved: false,
                blockId: randomBlock.id,
              }
            } else {
              comment = {
                id: `comment-${Date.now()}-${Math.random()}`,
                authorId: bot.id,
                mode: "board",
                createdAt: Date.now(),
                text: commentText,
                resolved: false,
                x: 100 + Math.random() * 600,
                y: 100 + Math.random() * 400,
              }
            }

            addComment(comment)
            addActivity(`${bot.name} added a comment`)

            eventBus.emit({
              type: "comment:add",
              payload: comment,
            })
          }
        },
        12000 + index * 3000,
      )
      intervals.push(commentInterval)

      // Board mode: drawing simulation
      const drawingInterval = setInterval(
        () => {
          const botState = botsRef.current.get(bot.id)
          if (!botState || botState.mode !== "board") return

          // 40% chance to draw
          if (Math.random() < 0.4) {
            const strokeId = `stroke-bot-${Date.now()}-${Math.random()}`
            const startX = 100 + Math.random() * 600
            const startY = 100 + Math.random() * 400

            const newStroke: Stroke = {
              id: strokeId,
              userId: bot.id,
              color: bot.color,
              points: [{ x: startX, y: startY }],
              tool: "pen",
            }

            addStroke(newStroke)
            botState.currentStrokeId = strokeId
            addActivity(`${bot.name} drew a stroke`)

            // Add points over time
            let pointCount = 0
            const maxPoints = 5 + Math.floor(Math.random() * 10)
            let lastX = startX
            let lastY = startY

            const pointInterval = setInterval(() => {
              if (pointCount >= maxPoints) {
                clearInterval(pointInterval)
                botState.currentStrokeId = null
                return
              }

              // Random walk
              lastX += (Math.random() - 0.5) * 50
              lastY += (Math.random() - 0.5) * 50

              addPointToStroke(strokeId, { x: lastX, y: lastY })
              pointCount++
            }, 50)
          }
        },
        4000 + index * 1000,
      )
      intervals.push(drawingInterval)
    })

    return () => {
      intervals.forEach(clearInterval)
    }
  }, [
    connectionStatus,
    updatePresence,
    updateBlock,
    addConflict,
    addStroke,
    addPointToStroke,
    addActivity,
    updateRemoteCursor,
    addComment,
    updateSelection,
  ])

  // Apply dev settings to event bus
  useEffect(() => {
    eventBus.setLatency(devSettings.latency)
    eventBus.setPacketLoss(devSettings.packetLoss)
  }, [devSettings])
}
