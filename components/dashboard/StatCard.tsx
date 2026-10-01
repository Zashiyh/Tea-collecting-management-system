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
    <div className="group rounded-2xl border border-slate-800 bg-[#07140d] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-950/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>

        <div className="rounded-xl bg-emerald-600/10 p-3 text-emerald-400">
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        {trend && (
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-400">
            {trend}
          </span>
        )}

        <span className="text-slate-500">{subtitle}</span>
      </div>
    </div>
  );
}