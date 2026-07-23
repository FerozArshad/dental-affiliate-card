import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-stone-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Image
              src={BRAND.logo}
              alt={BRAND.name}
              width={160}
              height={64}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm text-stone-400">
              {BRAND.tagline}. Trusted dental care across Glasgow, Stirling &
              Falkirk since {BRAND.established}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-semibold text-white">Legal</p>
              <ul className="mt-3 space-y-2 text-stone-400">
                <li>
                  <Link href="/privacy" className="hover:text-teal-300">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-teal-300">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-teal-300">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">Programme</p>
              <ul className="mt-3 space-y-2 text-stone-400">
                <li>
                  <Link href="/join" className="hover:text-teal-300">
                    Join Gold Card
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-teal-300">
                    Practice dashboard
                  </Link>
                </li>
                <li>
                  <a
                    href={BRAND.website}
                    className="hover:text-teal-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Main website
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-stone-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.company}. All rights reserved.
          </p>
          <p>
            Rewards are stored treatment discounts (credit toward future
            treatment), not cash. UK GDPR compliant.
          </p>
        </div>
      </div>
    </footer>
  );
}
