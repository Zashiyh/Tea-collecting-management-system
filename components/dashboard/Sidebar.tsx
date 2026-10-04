
"use client";

import Image from "next/image";
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
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#07140d] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* =================================================
            HEADER / LOGO
        ================================================= */}

        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            {/* Logo Image */}

            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/logo.jpg"
                alt="Cooroonduwatte Tea Logo"
                width={44}
                height={44}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            {/* Factory Name */}

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-wide text-white">
                COOROONDOOWATTE
              </h1>

              <p className="text-xs text-emerald-400">
                TEA FACTORY
              </p>
            </div>
          </Link>

          {/* Mobile Close */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

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

          {/* Divider */}

          <div className="my-6 border-t border-slate-800" />

          {/* System */}

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

        {/* =================================================
            FOOTER
        ================================================= */}

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

