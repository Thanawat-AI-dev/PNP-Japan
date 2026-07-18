import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-growth-500 focus:ring-2 focus:ring-growth-500/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
