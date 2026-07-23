import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/constants";

export function Nav() {
  return (
    <header className="border-b border-white/10 bg-stone-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={BRAND.logo}
            alt={BRAND.name}
            width={150}
            height={60}
            className="h-9 w-auto"
            priority
          />
          <span className="sr-only">{BRAND.name}</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-stone-300 hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-lg px-3 py-2 text-stone-300 hover:bg-white/5 hover:text-white"
          >
            Leaderboard
          </Link>
          <Link
            href="/desk"
            className="rounded-lg px-3 py-2 text-stone-300 hover:bg-white/5 hover:text-white"
          >
            Desk QR
          </Link>
          <Link
            href="/join"
            className="rounded-lg bg-teal-500 px-3 py-2 font-semibold text-stone-950 hover:bg-teal-400"
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
