"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Send, ShieldCheck } from "lucide-react";
import { botRegister } from "@/lib/actions";

type Msg = { from: "bot" | "user"; text: string };

type Step = "name" | "email" | "phone" | "confirm" | "done" | "error";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isPhone(v: string) {
  return v.replace(/\D/g, "").length >= 7;
}

export function BotChat({
  practiceName,
  discountPercent,
  referrerCode,
  referrerName,
  relationshipDefault = "family",
}: {
  practiceName: string;
  discountPercent: number;
  referrerCode?: string;
  referrerName?: string;
  relationshipDefault?: string;
}) {
  const intro = referrerName
    ? `Hi! I'm the ${practiceName} assistant. ${referrerName} invited you to our Gold Card — you'll get ${discountPercent}% off your first treatment, and your own card to share with family.`
    : `Hi! I'm the ${practiceName} assistant. Join our Gold Card to get member discounts and refer family for ${discountPercent}% off — you earn stored discounts too (not cash).`;

  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: intro },
    {
      from: "bot",
      text: "By continuing you agree to our Privacy Policy and to receive WhatsApp messages about your Gold Card. You can reply STOP anytime to opt out.",
    },
    { from: "bot", text: "What's your full name?" },
  ]);
  const [step, setStep] = useState<Step>("name");
  const [input, setInput] = useState("");
  const [data, setData] = useState({ name: "", email: "", phone: "" });
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    memberCode: string;
    alreadyMember: boolean;
  } | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function pushBot(text: string) {
    setMessages((m) => [...m, { from: "bot", text }]);
  }
  function pushUser(text: string) {
    setMessages((m) => [...m, { from: "user", text }]);
  }

  async function handleSend() {
    const value = input.trim();
    if (!value || pending || step === "done") return;

    pushUser(value);
    setInput("");

    if (step === "name") {
      setData((d) => ({ ...d, name: value }));
      setTimeout(() => pushBot("Great! What's your email? (for your receipts & card)"), 250);
      setStep("email");
      return;
    }

    if (step === "email") {
      if (!isEmail(value)) {
        setTimeout(() => pushBot("Hmm, that doesn't look like a valid email. Please try again."), 250);
        return;
      }
      setData((d) => ({ ...d, email: value }));
      setTimeout(() => pushBot("Perfect. And your WhatsApp number?"), 250);
      setStep("phone");
      return;
    }

    if (step === "phone") {
      if (!isPhone(value)) {
        setTimeout(() => pushBot("Please enter a valid phone number (with country code if possible)."), 250);
        return;
      }
      const finalData = { ...data, phone: value };
      setData(finalData);
      setStep("confirm");
      setPending(true);
      pushBot("Registering you now...");

      const res = await botRegister({
        name: finalData.name,
        email: finalData.email,
        phone: finalData.phone,
        referrerCode,
        relationship: relationshipDefault,
      });

      setPending(false);

      if (res.error) {
        pushBot(`Sorry, something went wrong: ${res.error}. Please try again.`);
        setStep("phone");
        return;
      }

      if (res.alreadyMember) {
        pushBot(
          `You're already a member! Your Gold Card code is ${res.memberCode}. Opening your card...`
        );
      } else {
        pushBot(
          `You're registered! ✅\n\nYour Gold Card code: ${res.memberCode}\n${
            referrerName
              ? `You'll get ${discountPercent}% off your first visit (referred by ${referrerName}).`
              : `Refer family & friends to earn stored discounts.`
          }`
        );
        pushBot("Tap below to open your Gold Card and start sharing.");
      }

      setResult({
        memberCode: res.memberCode!,
        alreadyMember: !!res.alreadyMember,
      });
      setStep("done");
      return;
    }
  }

  return (
    <div className="mx-auto flex h-[560px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-stone-900 shadow-2xl">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-emerald-700/90 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Bot className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{practiceName}</p>
          <p className="text-xs text-emerald-100">Gold Card assistant · online</p>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#0b141a] px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.from === "user"
                  ? "rounded-br-sm bg-emerald-600 text-white"
                  : "rounded-bl-sm bg-stone-800 text-stone-100"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {result && (
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href={`/member/${result.memberCode}`}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 px-4 py-3 text-center text-sm font-semibold text-stone-950"
            >
              Open my Gold Card →
            </Link>
            <Link
              href={`/refer/${result.memberCode}`}
              className="text-center text-xs text-emerald-300 hover:underline"
            >
              Get my referral link
            </Link>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* input */}
      <div className="border-t border-white/10 bg-stone-900 px-3 py-3">
        {step === "done" ? (
          <p className="flex items-center justify-center gap-1 py-2 text-xs text-stone-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Registered securely — data stored with consent (GDPR)
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={pending}
              placeholder={
                step === "email"
                  ? "you@example.com"
                  : step === "phone"
                    ? "+44 7700 900000"
                    : "Type your answer..."
              }
              className="flex-1 rounded-full border border-white/10 bg-stone-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-stone-600 focus:border-emerald-500/50"
            />
            <button
              onClick={handleSend}
              disabled={pending || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
