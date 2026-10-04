"use client";

import { useState } from "react";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const router = useRouter();

  const [showProfile, setShowProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    try {
      setLoggingOut(true);

      /*
       * Clear authentication token
       * using the logout API.
       */
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);

      /*
       * Even if the API fails, redirect to login.
       * The middleware will handle authentication.
       */
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-[#020a06]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-xl p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu size={23} />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-emerald-600"
          />
        </div>

        {/* Mobile Brand */}
        <div className="sm:hidden">
          <p className="text-sm font-semibold text-white">
            Cooroondowatte tea Factory
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative flex items-center gap-3">
        {/* Notification */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-slate-800 sm:block" />

        {/* Admin Profile */}
        <button
          type="button"
          onClick={() =>
            setShowProfile((current) => !current)
          }
          aria-label="Open admin profile"
          aria-expanded={showProfile}
          className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-800/70"
        >
          {/* Admin Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-950/30">
            A
          </div>

          {/* Admin Details */}
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-white">
              Admin
            </p>

            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>
        </button>

        {/* Profile Dropdown */}
        {showProfile && (
          <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] shadow-2xl shadow-black/40">
            {/* Profile Header */}
            <div className="border-b border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                  A
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    Admin
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    Administrator
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div className="p-2">
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <User size={18} />
                Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={18} />

                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}