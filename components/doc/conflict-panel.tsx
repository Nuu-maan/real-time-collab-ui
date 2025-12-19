"use client"

import { useState } from "react"
import { useCollabStore } from "@/lib/store/use-collab-store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export function ConflictPanel() {
  const { conflicts, resolveConflict, users, docBlocks, addActivity, localUser } = useCollabStore()
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [activeConflictId, setActiveConflictId] = useState<string | null>(null)
  const [mergedContent, setMergedContent] = useState("")

  const activeConflict = conflicts.find((c) => c.id === activeConflictId)
  const remoteUser = activeConflict ? users.find((u) => u.id === activeConflict.remoteUserId) : null

  const handleKeepMine = (conflictId: string) => {
    resolveConflict(conflictId, "mine")
    addActivity("You kept your changes", localUser.id)
  }

  const handleAcceptTheirs = (conflictId: string) => {
    resolveConflict(conflictId, "theirs")
    const conflict = conflicts.find((c) => c.id === conflictId)
    const user = conflict ? users.find((u) => u.id === conflict.remoteUserId) : null
    addActivity(`You accepted ${user?.name || "their"}'s changes`, localUser.id)
  }

  const handleOpenMerge = (conflictId: string) => {
    const conflict = conflicts.find((c) => c.id === conflictId)
    if (conflict) {
      setActiveConflictId(conflictId)
      setMergedContent(conflict.localContent)
      setMergeDialogOpen(true)
    }
  }

  const handleMerge = () => {
    if (activeConflictId && mergedContent) {
      resolveConflict(activeConflictId, "merge", mergedContent)
      addActivity("You merged changes", localUser.id)
      setMergeDialogOpen(false)
      setActiveConflictId(null)
    }
  }

  if (conflicts.length === 0) return null

  return (
    <>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conflicts</h3>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {conflicts.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {conflicts.map((conflict) => {
            const block = docBlocks.find((b) => b.id === conflict.blockId)
            const blockIndex = docBlocks.findIndex((b) => b.id === conflict.blockId)
            const user = users.find((u) => u.id === conflict.remoteUserId)

            return (
              <div key={conflict.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium text-foreground mb-2">Paragraph {blockIndex + 1}</p>

                {/* Yours */}
                <div className="mb-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Yours</p>
                  <p className="text-xs text-foreground bg-background p-2 rounded border border-border line-clamp-2">
                    {conflict.localContent || <span className="italic text-muted-foreground">Empty</span>}
                  </p>
                </div>

                {/* Theirs */}
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Theirs{" "}
                    <span className="font-medium" style={{ color: user?.color }}>
                      ({user?.name})
                    </span>
                  </p>
                  <p className="text-xs text-foreground bg-background p-2 rounded border border-border line-clamp-2">
                    {conflict.remoteContent || <span className="italic text-muted-foreground">Empty</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 flex-1 bg-transparent"
                    onClick={() => handleKeepMine(conflict.id)}
                  >
                    Keep mine
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 flex-1 bg-transparent"
                    onClick={() => handleAcceptTheirs(conflict.id)}
                  >
                    Accept theirs
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs h-7"
                    onClick={() => handleOpenMerge(conflict.id)}
                  >
                    Merge...
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Merge Changes</DialogTitle>
          </DialogHeader>

          {activeConflict && (
            <div className="space-y-4">
              {/* Diff view */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Yours</p>
                  <div className="text-xs p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 min-h-20">
                    {activeConflict.localContent || <span className="italic text-muted-foreground">Empty</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{remoteUser?.name || "Theirs"}</p>
                  <div className="text-xs p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 min-h-20">
                    {activeConflict.remoteContent || <span className="italic text-muted-foreground">Empty</span>}
                  </div>
                </div>
              </div>

              {/* Merged result */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Merged Result</p>
                <textarea
                  value={mergedContent}
                  onChange={(e) => setMergedContent(e.target.value)}
                  className="w-full text-sm p-3 rounded-lg border border-border bg-background resize-none min-h-24 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter merged content..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMerge}>Apply Merge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
