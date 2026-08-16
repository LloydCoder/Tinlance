import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-16">
      <SignIn />
    </section>
  );
}
