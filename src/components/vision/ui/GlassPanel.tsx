import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  iridescent?: boolean;
  lift?: boolean;
}

/** Frosted glass container used across Vision OS. */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, strong, iridescent, lift, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl",
        strong ? "glass-strong" : "glass",
        iridescent && "iridescent-border",
        lift && "hover-lift",
        className,
      )}
      {...props}
    />
  ),
);
GlassPanel.displayName = "GlassPanel";
