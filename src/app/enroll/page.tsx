import { EnrollForm } from "@/components/enroll-form";

export default function EnrollPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Enroll patient</h1>
      <p className="mt-2 text-stone-400">
        Front desk flow — creates member, family group, and sends simulated
        WhatsApp welcome with Gold Card link.
      </p>
      <div className="mt-8">
        <EnrollForm />
      </div>
    </div>
  );
}
