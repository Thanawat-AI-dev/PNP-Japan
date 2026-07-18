import { NavLink } from "react-router-dom";
import { LayoutDashboard, History, Target, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/lib/useAccount";
import { useProfile } from "@/lib/useProfile";
import { useAdminAlertCount } from "@/lib/useAdminAlerts";

const items = [
  { to: "/", label: "หน้าแรก", icon: LayoutDashboard, end: true },
  { to: "/history", label: "ประวัติ", icon: History },
  { to: "/goals", label: "เป้าหมาย", icon: Target },
  { to: "/achievements", label: "ความสำเร็จ", icon: Trophy },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function BottomNav() {
  const { account } = useAccount();
  const { isAdmin } = useProfile();
  const alertCount = useAdminAlertCount(account?.id, isAdmin);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="เมนูหลัก"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-faint transition-colors",
                  isActive && "text-growth-600",
                )
              }
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
                {to === "/settings" && alertCount > 0 && (
                  <span className="tabular absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-alert-400 px-1 text-[9px] font-bold text-white">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
