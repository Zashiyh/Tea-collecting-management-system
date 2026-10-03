"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Factory,
  Loader2,
  Scale,
  Weight,
} from "lucide-react";

interface Collection {
  _id: string;
  collectionId: string;
  date: string;
  areaId: string;
  areaName: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes?: string;
}

export default function AreaCollectionPage() {
  const params = useParams();
  const router = useRouter();

  const collectionId = String(params.areaId || "");

  const [collection, setCollection] =
    useState<Collection | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!collectionId) return;

    const loadCollection = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/collections/${collectionId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load collection"
          );
        }

        setCollection(
          data.collection
        );
      } catch (err) {
        console.error(
          "Load collection error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load collection"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [collectionId]);

  const formatDate = (
    dateValue: string
  ) => {
    if (!dateValue) return "-";

    const date =
      new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-LK",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const formatNumber = (
    value: number
  ) => {
    return new Intl.NumberFormat(
      "en-LK",
      {
        maximumFractionDigits: 2,
      }
    ).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020a06] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />

          <p className="text-sm text-slate-400">
            Loading collection...
          </p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-[#020a06] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

          <button
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mt-8 rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
            <h1 className="text-lg font-semibold text-red-400">
              Collection not found
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {error ||
                "The requested tea collection could not be found."}
            </p>

            <button
              onClick={() =>
                router.back()
              }
              className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const difference =
    Number(
      collection.differenceKg || 0
    );

  const differencePositive =
    difference > 0;

  const differenceNegative =
    difference < 0;

  return (
    <div className="min-h-screen bg-[#020a06] text-white">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <button
              onClick={() =>
                router.back()
              }
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Collection Details
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Daily tea collection information
            </p>
          </div>

          <div className="rounded-xl border border-emerald-900/50 bg-[#07140d] px-4 py-3">
            <p className="text-xs text-slate-500">
              Collection ID
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-400">
              {collection.collectionId}
            </p>
          </div>
        </div>

        {/* AREA / DATE */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Factory className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Area
                </p>

                <p className="mt-1 font-semibold">
                  {collection.areaName}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {collection.areaId}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-400" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Collection Date
                </p>

                <p className="mt-1 font-semibold">
                  {formatDate(
                    collection.date
                  )}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* WEIGHT SUMMARY */}
        <div className="mt-6">

          <h2 className="text-lg font-semibold mb-4">
            Weight Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* TEA WEIGHT */}
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-400">
                    Tea / Field Weight
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatNumber(
                      collection.totalKg
                    )}
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      kg
                    </span>
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Weight className="w-5 h-5 text-amber-400" />
                </div>

              </div>

            </div>

            {/* FACTORY WEIGHT */}
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-400">
                    Factory Weight
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatNumber(
                      collection.factoryWeightKg
                    )}
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      kg
                    </span>
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-emerald-400" />
                </div>

              </div>

            </div>

            {/* DIFFERENCE */}
            <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-400">
                    Difference
                  </p>

                  <p
                    className={`mt-2 text-2xl font-bold ${
                      differencePositive
                        ? "text-emerald-400"
                        : differenceNegative
                        ? "text-red-400"
                        : "text-slate-300"
                    }`}
                  >
                    {difference > 0
                      ? "+"
                      : ""}
                    {formatNumber(
                      difference
                    )}
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      kg
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Factory - Tea
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Weight difference
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* DIFFERENCE STATUS */}
        <div className="mt-6">

          <div
            className={`rounded-2xl border p-5 ${
              differencePositive
                ? "border-emerald-900/60 bg-emerald-950/20"
                : differenceNegative
                ? "border-red-900/60 bg-red-950/20"
                : "border-slate-800 bg-[#07140d]"
            }`}
          >

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>
                <p className="text-sm font-semibold">
                  Weight Difference
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Factory weight minus tea / field weight
                </p>
              </div>

              <div
                className={`text-lg font-bold ${
                  differencePositive
                    ? "text-emerald-400"
                    : differenceNegative
                    ? "text-red-400"
                    : "text-slate-300"
                }`}
              >
                {differencePositive
                  ? "Factory weight is higher"
                  : differenceNegative
                  ? "Tea weight is higher"
                  : "Weights are matched"}
              </div>

            </div>

          </div>

        </div>

        {/* NOTES */}
        <div className="mt-6">

          <h2 className="text-lg font-semibold mb-4">
            Notes
          </h2>

          <div className="rounded-2xl border border-slate-800 bg-[#07140d] p-5">

            {collection.notes ? (
              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                {collection.notes}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                No notes added for this collection.
              </p>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}