import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="group rounded-xl border border-slate-800 bg-[#07140d] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-950/20 sm:p-4">
      {/* TOP */}

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* TITLE */}

          <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
            {title}
          </p>

          {/* VALUE */}

          <h3 className="mt-1 text-lg font-bold leading-tight tracking-tight text-white sm:text-xl">
            {value}
          </h3>
        </div>

        {/* ICON */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400 sm:h-10 sm:w-10">
          <Icon size={18} />
        </div>
      </div>

      {/* BOTTOM */}

      <div className="mt-2 flex min-w-0 items-center gap-1.5">
        {trend && (
          <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
            {trend}
          </span>
        )}

        <span className="truncate text-[10px] text-slate-600 sm:text-[11px]">
          {subtitle}
        </span>
      </div>
    </div>
  );
}