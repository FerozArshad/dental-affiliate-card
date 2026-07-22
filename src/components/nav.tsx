import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Nav() {
  return (
    <header className="border-b border-white/10 bg-stone-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-stone-950">
            <Sparkles className="h-4 w-4" />
          </span>
          Gold Card Demo
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-stone-300 hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/enroll"
            className="rounded-lg px-3 py-2 text-stone-300 hover:bg-white/5 hover:text-white"
          >
            Enroll
          </Link>
        </nav>
      </div>
    </header>
  );
}
