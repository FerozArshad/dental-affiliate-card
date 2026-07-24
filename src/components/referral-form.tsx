"use client";

import { useActionState } from "react";
import { enrollViaReferral } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function ReferralForm({ referrerCode, referrerName }: {
  referrerCode: string;
  referrerName: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; memberCode?: string } | null, formData: FormData) => {
      formData.set("referrerCode", referrerCode);
      return enrollViaReferral(formData);
    },
    null
  );

  if (state?.memberCode) {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold text-emerald-300">You&apos;re in!</p>
        <p className="mt-2 text-stone-400">
          You now have your own Gold Card with 5% stored. Share your link so
          others can join too.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/member/${state.memberCode}`}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-4 py-3 text-sm font-semibold text-stone-950"
          >
            Open my Gold Card →
          </Link>
          <Link
            href={`/refer/${state.memberCode}`}
            className="text-sm text-emerald-300 hover:underline"
          >
            Share my referral link
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-4 text-sm text-stone-400">
        Referred by <span className="text-amber-300">{referrerName}</span>
      </p>
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" placeholder="Lucy Smith" required />
        </div>
        <div>
          <Label htmlFor="phone">WhatsApp number</Label>
          <Input id="phone" name="phone" placeholder="+44 7700 900457" required />
        </div>
        <div>
          <Label htmlFor="relationship">Relationship</Label>
          <Select id="relationship" name="relationship" defaultValue="family">
            <option value="family">Family member</option>
            <option value="friend">Friend</option>
          </Select>
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <Button type="submit" variant="gold" className="w-full" disabled={pending}>
          {pending ? "Joining..." : "Join & get 5% stored"}
        </Button>
      </form>
    </Card>
  );
}
