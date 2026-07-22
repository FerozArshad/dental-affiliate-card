"use client";

import { useActionState } from "react";
import { completeVisit } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type MemberOption = {
  id: string;
  name: string;
  memberCode: string;
  hasPendingReferral: boolean;
  availableFamilyDiscounts: number;
};

export function VisitForm({ members }: { members: MemberOption[] }) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean; finalAmount?: number } | null, formData: FormData) => {
      return completeVisit(formData);
    },
    null
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="memberId">Patient</Label>
        <select
          id="memberId"
          name="memberId"
          required
          className="w-full rounded-xl border border-white/10 bg-stone-900 px-4 py-3 text-sm text-white"
          defaultValue=""
        >
          <option value="" disabled>
            Select member...
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.memberCode})
              {m.hasPendingReferral ? " — referral welcome discount pending" : ""}
              {m.availableFamilyDiscounts > 0
                ? ` — ${m.availableFamilyDiscounts} stored discount(s)`
                : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="treatmentValue">Treatment value (£)</Label>
        <Input
          id="treatmentValue"
          name="treatmentValue"
          type="number"
          min="1"
          step="0.01"
          placeholder="180.00"
          required
        />
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <input
          type="checkbox"
          name="applyStoredDiscount"
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium text-white">
            Apply stored 5% family discount
          </span>
          <span className="block text-xs text-stone-500">
            Uses oldest available discount from the patient&apos;s family group (not cash).
          </span>
        </span>
      </label>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Hygiene visit" />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-300">
          Visit recorded. Final amount: {formatCurrency(state.finalAmount ?? 0)}. WhatsApp
          notifications sent.
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Processing..." : "Complete visit & update discounts"}
      </Button>
    </form>
  );
}
