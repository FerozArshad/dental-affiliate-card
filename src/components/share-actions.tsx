"use client";

import { MessageCircle, Share2, Users } from "lucide-react";
import { getAppBaseUrl } from "@/lib/constants";
import { referralShareMessage, whatsappShareUrl } from "@/lib/utils";

export function ShareActions({
  practiceName,
  memberCode,
  memberName,
  baseUrl,
}: {
  practiceName: string;
  memberCode: string;
  memberName: string;
  baseUrl?: string;
}) {
  const origin = baseUrl ?? getAppBaseUrl();
  const firstName = memberName.split(" ")[0];
  const link = `${origin}/refer/${memberCode}`;
  const message = referralShareMessage(practiceName, memberCode, firstName);
  const waUrl = whatsappShareUrl(message);

  const familyPack = [
    {
      label: "Invite spouse / partner",
      text: `${firstName} invited you (partner) to ${practiceName}!\n\nGet 5% off your treatment:\n${link}\n\nYou'll get your own Gold Card too.`,
    },
    {
      label: "Invite child / parent",
      text: `${firstName} invited you (family) to ${practiceName}!\n\nGet 5% off:\n${link}\n\nJoin and get your own Gold Card.`,
    },
    {
      label: "Invite a friend",
      text: `${firstName} invited you to ${practiceName}!\n\nGet 5% off and your own Gold Card:\n${link}`,
    },
  ];

  return (
    <div className="space-y-4">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20"
      >
        <MessageCircle className="h-4 w-4" />
        One-tap WhatsApp share
      </a>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <Users className="h-4 w-4 text-amber-300" />
          Invite family pack
        </p>
        <div className="space-y-2">
          {familyPack.map((item) => (
            <a
              key={item.label}
              href={whatsappShareUrl(item.text)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-stone-950/50 px-3 py-2.5 text-sm text-stone-300 hover:border-amber-400/30 hover:text-white"
            >
              {item.label}
              <Share2 className="h-3.5 w-3.5 text-amber-300" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
