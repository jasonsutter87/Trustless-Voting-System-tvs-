import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * VisuallyHidden component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Useful for providing additional context or instructions for assistive technologies.
 *
 * @example
 * <VisuallyHidden>This text is only for screen readers</VisuallyHidden>
 */
function VisuallyHidden({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0",
        "[clip:rect(0,0,0,0)]",
        className
      )}
      {...props}
    />
  )
}

export { VisuallyHidden }
