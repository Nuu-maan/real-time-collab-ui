// Bot user definitions

import type { User } from "./types"

export const botUsers: User[] = [
  {
    id: "bot-aisha",
    name: "Aisha",
    avatar: "/avatar-woman-dark-hair-professional.jpg",
    color: "#10b981",
    isBot: true,
  },
  {
    id: "bot-ravi",
    name: "Ravi",
    avatar: "/avatar-man-beard-professional.jpg",
    color: "#f59e0b",
    isBot: true,
  },
  {
    id: "bot-chen",
    name: "Chen",
    avatar: "/avatar-man-glasses-asian-professional.jpg",
    color: "#8b5cf6",
    isBot: true,
  },
  {
    id: "bot-sofia",
    name: "Sofia",
    avatar: "/avatar-woman-blonde-professional.jpg",
    color: "#ec4899",
    isBot: true,
  },
]

export const localUser: User = {
  id: "local-user",
  name: "You",
  avatar: "/avatar-person-neutral-professional.jpg",
  color: "#3b82f6",
  isBot: false,
}
