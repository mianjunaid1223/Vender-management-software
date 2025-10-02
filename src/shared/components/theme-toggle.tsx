
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { cn } from "@/core/utils/utils"

export function ThemeToggle({ asDropUp = false }: { asDropUp?: boolean }) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentThemeText = theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : "System";

  if (!mounted) {
    // To prevent hydration mismatch, render a placeholder on the server
    // and initial client render.
    if (asDropUp) {
      return (
        <Button variant="outline" className="w-full justify-between" disabled>
          <div className="flex items-center gap-2">
            <Sun className="h-[1.2rem] w-[1.2rem]" />
            <span>Theme</span>
          </div>
        </Button>
      );
    }
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {asDropUp ? (
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-[1.2rem] w-[1.2rem] block dark:hidden" />
              <Moon className="h-[1.2rem] w-[1.2rem] hidden dark:block" />
              <span>Theme</span>
            </div>
            <span className="text-muted-foreground">{currentThemeText}</span>
          </Button>
        ) : (
          <Button variant="outline" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side={asDropUp ? "top" : "bottom"}
        className={cn(asDropUp && "w-[var(--radix-dropdown-menu-trigger-width)]")}
      >
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
