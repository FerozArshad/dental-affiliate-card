import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "gold";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",
        variant === "primary" &&
          "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20",
        variant === "secondary" &&
          "bg-white/10 text-white hover:bg-white/15 border border-white/10",
        variant === "ghost" && "text-stone-300 hover:bg-white/5",
        variant === "gold" &&
          "bg-gradient-to-r from-amber-400 to-yellow-600 text-stone-950 hover:from-amber-300 hover:to-yellow-500 shadow-lg shadow-amber-500/20",
        className
      )}
      {...props}
    />
  );
}
