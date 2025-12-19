"use client"

import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Connecting to session...</p>
          <p className="text-xs text-muted-foreground mt-1">Setting up realtime sync</p>
        </div>
      </div>
    </div>
  )
}
