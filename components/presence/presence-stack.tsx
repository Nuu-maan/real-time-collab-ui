"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useCollabStore } from "@/lib/store/use-collab-store"

export function PresenceStack() {
  const { users, presences, followingUserId, setFollowingUserId, localUser } = useCollabStore()

  const activeUsers = users.filter((u) => {
    if (u.id === localUser.id) return false
    const presence = presences.get(u.id)
    if (!presence) return false
    return Date.now() - presence.lastSeen < 30000
  })

  const handleAvatarClick = (userId: string) => {
    if (followingUserId === userId) {
      setFollowingUserId(null)
    } else {
      setFollowingUserId(userId)
    }
  }

  const maxVisibleMobile = 2
  const visibleUsers = activeUsers.slice(0, maxVisibleMobile)
  const hiddenCount = activeUsers.length - maxVisibleMobile

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center -space-x-2">
        {/* Mobile: show limited avatars */}
        <div className="flex items-center -space-x-2 md:hidden">
          {visibleUsers.map((user) => {
            const presence = presences.get(user.id)
            const isFollowing = followingUserId === user.id
            const isTyping = presence?.isTyping

            return (
              <button
                key={user.id}
                onClick={() => handleAvatarClick(user.id)}
                className="relative focus:outline-none rounded-full transition-transform hover:scale-110 hover:z-10"
                aria-label={`${isFollowing ? "Stop following" : "Follow"} ${user.name}`}
              >
                <Avatar
                  className="h-6 w-6 border-2 border-card"
                  style={{
                    boxShadow: isFollowing ? `0 0 0 2px ${user.color}` : undefined,
                  }}
                >
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback style={{ backgroundColor: user.color }} className="text-white text-[10px]">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isTyping && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card"
                    style={{ backgroundColor: user.color }}
                  />
                )}
              </button>
            )
          })}
          {hiddenCount > 0 && (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              +{hiddenCount}
            </div>
          )}
        </div>

        {/* Desktop: show all avatars with tooltips */}
        <div className="hidden md:flex items-center -space-x-2">
          {activeUsers.map((user) => {
            const presence = presences.get(user.id)
            const isFollowing = followingUserId === user.id
            const isTyping = presence?.isTyping

            return (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleAvatarClick(user.id)}
                    className="relative focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full transition-transform hover:scale-110 hover:z-10"
                    aria-label={`${isFollowing ? "Stop following" : "Follow"} ${user.name}`}
                  >
                    <Avatar
                      className="h-7 w-7 border-2 border-card"
                      style={{
                        boxShadow: isFollowing ? `0 0 0 2px ${user.color}` : undefined,
                      }}
                    >
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback style={{ backgroundColor: user.color }} className="text-white text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isTyping && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card"
                        style={{ backgroundColor: user.color }}
                      />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-muted-foreground">
                    {isTyping ? "Typing..." : presence?.activeMode === "doc" ? "In Doc" : "On Whiteboard"}
                  </p>
                  {isFollowing && <p className="text-muted-foreground mt-0.5">Following (Esc to stop)</p>}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
