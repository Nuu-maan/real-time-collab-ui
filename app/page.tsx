"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/layout/top-bar"
import { RightPanel } from "@/components/layout/right-panel"
import { MobilePanelDrawer } from "@/components/layout/mobile-panel-drawer"
import { LoadingScreen } from "@/components/layout/loading-screen"
import { CursorLayer } from "@/components/cursors/cursor-layer"
import { DocEditor } from "@/components/doc/doc-editor"
import { WhiteboardCanvas } from "@/components/board/whiteboard-canvas"
import { DevPanel } from "@/components/dev/dev-panel"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { useBotSimulation } from "@/lib/collab/use-bot-simulation"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

export default function CollabPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const { activeMode, setConnectionStatus, followingUserId, setFollowingUserId } = useCollabStore()

  useBotSimulation()

  useKeyboardShortcuts({
    onToggleDevPanel: () => setShowDevPanel((prev) => !prev),
    onExitFollow: () => {
      if (followingUserId) setFollowingUserId(null)
    },
  })

  useEffect(() => {
    const delay = 600 + Math.random() * 400
    const timer = setTimeout(() => {
      setIsLoading(false)
      setConnectionStatus("synced")
    }, delay)
    return () => clearTimeout(timer)
  }, [setConnectionStatus])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar onOpenPanel={() => setMobileDrawerOpen(true)} />

      <div className="flex-1 flex min-h-0">
        {/* Main content area - full width on mobile */}
        <main className="flex-1 relative overflow-hidden">
          {activeMode === "doc" ? <DocEditor /> : <WhiteboardCanvas />}
        </main>

        {/* Desktop right panel */}
        <RightPanel isLoading={isLoading} />
      </div>

      {/* Mobile drawer */}
      <MobilePanelDrawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen} />

      {/* Cursor overlay */}
      <CursorLayer />

      {/* Dev panel */}
      <DevPanel open={showDevPanel} onOpenChange={setShowDevPanel} />
    </div>
  )
}
