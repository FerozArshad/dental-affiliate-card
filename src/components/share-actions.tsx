"use client";

import { MessageCircle, Share2, Users } from "lucide-react";
import { getAppBaseUrl } from "@/lib/constants";
import {
  joinDeepLink,
  referralShareMessage,
  whatsappShareUrl,
} from "@/lib/utils";

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
  const link = joinDeepLink(memberCode);
  const message = referralShareMessage(practiceName, memberCode, firstName);
  const waUrl = whatsappShareUrl(message);

  const familyPack = [
    {
      label: "Invite spouse / partner",
      text: `${firstName} invited you (partner) to ${practiceName}!\n\nTap to join (REF-${memberCode}):\n${link}\n\n5% off first qualifying treatment + your own Gold Card.`,
    },
    {
      label: "Invite child / parent",
      text: `${firstName} invited you (family) to ${practiceName}!\n\nJoin with REF-${memberCode}:\n${link}`,
    },
    {
      label: "Invite a friend",
      text: `${firstName} invited you to ${practiceName}!\n\nREF-${memberCode}\n${link}`,
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
      <p className="text-center text-xs text-stone-500">
        Prefill code: <span className="font-mono text-amber-300">REF-{memberCode}</span>
        {" · "}
        <a href={`${origin}/refer/${memberCode}`} className="underline">
          web link
        </a>
      </p>

      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          <Users className="h-3.5 w-3.5" /> Invite family pack
        </p>
        <div className="flex flex-col gap-2">
          {familyPack.map((item) => (
            <a
              key={item.label}
              href={whatsappShareUrl(item.text)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-200 hover:bg-white/10"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-300" />
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
