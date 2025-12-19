"use client"
import { useRef, useEffect, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { RightPanelContent } from "@/components/layout/right-panel"

interface MobilePanelDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobilePanelDrawer({ open, onOpenChange }: MobilePanelDrawerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const startXRef = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Edge swipe to open
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (open) return
      const touch = e.touches[0]
      const edgeThreshold = 20
      const screenWidth = window.innerWidth

      if (touch.clientX >= screenWidth - edgeThreshold) {
        startXRef.current = touch.clientX
        setIsDragging(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || open) return
      const touch = e.touches[0]
      const dx = startXRef.current - touch.clientX

      if (dx > 0) {
        setDragX(Math.min(dx, 280))
      }
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      setIsDragging(false)

      if (dragX > 80) {
        onOpenChange(true)
      }
      setDragX(0)
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, dragX, open, onOpenChange])

  return (
    <>
      {/* Edge swipe indicator */}
      {isDragging && dragX > 0 && (
        <div
          className="fixed top-0 right-0 bottom-0 bg-card border-l border-border z-50 shadow-xl"
          style={{ width: dragX }}
        >
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            {dragX > 80 ? "Release to open" : "Swipe left"}
          </div>
        </div>
      )}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[280px] p-0 flex flex-col" ref={sheetRef}>
          <RightPanelContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
