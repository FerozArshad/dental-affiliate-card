"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { startTreatmentPayment } from "@/lib/actions";

export function PayOnline({
  memberCode,
  bestStoredPercent,
}: {
  memberCode: string;
  bestStoredPercent: number;
}) {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount) || 0;
  const discount =
    bestStoredPercent > 0 ? (value * bestStoredPercent) / 100 : 0;
  const payable = Math.max(value - discount, 0);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    // On success this redirects to Stripe; if it returns, there was an error.
    const res = await startTreatmentPayment(formData);
    setPending(false);
    if (res?.error) setError(res.error);
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="memberCode" value={memberCode} />

      <div>
        <label className="text-xs text-stone-500">Treatment amount (£)</label>
        <input
          name="amount"
          type="number"
          min="1"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="180.00"
          className="mt-1 w-full rounded-xl border border-white/10 bg-stone-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-stone-600 focus:border-amber-500/50"
        />
      </div>

      {value > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <div className="flex justify-between text-stone-400">
            <span>Treatment</span>
            <span>£{value.toFixed(2)}</span>
          </div>
          {bestStoredPercent > 0 && (
            <div className="flex justify-between text-amber-300">
              <span>Gold Card discount ({bestStoredPercent}%)</span>
              <span>−£{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-white/10 pt-1 font-semibold text-white">
            <span>You pay</span>
            <span className="text-emerald-300">£{payable.toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending || value <= 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-4 py-3 text-sm font-semibold text-stone-950 disabled:opacity-40"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {pending ? "Starting secure checkout…" : "Pay online securely"}
      </button>
      <p className="text-center text-[11px] text-stone-500">
        Payments processed securely by Stripe.
      </p>
    </form>
  );
}
