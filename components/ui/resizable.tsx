"use client"

import type React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

type PanelGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: "horizontal" | "vertical"
}

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

type HandleProps = React.HTMLAttributes<HTMLDivElement> & {
  withHandle?: boolean
}

const ResizablePanelGroup = ({
  className,
  direction = "horizontal",
  ...props
}: PanelGroupProps) => (
  <div
    className={cn(
      "flex h-full w-full",
      direction === "vertical" && "flex-col",
      className
    )}
    data-panel-group-direction={direction}
    {...props}
  />
)

const ResizablePanel = ({
  className,
  defaultSize,
  minSize,
  maxSize,
  style,
  ...props
}: PanelProps) => (
  <div
    className={cn("min-h-0 min-w-0", className)}
    style={{
      flexBasis: defaultSize ? `${defaultSize}%` : undefined,
      minWidth: minSize ? `${minSize}%` : undefined,
      maxWidth: maxSize ? `${maxSize}%` : undefined,
      ...style,
    }}
    {...props}
  />
)

const ResizableHandle = ({ withHandle, className, ...props }: HandleProps) => (
  <div
    aria-hidden="true"
    className={cn("relative flex w-px items-center justify-center bg-border", className)}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
