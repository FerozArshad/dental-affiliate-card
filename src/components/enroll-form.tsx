"use client";

import { useActionState } from "react";
import { enrollMember } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function EnrollForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; memberCode?: string } | null, formData: FormData) => {
      return enrollMember(formData);
    },
    null
  );

  if (state?.memberCode) {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold text-emerald-300">Member enrolled!</p>
        <p className="mt-2 text-stone-400">
          WhatsApp welcome message sent. View their Gold Card:
        </p>
        <Link
          href={`/member/${state.memberCode}`}
          className="mt-4 inline-block text-amber-300 hover:underline"
        >
          {state.memberCode}
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="name">Patient name</Label>
          <Input id="name" name="name" placeholder="Sarah Smith" required />
        </div>
        <div>
          <Label htmlFor="phone">WhatsApp number</Label>
          <Input id="phone" name="phone" placeholder="+44 7700 900123" required />
        </div>
        <div>
          <Label htmlFor="familyName">Family group (optional)</Label>
          <Input id="familyName" name="familyName" placeholder="Smith Family" />
          <p className="mt-1 text-xs text-stone-500">
            Stored discounts can be used by any member in the same family group.
          </p>
        </div>
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        <Button type="submit" variant="gold" className="w-full" disabled={pending}>
          {pending ? "Enrolling..." : "Enroll & send Gold Card"}
        </Button>
      </form>
    </Card>
  );
}
