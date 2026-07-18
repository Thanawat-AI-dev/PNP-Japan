import { ChevronRight, Percent, Scale, ScrollText, LogOut, ClipboardCheck, Sliders } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/useProfile";
import { useAdminAlertCount } from "@/lib/useAdminAlerts";
import { useAccount } from "@/lib/useAccount";
import { supabase } from "@/lib/supabase";

function LinkList({ items }: { items: { to: string; label: string; icon: typeof Percent; badge?: number }[] }) {
  return (
    <Card className="divide-y divide-line p-0">
      {items.map(({ to, label, icon: Icon, badge }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-3 px-4 py-3.5 first:rounded-t-[var(--radius-card)] last:rounded-b-[var(--radius-card)] hover:bg-surface-sunken"
        >
          <Icon className="h-5 w-5 text-ink-muted" />
          <span className="flex-1 font-medium text-ink">{label}</span>
          {!!badge && (
            <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-alert-400 px-1.5 text-[11px] font-bold text-white">
              {badge}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-ink-faint" />
        </Link>
      ))}
    </Card>
  );
}

export function Settings() {
  const { session } = useAuth();
  const { profile, isAdmin } = useProfile();
  const { account } = useAccount();
  const alertCount = useAdminAlertCount(account?.id, isAdmin);

  return (
    <MobileShell title="ตั้งค่า" hideFab>
      <div className="flex flex-col gap-4">
        {session && (
          <Card className="p-4">
            <p className="text-sm text-ink-muted">เข้าสู่ระบบด้วย</p>
            <p className="font-semibold text-ink">{profile?.display_name ?? session.user.email}</p>
            <p className="text-xs text-ink-faint">{session.user.email}</p>
            {profile && (
              <Badge tone={isAdmin ? "growth" : "trust"} className="mt-2">
                {isAdmin ? "Admin" : "หมวย"}
              </Badge>
            )}
          </Card>
        )}

        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            ทั่วไป
          </p>
          <LinkList
            items={[
              { to: "/interest", label: "ดอกเบี้ย", icon: Percent },
              { to: "/audit-log", label: "Audit Log", icon: ScrollText },
            ]}
          />
        </div>

        {isAdmin && (
          <div>
            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              การจัดการ (Admin)
            </p>
            <LinkList
              items={[
                { to: "/admin", label: "ตรวจสอบรายการ", icon: ClipboardCheck, badge: alertCount },
                { to: "/interest-rates", label: "ตั้งค่าอัตราดอกเบี้ย", icon: Sliders },
                { to: "/reconciliation", label: "กระทบยอด", icon: Scale },
              ]}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3.5 font-medium text-alert-600 hover:bg-alert-50"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>

        <CardLabel className="text-center">SaveTogether</CardLabel>
      </div>
    </MobileShell>
  );
}
