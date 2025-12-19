"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Eraser, Circle, MessageSquarePlus } from "lucide-react"
import { cn } from "@/lib/utils"

type Tool = "pen" | "eraser" | "comment"

interface WhiteboardToolbarProps {
  tool: Tool
  onToolChange: (tool: Tool) => void
  isLaserActive: boolean
}

export function WhiteboardToolbar({ tool, onToolChange, isLaserActive }: WhiteboardToolbarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute top-3 md:top-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 md:gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={tool === "pen" && !isLaserActive ? "default" : "ghost"}
              className={cn(
                "h-10 w-10 md:h-8 md:w-8 p-0",
                tool === "pen" && !isLaserActive && "bg-primary text-primary-foreground",
              )}
              onClick={() => onToolChange("pen")}
              aria-label="Pen tool"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Pen</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={tool === "eraser" && !isLaserActive ? "default" : "ghost"}
              className={cn(
                "h-10 w-10 md:h-8 md:w-8 p-0",
                tool === "eraser" && !isLaserActive && "bg-primary text-primary-foreground",
              )}
              onClick={() => onToolChange("eraser")}
              aria-label="Eraser tool"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Eraser</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={tool === "comment" && !isLaserActive ? "default" : "ghost"}
              className={cn(
                "h-10 w-10 md:h-8 md:w-8 p-0",
                tool === "comment" && !isLaserActive && "bg-primary text-primary-foreground",
              )}
              onClick={() => onToolChange("comment")}
              aria-label="Comment tool"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Add Comment</TooltipContent>
        </Tooltip>

        {/* Laser button - hidden on mobile since it requires keyboard */}
        <div className="hidden md:flex items-center">
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isLaserActive ? "default" : "ghost"}
                className={cn("h-8 w-8 p-0", isLaserActive && "bg-primary text-primary-foreground")}
                disabled
                aria-label="Laser pointer (hold Space)"
              >
                <Circle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Laser (hold Space)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
