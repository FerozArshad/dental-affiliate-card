export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: {updated}</p>
      <div className="legal prose mt-8 space-y-6 text-sm leading-relaxed text-stone-300">
        {children}
      </div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white">{heading}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
