"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scale,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
  Leaf,
  X,
  MapPin,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Areas",
    href: "/areas",
    icon: MapPin,
  },
  {
    name: "Suppliers",
    href: "/suppliers",
    icon: Users,
  },
  {
    name: "Tea Collections",
    href: "/collections",
    icon: Scale,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: Wallet,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Users",
    href: "/users",
    icon: UserCog,
  },
];

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#07140d] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
              <Leaf size={24} className="text-white" />
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">
                COOROONDOOWATTE
              </h1>
              <p className="text-xs text-emerald-400">
                TEA FACTORY
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon size={19} />
                {item.name}
              </Link>
            );
          })}

          <div className="my-6 border-t border-slate-800" />

          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            System
          </p>

          <Link
            href="/settings"
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              pathname.startsWith("/settings")
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
            }`}
          >
            <Settings size={19} />
            Settings
          </Link>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-900/70 p-4">
            <p className="text-xs text-slate-500">
              Factory Management
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              Cooroonduwatte Tea
            </p>

            <p className="mt-1 text-xs text-emerald-400">
              Management System
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}