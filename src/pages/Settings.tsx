import { ChevronRight, Percent, Scale, ScrollText, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";

const links = [
  { to: "/interest", label: "อัตราดอกเบี้ย", icon: Percent },
  { to: "/reconciliation", label: "กระทบยอด", icon: Scale },
  { to: "/audit-log", label: "Audit Log", icon: ScrollText },
  { to: "/style-guide", label: "Style Guide (ดีไซน์)", icon: Palette },
];

export function Settings() {
  return (
    <MobileShell title="ตั้งค่า" hideFab>
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
    </MobileShell>
  );
}
