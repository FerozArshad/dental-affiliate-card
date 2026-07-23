"use client";

import { useTransition } from "react";
import {
  sendProgressNudge,
  toggleDoubleReward,
  togglePrizeCampaign,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PRIZE_CAMPAIGN_ENABLED } from "@/lib/constants";

export function CampaignToggles({
  prizeActive,
  doubleActive,
  prizeLabel,
}: {
  prizeActive: boolean;
  doubleActive: boolean;
  prizeLabel: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      {PRIZE_CAMPAIGN_ENABLED && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">
              Monthly prize campaign
            </p>
            <p className="text-xs text-stone-500">Prize: {prizeLabel}</p>
          </div>
          <Button
            type="button"
            variant={prizeActive ? "gold" : "secondary"}
            disabled={pending}
            onClick={() =>
              start(() => {
                void togglePrizeCampaign();
              })
            }
          >
            {prizeActive ? "ON" : "OFF"}
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Double reward week</p>
          <p className="text-xs text-stone-500">2× stored % on completed referrals</p>
        </div>
        <Button
          type="button"
          variant={doubleActive ? "primary" : "secondary"}
          disabled={pending}
          onClick={() =>
            start(() => {
              void toggleDoubleReward();
            })
          }
        >
          {doubleActive ? "ON" : "OFF"}
        </Button>
      </div>
    </div>
  );
}

export function NudgeButton({ memberId }: { memberId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(() => {
          void sendProgressNudge(memberId);
        })
      }
      className="text-xs text-amber-300 hover:underline disabled:opacity-50"
    >
      {pending ? "Sending..." : "Send nudge"}
    </button>
  );
}
