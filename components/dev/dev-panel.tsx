"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { Terminal, Zap, WifiOff, AlertTriangle } from "lucide-react"

interface DevPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DevPanel({ open, onOpenChange }: DevPanelProps) {
  const {
    devSettings,
    setDevSettings,
    connectionStatus,
    setConnectionStatus,
    addActivity,
    docBlocks,
    addConflict,
    localUser,
    users,
  } = useCollabStore()

  const handleLatencyChange = (value: number[]) => {
    setDevSettings({ latency: value[0] })
  }

  const handlePacketLossChange = (value: number[]) => {
    setDevSettings({ packetLoss: value[0] / 100 })
  }

  const handleForceConflictChange = (checked: boolean) => {
    setDevSettings({ forceConflict: checked })
  }

  const simulateReconnect = () => {
    setConnectionStatus("reconnecting")
    addActivity("Connection lost, reconnecting...")

    setTimeout(() => {
      setConnectionStatus("synced")
      addActivity("Connection restored")
    }, 2000)
  }

  const triggerConflict = () => {
    const randomBlock = docBlocks[Math.floor(Math.random() * docBlocks.length)]
    const botUser = users.find((u) => u.isBot)
    if (!botUser) return

    addConflict({
      id: `conflict-${Date.now()}`,
      blockId: randomBlock.id,
      localContent: randomBlock.content,
      remoteContent: "This is a simulated conflict from the Dev Panel.",
      remoteUserId: botUser.id,
      timestamp: Date.now(),
    })

    addActivity(`Dev: Triggered conflict in Paragraph ${docBlocks.findIndex((b) => b.id === randomBlock.id) + 1}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Terminal className="h-4 w-4" />
            Dev Panel
            <Badge variant="secondary" className="text-[10px] ml-auto">
              Cmd+K
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Connection Status */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Connection</h4>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Status</span>
              <Badge
                variant={connectionStatus === "synced" ? "default" : "secondary"}
                className={
                  connectionStatus === "synced"
                    ? "bg-emerald-500 text-white"
                    : connectionStatus === "reconnecting"
                      ? "bg-amber-500 text-white"
                      : ""
                }
              >
                {connectionStatus}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Network Simulation */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Network Simulation
            </h4>

            <div className="space-y-4">
              {/* Latency */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" />
                    Latency
                  </Label>
                  <span className="text-xs text-muted-foreground font-mono">{devSettings.latency}ms</span>
                </div>
                <Slider
                  value={[devSettings.latency]}
                  onValueChange={handleLatencyChange}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Packet Loss */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm flex items-center gap-2">
                    <WifiOff className="h-3.5 w-3.5" />
                    Packet Loss
                  </Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {Math.round(devSettings.packetLoss * 100)}%
                  </span>
                </div>
                <Slider
                  value={[devSettings.packetLoss * 100]}
                  onValueChange={handlePacketLossChange}
                  min={0}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Conflict Simulation */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Conflict Simulation
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Force conflicts
                </Label>
                <Switch checked={devSettings.forceConflict} onCheckedChange={handleForceConflictChange} />
              </div>

              <p className="text-xs text-muted-foreground">
                When enabled, bot edits on blocks you're typing will always create conflicts.
              </p>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Actions</h4>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9 bg-transparent"
                onClick={simulateReconnect}
              >
                <WifiOff className="h-3.5 w-3.5 mr-2" />
                Simulate Reconnect
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-sm h-9 bg-transparent"
                onClick={triggerConflict}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                Trigger Conflict
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
