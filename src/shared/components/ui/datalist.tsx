"use client"

import * as React from "react"
import { cn } from "@/core/utils/utils"

export interface DatalistProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  options: string[]
  listId?: string
}

const Datalist = React.forwardRef<HTMLInputElement, DatalistProps>(
  ({ className, options, listId, ...props }, ref) => {
    const defaultListId = React.useId()
    const actualListId = listId || defaultListId

    return (
      <div className="relative">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          list={actualListId}
          ref={ref}
          {...props}
        />
        <datalist id={actualListId}>
          {options.map((option, index) => (
            <option key={index} value={option} />
          ))}
        </datalist>
      </div>
    )
  }
)
Datalist.displayName = "Datalist"

export { Datalist }
