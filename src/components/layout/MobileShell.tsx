import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AttachSlipFab } from "./AttachSlipFab";

interface MobileShellProps {
  title: string;
  children: ReactNode;
  /** Hide the floating attach-slip button (e.g. on its own page, or admin-only pages) */
  hideFab?: boolean;
}

export function MobileShell({ title, children, hideFab }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
        <h1 className="text-[19px] font-bold text-ink">{title}</h1>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      {!hideFab && <AttachSlipFab />}
      <BottomNav />
    </div>
  );
}
