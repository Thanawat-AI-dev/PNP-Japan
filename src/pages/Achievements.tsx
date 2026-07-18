import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { account, badges, levels, getLevelForBalance } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function Achievements() {
  const level = getLevelForBalance(account.balance);

  return (
    <MobileShell title="ความสำเร็จ">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center text-center">
          <span className="text-4xl">{level.emoji}</span>
          <p className="mt-1 font-bold text-ink">{level.name}</p>
          <p className="text-xs text-ink-muted">ระดับ {level.order} จาก {levels.length}</p>
          <div className="mt-3 flex w-full justify-between">
            {levels.map((l) => (
              <div key={l.order} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "text-lg",
                    l.order > level.order && "opacity-30 grayscale",
                  )}
                >
                  {l.emoji}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardLabel>Badge</CardLabel>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <div
                key={b.code}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[var(--radius-control)] border border-line p-3 text-center",
                  !b.earned && "opacity-40 grayscale",
                )}
              >
                <span className="text-2xl">{b.emoji}</span>
                <span className="text-[11px] font-medium text-ink">{b.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MobileShell>
  );
}
