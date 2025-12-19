"use client"

import { useEffect } from "react"

interface UseKeyboardShortcutsOptions {
  onToggleDevPanel: () => void
  onExitFollow: () => void
}

export function useKeyboardShortcuts({ onToggleDevPanel, onExitFollow }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle dev panel
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onToggleDevPanel()
      }

      // Esc to exit follow mode
      if (e.key === "Escape") {
        onExitFollow()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onToggleDevPanel, onExitFollow])
}
