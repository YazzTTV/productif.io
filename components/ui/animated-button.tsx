import * as React from "react"
import { cn } from "@/lib/utils"
import "./animated-button.module.css"

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children: React.ReactNode
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="buttonWrapper">
        <button
          ref={ref}
          className={cn(
            "relative inline-flex items-center justify-center text-white font-medium rounded-md px-6 py-3 bg-green-500 hover:bg-green-600 transition-colors",
            className
          )}
          {...props}
        >
          {children}
        </button>
      </div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton"; 