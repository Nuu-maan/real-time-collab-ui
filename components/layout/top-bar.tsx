"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { PresenceStack } from "@/components/presence/presence-stack"
import { Wifi, WifiOff, Loader2, PanelRight } from "lucide-react"
import type { Mode } from "@/lib/collab/types"

interface TopBarProps {
  onOpenPanel?: () => void
}

export function TopBar({ onOpenPanel }: TopBarProps) {
  const { activeMode, setActiveMode, connectionStatus } = useCollabStore()

  const handleModeChange = (value: string) => {
    setActiveMode(value as Mode)
  }

  return (
    <header className="h-12 md:h-14 border-b border-border bg-card flex items-center justify-between px-3 md:px-4 shrink-0">
      {/* Left: App name */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground tracking-tight text-sm md:text-base">Collab</span>
        <Badge variant="secondary" className="text-[10px] font-medium hidden sm:inline-flex">
          Demo
        </Badge>
      </div>

      {/* Center: Mode tabs */}
      <Tabs value={activeMode} onValueChange={handleModeChange} className="absolute left-1/2 -translate-x-1/2">
        <TabsList className="h-8 md:h-9">
          <TabsTrigger value="doc" className="text-xs md:text-sm px-3 md:px-4">
            Doc
          </TabsTrigger>
          <TabsTrigger value="board" className="text-xs md:text-sm px-3 md:px-4">
            Board
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Right: Presence + Connection + Panel button (mobile) */}
      <div className="flex items-center gap-2 md:gap-4">
        <PresenceStack />
        <ConnectionIndicator status={connectionStatus} />
        {onOpenPanel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={onOpenPanel}
            aria-label="Open sidebar"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}

function ConnectionIndicator({ status }: { status: "connecting" | "synced" | "reconnecting" }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === "synced" && (
        <>
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-muted-foreground hidden sm:inline">Synced</span>
        </>
      )}
      {status === "reconnecting" && (
        <>
          <WifiOff className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-muted-foreground hidden sm:inline">Reconnecting...</span>
        </>
      )}
      {status === "connecting" && (
        <>
          <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
          <span className="text-muted-foreground hidden sm:inline">Connecting...</span>
        </>
      )}
    </div>
  )
}
