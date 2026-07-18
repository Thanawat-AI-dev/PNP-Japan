import { NavLink } from "react-router-dom";
import { LayoutDashboard, History, Target, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "หน้าแรก", icon: LayoutDashboard, end: true },
  { to: "/history", label: "ประวัติ", icon: History },
  { to: "/goals", label: "เป้าหมาย", icon: Target },
  { to: "/achievements", label: "ความสำเร็จ", icon: Trophy },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function BottomNav() {
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
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-faint transition-colors",
                  isActive && "text-growth-600",
                )
              }
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
