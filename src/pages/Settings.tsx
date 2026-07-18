import { ChevronRight, Percent, Scale, ScrollText, Palette, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const links = [
  { to: "/interest", label: "อัตราดอกเบี้ย", icon: Percent },
  { to: "/reconciliation", label: "กระทบยอด", icon: Scale },
  { to: "/audit-log", label: "Audit Log", icon: ScrollText },
  { to: "/style-guide", label: "Style Guide (ดีไซน์)", icon: Palette },
];

export function Settings() {
  const { session } = useAuth();

  return (
    <MobileShell title="ตั้งค่า" hideFab>
      <div className="flex flex-col gap-4">
        {session && (
          <Card className="p-4">
            <p className="text-sm text-ink-muted">เข้าสู่ระบบด้วย</p>
            <p className="font-semibold text-ink">{session.user.email}</p>
          </Card>
        )}

        <Card className="divide-y divide-line p-0">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 px-4 py-3.5 first:rounded-t-[var(--radius-card)] last:rounded-b-[var(--radius-card)] hover:bg-surface-sunken"
            >
              <Icon className="h-5 w-5 text-ink-muted" />
              <span className="flex-1 font-medium text-ink">{label}</span>
              <ChevronRight className="h-4 w-4 text-ink-faint" />
            </Link>
          ))}
        </Card>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3.5 font-medium text-alert-600 hover:bg-alert-50"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </MobileShell>
  );
}
