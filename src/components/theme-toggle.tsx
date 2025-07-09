"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ThemeToggle({ asDropUp = false }: { asDropUp?: boolean }) {
  const { setTheme, theme } = useTheme()
  const currentThemeText = theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : "System";

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
