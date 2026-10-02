"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CollectionAreaPage() {
  const params = useParams<{ areaId: string }>();
  const areaId = params.areaId;

  return (
    <main className="min-h-screen bg-[#07100b] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/collections"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Collections
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#0d1811] p-6">
          <h1 className="text-2xl font-semibold">
            Area Collection
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Area ID: {areaId}
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Collection area details will be displayed here.
          </p>
        </div>
      </div>
    </main>
  );
}