import { EnrollForm } from "@/components/enroll-form";
import { getPracticePublic } from "@/lib/actions";

export default async function JoinPage() {
  const practice = await getPracticePublic();

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
          Walk-in join
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">
          Get your {practice.name} Gold Card
        </h1>
        <p className="mt-3 text-stone-400">
          Join in under a minute. Refer family for 5% off — earn stored discounts
          for your next treatment (not cash).
        </p>
      </div>
      <div className="mt-8">
        <EnrollForm />
      </div>
    </div>
  );
}
