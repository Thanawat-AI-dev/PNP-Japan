import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useAccount } from "@/lib/useAccount";
import { useTransactions } from "@/lib/useTransactions";
import { useAchievements } from "@/lib/useAchievements";
import { computeBalance } from "@/lib/transactions";
import { levels, getLevelForBalance } from "@/lib/levels";
import { badgeCatalog } from "@/lib/badges";
import { cn } from "@/lib/utils";

type Selected =
  | { kind: "level"; item: (typeof levels)[number]; reached: boolean }
  | { kind: "badge"; item: (typeof badgeCatalog)[number]; earned: boolean };

export function Achievements() {
  const { account } = useAccount();
  const { transactions } = useTransactions(account?.id);
  const { earnedCodes } = useAchievements();
  const [selected, setSelected] = useState<Selected | null>(null);

  const balance = computeBalance(transactions);
  const level = getLevelForBalance(balance);

  return (
    <MobileShell title="ความสำเร็จ">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center text-center">
          <span className="text-4xl">{level.emoji}</span>
          <p className="mt-1 font-bold text-ink">{level.name}</p>
          <p className="text-xs text-ink-muted">
            ระดับ {level.order} จาก {levels.length}
          </p>
          <div className="mt-3 flex w-full justify-between">
            {levels.map((l) => (
              <button
                key={l.order}
                type="button"
                onClick={() => setSelected({ kind: "level", item: l, reached: l.order <= level.order })}
                className="flex flex-col items-center gap-1"
              >
                <span className={cn("text-lg", l.order > level.order && "opacity-30 grayscale")}>
                  {l.emoji}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardLabel>Badge</CardLabel>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {badgeCatalog.map((b) => {
              const earned = earnedCodes.has(b.code);
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => setSelected({ kind: "badge", item: b, earned })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[var(--radius-control)] border border-line p-3 text-center",
                    !earned && "opacity-40 grayscale",
                  )}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <span className="text-[11px] font-medium text-ink">{b.name}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Modal open={selected != null} onClose={() => setSelected(null)}>
        {selected && (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">{selected.item.emoji}</span>
            <p className="font-bold text-ink">{selected.item.name}</p>
            <p className="text-sm text-ink-muted">{selected.item.description}</p>
            {selected.kind === "level" ? (
              <Badge tone={selected.reached ? "growth" : "neutral"}>
                {selected.reached ? "ถึงระดับนี้แล้ว" : "ยังไม่ถึง"}
              </Badge>
            ) : (
              <Badge tone={selected.earned ? "growth" : "neutral"}>
                {selected.earned ? "ได้รับแล้ว" : "ยังไม่ได้รับ"}
              </Badge>
            )}
          </div>
        )}
      </Modal>
    </MobileShell>
  );
}
