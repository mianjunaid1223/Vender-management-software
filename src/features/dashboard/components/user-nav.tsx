"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import type { User as UserType } from "@/shared/types/types"
import { logoutUser } from "@/app/actions"

export function UserNav({ user }: { user: UserType }) {
  // Get first letter of name for fallback, handle edge cases
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  // Check if the image is a placeholder or invalid
  const isValidImage = (imageUrl: string | undefined) => {
    return imageUrl && 
           !imageUrl.includes('placehold.co') && 
           !imageUrl.includes('placeholder') &&
           imageUrl.trim() !== ''
  }

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full border border-border/40 hover:border-border"
          data-testid="user-nav-trigger"
        >
          <Avatar className="h-9 w-9">
            {isValidImage(user.image) ? (
              <AvatarImage 
                src={user.image} 
                alt={`${user.name}'s profile picture`}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56" 
        align="end" 
        forceMount
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>View Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
