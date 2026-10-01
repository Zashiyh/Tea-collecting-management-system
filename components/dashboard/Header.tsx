"use client";

import { Bell, Menu, Search } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-[#020a06]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
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
            className="w-64 rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-600"
          />
        </div>

        <div className="sm:hidden">
          <p className="text-sm font-semibold text-white">
            Cooroonduwatte Tea
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        <div className="hidden h-8 w-px bg-slate-800 sm:block" />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">Admin</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}