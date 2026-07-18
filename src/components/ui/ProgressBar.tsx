import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  /** 0-100, renders a lighter "ghost" marker for the on-pace target */
  ghostValue?: number;
  className?: string;
}

export function ProgressBar({ value, ghostValue, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const ghost = ghostValue != null ? Math.min(100, Math.max(0, ghostValue)) : null;

  return (
    <div
      className={cn(
        "relative h-3 w-full overflow-visible rounded-full bg-surface-sunken",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-growth-500 transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
      {ghost != null && (
        <div
          className="absolute top-1/2 h-4.5 w-0.5 -translate-y-1/2 rounded-full bg-ink-faint/70"
          style={{ left: `${ghost}%` }}
          title={`On-pace target: ${ghost.toFixed(0)}%`}
        />
      )}
    </div>
  );
}
