import Link from "next/link";
import {
  ArrowRight,
  Gift,
  MessageCircle,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "asc" },
    take: 4,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-400">
          Dental Scotland · It&apos;s Time to Smile
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
          The Dental Scotland Gold Card
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-400">
          Join free, share your{" "}
          <strong className="text-amber-200">REF code</strong>. Friends get 5%
          off their first paid treatment — you earn 5% after they complete it
          (held 14 days). Level-2 override 2%. No cash. No payoff for signup
          alone.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/join">
            <Button variant="gold" className="gap-2">
              Join the Gold Card <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Practice dashboard</Button>
          </Link>
          <Link href="/desk">
            <Button variant="secondary">Desk QR</Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-4">
        {[
          {
            icon: Gift,
            title: "Stored discounts",
            text: "5% after qualifying treatment — held 14 days",
          },
          {
            icon: Users,
            title: "Two levels only",
            text: "L1 = 5% direct · L2 = 2% override · nothing beyond",
          },
          {
            icon: MessageCircle,
            title: "WhatsApp + QR growth",
            text: "One-tap share, desk QR, review requests",
          },
          {
            icon: Shield,
            title: "ROI for practices",
            text: "Referral revenue vs monthly fee on dashboard",
          },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <Icon className="h-5 w-5 text-amber-400" />
            <h3 className="mt-3 font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-stone-400">{text}</p>
          </Card>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-white">Member cards</h2>
        <p className="mt-1 text-sm text-stone-500">
          Click to view a patient&apos;s Gold Card
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((m) => (
            <Link key={m.id} href={`/member/${m.memberCode}`}>
              <Card className="transition hover:border-amber-400/30 hover:bg-amber-400/5">
                <p className="font-medium text-white">{m.name}</p>
                <p className="mt-1 font-mono text-sm text-amber-300">
                  {m.memberCode}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent p-8">
        <h2 className="text-xl font-semibold">How the discount process works</h2>
        <ol className="mt-4 space-y-3 text-sm text-stone-300">
          <li>1. Scan QR → WhatsApp (or web) onboarding → Gold Card + REF code</li>
          <li>2. Share REF-YOURCODE with family / friends</li>
          <li>3. Friend joins (pending) — no payout yet</li>
          <li>4. Friend completes a qualifying paid treatment → they get 5% off that bill</li>
          <li>5. You earn 5% stored (available after 14-day hold); their referrer&apos;s upline gets 2% L2 only</li>
          <li>6. Nothing pays beyond level 2 · monthly referral cap applies</li>
        </ol>
      </section>
    </div>
  );
}
