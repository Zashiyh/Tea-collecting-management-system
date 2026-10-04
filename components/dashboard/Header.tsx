
"use client";

import { useState } from "react";
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useTheme } from "@/components/theme/ThemeProvider";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const router = useRouter();

  const { theme, toggleTheme } = useTheme();

  const [showProfile, setShowProfile] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore logout API errors.
    } finally {
      setShowProfile(false);

      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-[#020a06]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">

      {/* LEFT */}

      <div className="flex items-center gap-3">

        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-xl p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu size={23} />
        </button>

        <div className="relative hidden sm:block">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-600"
          />

        </div>

        <div className="sm:hidden">

          <p className="text-sm font-semibold text-white">
            Cooroonduwatte Tea
          </p>

        </div>

      </div>

      {/* RIGHT */}

      <div className="relative flex items-center gap-2 sm:gap-3">

        {/* THEME TOGGLE */}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            theme === "dark"
              ? "Light mode"
              : "Dark mode"
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#07140d] text-slate-400 transition hover:border-emerald-500/40 hover:text-white"
        >
          {theme === "dark" ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

        {/* NOTIFICATION */}

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        <div className="hidden h-8 w-px bg-slate-800 sm:block" />

        {/* PROFILE */}

        <button
          type="button"
          onClick={() =>
            setShowProfile((current) => !current)
          }
          aria-label="Open admin profile"
          aria-expanded={showProfile}
          className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-800/70"
        >

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-950/30">
            A
          </div>

          <div className="hidden text-left sm:block">

            <p className="text-sm font-semibold text-white">
              Admin
            </p>

            <p className="text-xs text-slate-500">
              Administrator
            </p>

          </div>

        </button>

        {/* PROFILE DROPDOWN */}

        {showProfile && (
          <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-[#07140d] shadow-2xl shadow-black/40">

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

            <div className="p-2">

              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  router.push("/profile");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <User size={18} />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={18} />

                <span>
                  {loggingOut
                    ? "Logging out..."
                    : "Logout"}
                </span>

              </button>

            </div>

          </div>
        )}

      </div>

    </header>
  );
}

