"use client";

import { Printer } from "lucide-react";

export function PrintButton({
  label = "Print poster",
}: {
  label?: string;
}) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-5 py-2.5 text-sm font-semibold text-stone-950 hover:brightness-105"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
