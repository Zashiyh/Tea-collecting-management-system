"use client";

import { useState } from "react";
import { X, MapPin } from "lucide-react";

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

export default function AreaModal({
  isOpen,
  onClose,
  onCreated,
}: AreaModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Area name is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to create area."
        );
        return;
      }

      /* --------------------------------
         Clear form
      -------------------------------- */

      setName("");
      setDescription("");
      setError("");

      /* --------------------------------
         Refresh area list automatically
      -------------------------------- */

      await onCreated();

      /* --------------------------------
         Close modal
      -------------------------------- */

      onClose();
    } catch (error) {
      console.error(
        "Create area error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#07140e] shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <MapPin size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Add Collection Area
              </h2>

              <p className="text-sm text-gray-500">
                Add an area where tea leaves are collected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5"
        >
          {/* Area Name */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Area Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Example: Pussellawa"
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Description */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Example: Tea leaf collection area"
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0d1d14] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Error */}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Buttons */}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-medium text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : "Add Area"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}