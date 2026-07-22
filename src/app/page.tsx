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

export default async function HomePage() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "asc" },
    take: 4,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400">
          Storm Marketing Studio Demo
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
          WhatsApp Gold Card with stored family discounts
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-400">
          Refer family & friends — they get 5% off their visit. You earn 5% off
          your family&apos;s <strong className="text-amber-200">next treatment</strong>,
          stored on the card. No cash payouts.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="gold" className="gap-2">
              Open practice dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/enroll">
            <Button variant="secondary">Enroll a patient</Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-4">
        {[
          {
            icon: Gift,
            title: "Stored discounts",
            text: "5% off next family treatment — not cash in a wallet",
          },
          {
            icon: Users,
            title: "Family sharing",
            text: "Earned discounts usable by any family group member",
          },
          {
            icon: MessageCircle,
            title: "WhatsApp channel",
            text: "Simulated messages for card delivery & notifications",
          },
          {
            icon: Shield,
            title: "GDC-safe framing",
            text: "Credit toward treatment, compliant wording",
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
        <h2 className="text-xl font-semibold text-white">Demo member cards</h2>
        <p className="mt-1 text-sm text-stone-500">
          Pre-seeded data — click to view a patient&apos;s Gold Card
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
          <li>1. Front desk enrolls patient → WhatsApp Gold Card sent</li>
          <li>2. Patient shares referral link with family/friend</li>
          <li>3. Friend joins → gets 5% off their first visit</li>
          <li>4. After visit, referrer earns 5% stored discount for family&apos;s next treatment</li>
          <li>5. At next visit, front desk applies stored discount from the ledger</li>
        </ol>
      </section>
    </div>
  );
}
